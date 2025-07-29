#mkdir -p ia
curl -L -o ia/dataset.zip "https://www.kaggle.com/api/v1/datasets/download/abdellahelazzaoui/tomato-2-verus-datasets-yolo-datasets"
unzip -o ia/dataset.zip -d ia
rm ia/dataset.zip

pip install -r ia/requirements.txt
