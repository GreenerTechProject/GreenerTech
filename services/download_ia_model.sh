#mkdir -p ia
curl -L -o dataset.zip "https://www.kaggle.com/api/v1/datasets/download/abdellahelazzaoui/tomato-2-verus-datasets-yolo-datasets"
unzip -o dataset.zip -d ia
rm dataset.zip

pip install -r requirements.txt
