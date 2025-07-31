import cv2
import asyncio
import websockets
import json

host = "greenertech.mywire.org"


async def send_video():
    cap = cv2.VideoCapture(1)

    while True:
        try:
            print("Tentative de connexion au serveur vidéo...")
            video_uri = "ws://"+host+":8080/service/video_stream_handler"
            async with websockets.connect(video_uri) as websocket:
                print("Connecté au serveur vidéo avec succès")
                while True:
                    ret, frame = cap.read()
                    if not ret:
                        print("Échec de la lecture de la trame depuis la caméra")
                        break

                    _, buffer = cv2.imencode(".jpg", frame)
                    await websocket.send(buffer.tobytes())
                    await asyncio.sleep(0.03)  # ~30fps

        except (websockets.exceptions.ConnectionClosedError, ConnectionRefusedError) as e:
            print(f"❌ Connexion vidéo échouée ou perdue : {e}. Nouvelle tentative dans 2 secondes...")
            await asyncio.sleep(2)

        except Exception as e:
            print(f"❌ Erreur vidéo inattendue : {e}. Nouvelle tentative dans 2 secondes...")
            await asyncio.sleep(2)

async def receive_controls():
    while True:
        try:
            print("Tentative de connexion au serveur contrôle...")
            control_uri = "ws://"+host+":8080/service/control"
            async with websockets.connect(control_uri) as websocket:
                print("Connecté au serveur contrôle avec succès")
                async for message in websocket:

                    data = json.loads(message)
                    if "control_mode" in data:
                        print(f"Commande contrôle reçue: {data['control_mode']}")
        except (websockets.exceptions.ConnectionClosedError, ConnectionRefusedError) as e:
            print(f"❌ Connexion contrôle échouée ou perdue : {e}. Nouvelle tentative dans 2 secondes...")
            await asyncio.sleep(2)
        except Exception as e:
            print(f"❌ Erreur contrôle inattendue : {e}. Nouvelle tentative dans 2 secondes...")
            await asyncio.sleep(2)


import random

async def simulate_sensor_data():
    uri = "ws://"+host+":8080/service/sensor_data"
    async with websockets.connect(uri) as ws:
        while True:
            data = {
                "temperature": round(random.uniform(20, 30), 2),
                "humidity": round(random.uniform(50, 80), 2),
                "co2": round(random.uniform(300, 800), 2)
            }
            await ws.send(json.dumps(data))
            print(f"📤 Données envoyées : {data}")
            await asyncio.sleep(2)



import uuid
import os
import requests


REFERENCE_FILE = "robot_ref.txt"

def send_reference_to_api(reference):
    data = {"reference": reference}
    try:
        response = requests.post("http://"+host+":5000/api/robot", json=data)
        response.raise_for_status()
        print(f"Reference sent successfully: {response.status_code}")
    except requests.RequestException as e:
        print(f"Failed to send reference: {e}")

def get_or_create_robot_reference():
    if os.path.exists(REFERENCE_FILE):
        with open(REFERENCE_FILE, "r") as f:
            ref = f.read().strip()
            if ref:
                return ref

    # Generate new reference if not found
    new_ref = str(uuid.uuid4())
    with open(REFERENCE_FILE, "w") as f:
        f.write(new_ref)
    send_reference_to_api(new_ref)
    return new_ref
    
    
async def listen_missions(robot_reference):
    uri = f"ws://"+host+":8080/service/mission_data?reference={robot_reference}"
    async with websockets.connect(uri) as websocket:
        print(f"Connected to mission websocket for robot '{robot_reference}'")
        while True:
            msg = await websocket.recv()
            data = json.loads(msg)
            mission = data.get("mission")
            if mission:
                print("Received mission:", mission)
                # Here you can add code to handle the mission (e.g., start tasks)
            else:
                print("No mission at this time.")
            await asyncio.sleep(1)  # adjust sleep if needed



async def main():
    #robot_ref = "robot_123"
    robot_ref = get_or_create_robot_reference()
    await asyncio.gather(
        send_video(),
        receive_controls(),
        simulate_sensor_data(),
        listen_missions(robot_ref) )
    )

if __name__ == "__main__":
    asyncio.run(main())
