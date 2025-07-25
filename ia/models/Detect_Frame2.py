import torch
import numpy as np
import cv2
from ultralytics import YOLO
from MaClass import TomatoClassifier,process_image
import time
def predict_frame(bgr_frame):
    classes =['Tomate malsaine','Tomate saine','Virus de la feuille jaune en boucle de la tomate','powdery_mildew']
    device = '0' if torch.cuda.is_available() else 'cpu'
    yolo = YOLO("my_model.pt").to(device)
    cnn = TomatoClassifier().to(device)
    cnn.load_state_dict(torch.load(f="best_modelV2.pth",map_location=device)["model_state_dict"])

    Billan_dicts ={
        'Tomate malsaine':0,
        'Tomate saine':0,
        'Virus de la feuille jaune en boucle de la tomate':0,
        'powdery_mildew':0
    }
    
    result = yolo.predict(source=bgr_frame,imgsz=640,conf=0.6,device=device)
    detected_frame=result[0].plot()
    for i,box in enumerate(result[0].boxes):
        x1,y1,x2,y2 = map(int,box.xyxy[0])
        info_img = bgr_frame[y1:y2,x1:x2]
        if info_img.size>0:
            #Redimentionemment
            h,w = info_img.shape[:2]
            scale=256/max(h,w)
            resized_img = cv2.resize(info_img,(int(scale*w),int(scale*h)))
            cnn.eval()
            tensor_img = process_image(resized_img)
            index = cnn(tensor_img).softmax(dim=1).argmax(dim=1).item()
            Billan_dicts[classes[index]]+=1

            
    return detected_frame,Billan_dicts



img =cv2.imread("img1.png",1)
img = cv2.resize(img,(640,640))
start = time.time()
detected_frame , Frame_dict = predict_frame(img)
end = time.time()
print(f"Time : {end - start}")
print(Frame_dict)
cv2.imshow("Detected Frame",detected_frame)
cv2.waitKey(0)
cv2.destroyAllWindows()

