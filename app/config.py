import os
import torch

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
WEIGHTS_DIR = os.path.join(BASE_DIR, 'weights')
SIAMESE_PATH = os.path.join(WEIGHTS_DIR, 'best_siamese_model_tuned100.pth')
BACKBONE_PATH = os.path.join(WEIGHTS_DIR, 'best_defect_classifier_flexible.pth')
PROTO_PATH = os.path.join(WEIGHTS_DIR, 'prototypes_flexible.pth')
TEMPLATES_DIR = os.path.join(BASE_DIR, 'PCB_Golden_Templates')
EXAMPLES_DIR = os.path.join(BASE_DIR, 'examples')

CLASS_TRANSLATION = {
    'missing_hole': 'Незапаянное место',
    'mouse_bite': 'Мышиный укус',
    'open_circuit': 'Обрыв цепи',
    'short': 'Замыкание',
    'spur': 'Заусенец',
    'spurious_copper': 'Лишняя медь',
    'Unknown': 'НЕИЗВЕСТНЫЙ ДЕФЕКТ'
}
