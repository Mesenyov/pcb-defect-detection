import cv2
import numpy as np
import base64
from PIL import Image, ImageDraw, ImageFont


def align_images(img_test, img_gold):
    """Выравнивание изображений (SIFT + Homography)"""
    if img_test is None: return img_gold
    if img_gold is None: return img_test

    try:
        gray_test = cv2.cvtColor(img_test, cv2.COLOR_BGR2GRAY)
        gray_gold = cv2.cvtColor(img_gold, cv2.COLOR_BGR2GRAY)

        detector = cv2.SIFT_create()
        kp1, des1 = detector.detectAndCompute(gray_test, None)
        kp2, des2 = detector.detectAndCompute(gray_gold, None)

        if des1 is None or des2 is None: return img_test

        matcher = cv2.BFMatcher()
        matches = matcher.knnMatch(des1, des2, k=2)

        good = []
        for m, n in matches:
            if m.distance < 0.75 * n.distance:
                good.append(m)

        if len(good) > 10:
            src_pts = np.float32([kp1[m.queryIdx].pt for m in good]).reshape(-1, 1, 2)
            dst_pts = np.float32([kp2[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)
            M, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)

            if M is None: return img_test
            h, w = img_gold.shape[:2]
            return cv2.warpPerspective(img_test, M, (w, h))
        return img_test
    except Exception as e:
        print(f"Alignment warning: {e}")
        return img_test


def image_to_base64(img_bgr):
    _, buffer = cv2.imencode('.jpg', img_bgr)
    return base64.b64encode(buffer).decode('utf-8')


def read_imagefile(file_bytes) -> np.ndarray:
    nparr = np.frombuffer(file_bytes, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)


def draw_text_rus(img_bgr, text, xy, text_color=(0, 0, 0), bg_color=None, font_size=20):
    """Рисует текст с поддержкой кириллицы и подложкой"""
    img_pil = Image.fromarray(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(img_pil)

    try:
        font = ImageFont.truetype("arial.ttf", font_size)
    except IOError:
        font = ImageFont.load_default()

    bbox = font.getbbox(text)
    text_width = bbox[2] - bbox[0]

    x, y = xy
    if bg_color is not None:
        pad_x, pad_y = 10, 5
        bg_rgb = bg_color[::-1]
        rect = (x - pad_x, y + bbox[1] - pad_y, x + text_width + pad_x, y + bbox[3] + pad_y)
        draw.rectangle(rect, fill=bg_rgb)

    text_rgb = text_color[::-1]
    draw.text(xy, text, font=font, fill=text_rgb)
    return cv2.cvtColor(np.array(img_pil), cv2.COLOR_RGB2BGR)