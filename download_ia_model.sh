#mkdir -p ia
curl -L -o dataset.zip "https://www.kaggle.com/api/v1/datasets/download/abdellahelazzaoui/tomato-2-verus-datasets-yolo-datasets"
unzip -o dataset.zip -d ia/models
rm dataset.zip


#mv ./ia/models/Detect_Frame2.py ./ia/models/classificationmaladies.py
#mv ./ia/models/ReelTime2Frame.py ./ia/models/detectobjects.py

pip install -r ia/models/requirements.txt