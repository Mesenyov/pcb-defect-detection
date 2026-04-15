import cv2
import torch
import torch.nn.functional as F
import numpy as np
import albumentations as A
from albumentations.pytorch import ToTensorV2

from app.config import (DEVICE, SIAMESE_PATH, BACKBONE_PATH, PROTO_PATH,
                        CLASS_DISPLAY_NAMES)
from app.models import SiameseUNet, DefectEmbedder
from app.utils import align_images, image_to_base64, draw_text_bg


class PCBInspector:
    def __init__(self, min_threshold=0.166):
        print(">>> Initializing models...")
        self.min_threshold = min_threshold
        self._load_models()
        self._setup_transforms()

    def _load_models(self):
        # 1. Siamese Detector
        self.detector = SiameseUNet().to(DEVICE)
        ckpt = torch.load(SIAMESE_PATH, map_location=DEVICE)
        if list(ckpt.keys())[0].startswith('module.'):
            ckpt = {k[7:]: v for k, v in ckpt.items()}
        self.detector.load_state_dict(ckpt)
        self.detector.eval()

        # 2. Metric Embedder
        self.embedder = DefectEmbedder().to(DEVICE)
        emb_ckpt = torch.load(BACKBONE_PATH, map_location=DEVICE)

        emb_state_dict = emb_ckpt.get('model_state_dict', emb_ckpt)

        if list(emb_state_dict.keys())[0].startswith('module.'):
            emb_state_dict = {k[7:]: v for k, v in emb_state_dict.items()}

        self.embedder.load_state_dict(emb_state_dict)
        self.embedder.eval()

        # 3. Class Prototypes
        proto_data = torch.load(PROTO_PATH, map_location=DEVICE)
        self.prototypes = proto_data['prototypes']
        self.thresholds = proto_data['thresholds']
        self.class_names = proto_data['class_names']

    def _setup_transforms(self):
        self.transform_siamese = A.Compose([
            A.Resize(512, 512),
            A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ToTensorV2()
        ], additional_targets={'image_golden': 'image'})

        self.transform_embedder = A.Compose([
            A.Resize(256, 256),
            A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ToTensorV2()
        ])

    def predict_and_visualize(self, test_img, gold_img):
        # Image alignment
        # test_img = align_images(test_img, gold_img)
        # if test_img is None: test_img = gold_img.copy()

        # Preprocessing
        test_rgb = cv2.cvtColor(test_img, cv2.COLOR_BGR2RGB)
        gold_rgb = cv2.cvtColor(gold_img, cv2.COLOR_BGR2RGB)
        orig_h, orig_w = test_rgb.shape[:2]

        # Detector Inference
        aug = self.transform_siamese(image=test_rgb, image_golden=gold_rgb)
        t_tens = aug['image'].unsqueeze(0).to(DEVICE)
        g_tens = aug['image_golden'].unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            logits = self.detector(t_tens, g_tens)
            probs = torch.sigmoid(logits)
            mask_raw = (probs > 0.5).float().cpu().numpy()[0, 0]

        # Mask Visualization
        mask_uint8 = cv2.resize((mask_raw * 255).astype(np.uint8), (orig_w, orig_h))
        heatmap = cv2.applyColorMap(mask_uint8, cv2.COLORMAP_JET)

        overlay_img = test_img.copy()
        mask_bool = mask_uint8 > 128
        if np.any(mask_bool):
            red_layer = np.zeros_like(overlay_img)
            red_layer[:] = (0, 0, 255)
            overlay_img[mask_bool] = cv2.addWeighted(overlay_img[mask_bool], 0.5, red_layer[mask_bool], 0.5, 0)

        # Defect Classification
        final_img = test_img.copy()
        contours, _ = cv2.findContours(mask_uint8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        detections = []

        if not contours:
            return self._build_response(test_img, gold_img, heatmap, overlay_img, final_img, detections)

        # Adaptive font scaling
        scale_factor = float(orig_w) / 1500.0
        adaptive_font = int(max(12.0, min(45.0, 25.0 * scale_factor)))
        adaptive_thick = int(max(1.0, min(5.0, 3.0 * scale_factor)))

        for cnt in contours:
            if cv2.contourArea(cnt) < 50: continue

            x, y, w, h = cv2.boundingRect(cnt)
            x1, y1 = max(0, x), max(0, y)
            x2, y2 = min(orig_w, x + w), min(orig_h, y + h)

            crop = test_rgb[y1:y2, x1:x2]
            if crop.size == 0: continue

            # Extract feature embeddings
            crop_tens = self.transform_embedder(image=crop)['image'].unsqueeze(0).to(DEVICE)
            with torch.no_grad():
                feat = self.embedder(crop_tens)
                feat = F.normalize(feat, p=2, dim=1).cpu()

            # ProtoNet
            best_dist, best_cls = 100.0, -1
            for cls_idx, proto in self.prototypes.items():
                if proto.device != feat.device: proto = proto.to(feat.device)
                dist = 1.0 - torch.mm(feat, proto.unsqueeze(1)).item()
                if dist < best_dist:
                    best_dist = dist
                    best_cls = cls_idx

            # Unknown defect identification
            final_thresh = max(self.thresholds[best_cls], self.min_threshold)
            is_unknown = best_dist > final_thresh
            raw_name = "Unknown" if is_unknown else self.class_names[best_cls]
            display_name = CLASS_DISPLAY_NAMES.get(raw_name, raw_name)

            # Visualization
            color = (0, 255, 255) if is_unknown else (0, 0, 255)
            cv2.rectangle(final_img, (x, y), (x + w, y + h), color, adaptive_thick)

            text_pos = (x, y - int(adaptive_font * 1.4) - adaptive_thick)
            if text_pos[1] < 0: text_pos = (x, y + h + adaptive_thick)

            final_img = draw_text_bg(final_img, display_name, text_pos, (0, 0, 0), color, adaptive_font)

            detections.append({"class": display_name, "is_unknown": is_unknown})

        return self._build_response(test_img, gold_img, heatmap, overlay_img, final_img, detections)

    def _build_response(self, test, gold, heat, over, final, dets):
        return {
            "verdict": f"Defects detected: {len(dets)}" if dets else "No defects detected",
            "has_defects": len(dets) > 0,
            "detections": dets,
            "images": {
                "test": image_to_base64(test),
                "template": image_to_base64(gold),
                "heatmap": image_to_base64(heat),
                "mask_overlay": image_to_base64(over),
                "final": image_to_base64(final)
            }
        }