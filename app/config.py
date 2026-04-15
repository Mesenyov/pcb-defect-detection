import os
import torch

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
WEIGHTS_DIR = os.path.join(BASE_DIR, 'weights')
SIAMESE_PATH = os.path.join(WEIGHTS_DIR, 'mobilenetv3_siamese_final.pth')
BACKBONE_PATH = os.path.join(WEIGHTS_DIR, 'mobilenetv3_large_100_cls.pth')
PROTO_PATH = os.path.join(WEIGHTS_DIR, 'mobilenetv3_large_100_protos.pth')
TEMPLATES_DIR = os.path.join(BASE_DIR, 'PCB_Golden_Templates')
EXAMPLES_DIR = os.path.join(BASE_DIR, 'examples')
RESULTS_DIR = os.path.join(BASE_DIR, 'static', 'results')

os.makedirs(RESULTS_DIR, exist_ok=True)

CLASS_DISPLAY_NAMES = {
    'en': {
        'missing_hole': 'Missing Hole',
        'mouse_bite': 'Mouse Bite',
        'open_circuit': 'Open Circuit',
        'short': 'Short',
        'spur': 'Spur',
        'spurious_copper': 'Spurious Copper',
        'Unknown': 'UNKNOWN DEFECT'
    },
    'ru': {
        'missing_hole': 'Отсутствие отверстия',
        'mouse_bite': 'Мышиный укус',
        'open_circuit': 'Разрыв цепи',
        'short': 'Короткое замыкание',
        'spur': 'Заусенец',
        'spurious_copper': 'Лишняя медь',
        'Unknown': 'НЕИЗВЕСТНЫЙ ДЕФЕКТ'
    }
}