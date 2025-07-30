import torch
from torch import nn
import torchvision
from torchvision import transforms
import cv2
from PIL import Image
class TomatoClassifier(nn.Module):
    def __init__(self):
        super().__init__()
        hidden_units = 64

        self.features = nn.Sequential(
            # Bloc 1
            nn.Conv2d(3, hidden_units, 3, padding=1),
            nn.ReLU(),
            nn.BatchNorm2d(hidden_units),
            nn.Conv2d(hidden_units, hidden_units, 3, padding=1),
            nn.ReLU(),
            nn.BatchNorm2d(hidden_units),
            nn.MaxPool2d(2),
            nn.Dropout(0.3),

            # Bloc 2
            nn.Conv2d(hidden_units, hidden_units*2, 3, padding=1),
            nn.ReLU(),
            nn.BatchNorm2d(hidden_units*2),
            nn.Conv2d(hidden_units*2, hidden_units*2, 3, padding=1),
            nn.ReLU(),
            nn.BatchNorm2d(hidden_units*2),
            nn.MaxPool2d(2),
            nn.Dropout(0.3),

            # Bloc 3 (nouveau)
            nn.Conv2d(hidden_units*2, hidden_units*4, 3, padding=1),
            nn.ReLU(),
            nn.BatchNorm2d(hidden_units*4),
            nn.Conv2d(hidden_units*4, hidden_units*4, 3, padding=1),
            nn.ReLU(),
            nn.BatchNorm2d(hidden_units*4),
            nn.MaxPool2d(2),
            nn.Dropout(0.3),

            # Bloc 4 (inspiré de TomatoDiseaseClassifier)
            nn.Conv2d(hidden_units*4, hidden_units*8, 3, padding=1),
            nn.ReLU(),
            nn.BatchNorm2d(hidden_units*8),
            nn.AdaptiveAvgPool2d((7, 7))
        )

        self.classifier = nn.Sequential(
            nn.Linear(hidden_units*8*7*7, 512),
            nn.ReLU(),
            nn.LayerNorm(512),  # Meilleur que BatchNorm1d pour petits batches
            nn.Dropout(0.5),
            nn.Linear(512, 4)
        )

    def forward(self, x):
        x = self.features(x)
        x = x.view(x.size(0), -1)
        x = self.classifier(x)
        return x
    

transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(256),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])


def process_image(bgr_img):
    img = cv2.cvtColor(bgr_img,cv2.COLOR_BGR2RGB)
    img_pil = Image.fromarray(img)
    img_tensor = transform(img_pil).unsqueeze(0)
    return img_tensor