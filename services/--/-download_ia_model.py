import os
import requests
from zipfile import ZipFile
from io import BytesIO

# URL to download
url = "https://www.kaggle.com/api/v1/datasets/download/abdellahelazzaoui/tomato-2-verus-datasets-yolo-datasets"

# Target folder
target_folder = "ia"
os.makedirs(target_folder, exist_ok=True)

# Download the file
print("Downloading dataset...")
response = requests.get(url)
response.raise_for_status()  # Raise error if download failed

# Assuming the file is a zip archive in the response content
print("Extracting dataset...")
with ZipFile(BytesIO(response.content)) as zip_file:
    zip_file.extractall(path=target_folder)

print(f"Dataset downloaded and extracted to '{target_folder}' folder.")
