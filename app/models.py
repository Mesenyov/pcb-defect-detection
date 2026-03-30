import torch
import torch.nn as nn
import timm


class DoubleConv(nn.Module):
    def __init__(self, in_channels, out_channels):
        super().__init__()
        self.double_conv = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_channels), nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_channels), nn.ReLU(inplace=True)
        )

    def forward(self, x): return self.double_conv(x)


class SiameseUNet(nn.Module):
    def __init__(self):
        super().__init__()

        self.encoder = timm.create_model(
            'mobilenetv3_large_100',
            pretrained=False,
            features_only=True,
            out_indices=[1, 2, 3]
        )

        f_channels = self.encoder.feature_info.channels()
        c1, c2, c3 = f_channels[0], f_channels[1], f_channels[2]

        self.bot_conv = DoubleConv(c3, 128)

        self.up1 = nn.Upsample(scale_factor=2, mode='bilinear', align_corners=True)
        self.dec1 = DoubleConv(128 + c2, 64)

        self.up2 = nn.Upsample(scale_factor=2, mode='bilinear', align_corners=True)
        self.dec2 = DoubleConv(64 + c1, 32)

        self.up3 = nn.Upsample(scale_factor=2, mode='bilinear', align_corners=True)
        self.dec3 = DoubleConv(32, 16)

        self.up4 = nn.Upsample(scale_factor=2, mode='bilinear', align_corners=True)
        self.final_conv = nn.Conv2d(16, 1, kernel_size=1)

    def forward_features(self, x):
        return self.encoder(x)

    def forward(self, test_img, gold_img):
        ft_test = self.forward_features(test_img)
        ft_gold = self.forward_features(gold_img)

        # Compute absolute feature difference
        diffs = [torch.abs(ft_test[i] - ft_gold[i]) for i in range(len(ft_test))]
        d1, d2, d3 = diffs[0], diffs[1], diffs[2]

        # Decoder forward pass
        x = self.bot_conv(d3)

        x = self.up1(x)
        x = torch.cat([x, d2], dim=1)
        x = self.dec1(x)

        x = self.up2(x)
        x = torch.cat([x, d1], dim=1)
        x = self.dec2(x)

        x = self.up3(x)
        x = self.dec3(x)

        x = self.up4(x)
        logits = self.final_conv(x)

        return logits


class DefectEmbedder(nn.Module):
    def __init__(self):
        super().__init__()
        self.backbone = timm.create_model('mobilenetv3_large_100', pretrained=False, num_classes=0)

    def forward(self, x): return self.backbone(x)