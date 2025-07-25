import cv2
from ultralytics import YOLO
import torch
import time
device = '0' if torch.cuda.is_available() else 'cpu'
model = YOLO("my_model.pt").to(device)  #load the Model
def detect_frame(bgr_frame):
    # Detection
    results = model.predict(
        source=bgr_frame,
        imgsz=640,
        conf=0.5,
        device=device
    )
    return results[0].plot() 




"""
frame = cv2.imread("img1.png")
frame = cv2.resize(frame,(640,640))
start = time.time()    
detected_frame = detect_frame(frame)
end = time.time()
print(f"Time for One Frame {end-start}")
cv2.imshow('Reel Time Detection', detected_frame)
cv2.waitKey(0)
cv2.destroyAllWindows()
"""
