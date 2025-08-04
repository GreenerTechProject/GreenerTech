#mkdir -p ia
curl -L -o dataset.zip "https://www.kaggle.com/api/v1/datasets/download/abdellahelazzaoui/tomato-2-verus-datasets-yolo-datasets"
unzip -o dataset.zip -d services
rm dataset.zip


mv ./services/Detect_Frame2.py ./services/classificationmaladies.py
mv ./services/ReelTime2Frame.py ./services/detectobjects.py

pip install -r services/requirements.txt