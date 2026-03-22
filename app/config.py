import os
import torch

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
WEIGHTS_DIR = os.path.join(BASE_DIR, 'weights')
SIAMESE_PATH = os.path.join(WEIGHTS_DIR, 'mobilenetv3_siamese_final.pth')
BACKBONE_PATH = os.path.join(WEIGHTS_DIR, 'best_defect_classifier_flexible.pth')
PROTO_PATH = os.path.join(WEIGHTS_DIR, 'prototypes_flexible.pth')
TEMPLATES_DIR = os.path.join(BASE_DIR, 'PCB_Golden_Templates')
EXAMPLES_DIR = os.path.join(BASE_DIR, 'examples')

CLASS_DISPLAY_NAMES = {
    'missing_hole': 'Missing Hole',
    'mouse_bite': 'Mouse Bite',
    'open_circuit': 'Open Circuit',
    'short': 'Short Circuit',
    'spur': 'Spur',
    'spurious_copper': 'Spurious Copper',
    'Unknown': 'UNKNOWN DEFECT'
}