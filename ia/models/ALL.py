import cv2
from ultralytics import YOLO
import torch
from MaClass import TomatoClassifier,process_image
device = '0' if torch.cuda.is_available() else 'cpu'
model = YOLO("my_model.pt").to(device)  #load the Model
#model = YOLO("new_yolo_model.pt").to(device)  #load the Model
"""
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
def detect_frame(bgr_frame):
    bgr_frame = cv2.resize(bgr_frame,(640,640))
    results = model(bgr_frame)
    for result in results:
        boxes = result.boxes.xyxy.cpu().numpy()
        classes = result.boxes.cls.cpu().numpy()
        confidences = result.boxes.conf.cpu().numpy()
        for box,cls,conf in zip(boxes,classes,confidences):
            if conf>0.5:
                x1,y1,x2,y2=map(int,box)
                cv2.rectangle(bgr_frame,(x1,y1),(x2,y2),(255,0,0),2)
                cv2.rectangle(bgr_frame,(x1,y1-25),(x1+80,y1),(255,0,0),-1)
                cv2.putText(bgr_frame,str(model.names[int(cls)]),(x1,y1-5),cv2.FONT_HERSHEY_SIMPLEX,0.7,(255,255,255),2)

    return bgr_frame 

yolo = model
def predict_frame(bgr_frame):
    #device = '0' if torch.cuda.is_available() else 'cpu'
    #yolo = YOLO("new_yolo_model.pt").to(device)
    cnn_classes =['Tomate malsaine','Tomate saine','Virus de la feuille jaune en boucle de la tomate','powdery_mildew']
    cnn = TomatoClassifier().to(device)
    cnn.load_state_dict(torch.load(f="best_modelV2.pth",map_location=device)["model_state_dict"])

    Billan_dicts ={
        'Tomate malsaine':0,
        'Tomate saine':0,
        'Virus de la feuille jaune en boucle de la tomate':0,
        'powdery_mildew':0
    }
    frame_yolo = cv2.resize(bgr_frame,(640,640))
    results = yolo(frame_yolo)
    for result in results:
        boxes = result.boxes.xyxy.cpu().numpy()
        classes = result.boxes.cls.cpu().numpy()
        confidences = result.boxes.conf.cpu().numpy()
        for box,cls,conf in zip(boxes,classes,confidences):
            if conf>0.5:
                x1,y1,x2,y2=map(int,box)
                info_img = frame_yolo[y1:y2,x1:x2]
                if info_img.size>0:
                    #Redimentionemment
                    h,w = info_img.shape[:2]
                    scale=256/max(h,w)
                    resized_img = cv2.resize(info_img,(int(scale*w),int(scale*h)))
                    cnn.eval()
                    tensor_img = process_image(resized_img)
                    index = cnn(tensor_img).softmax(dim=1).argmax(dim=1).item()
                    #Billan_dicts[classes[int(index)]]+=1
                    #print(index,cnn_classes[index])
                    if yolo.names[int(cls)] == "Tomato":
                        if cnn_classes[index] in ['Tomate malsaine','Tomate saine']:
                            Billan_dicts[cnn_classes[index]]+=1
                    elif yolo.names[int(cls)] == "Leaf":
                        if cnn_classes[index] in ['Virus de la feuille jaune en boucle de la tomate','powdery_mildew']:
                            Billan_dicts[cnn_classes[index]]+=1

                #cv2.rectangle(frame_yolo,(x1,y1),(x2,y2),(255,0,0),2)
                #cv2.rectangle(frame_yolo,(x1,y1-25),(x1+80,y1),(255,0,0),-1)
                #cv2.putText(frame_yolo,str(yolo.names[int(cls)]),(x1,y1-5),cv2.FONT_HERSHEY_SIMPLEX,0.7,(255,255,255),2)
    
    return Billan_dicts

"""
img = cv2.imread("img1.png",1)
dct = predict_frame(img)
detect = detect_frame(img)
print(dct)
cv2.imshow("Frame",detect)
cv2.waitKey(0)
cv2.destroyAllWindows()
"""