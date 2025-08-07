import cv2
import threading
import websocket
import json
import time
import random
import uuid
import os
import requests

host = "greenertech.mywire.org"
REFERENCE_FILE = "robot_ref.txt"


def send_video():
    cap = cv2.VideoCapture(1)
    while True:
        try:
            print("Tentative de connexion au serveur vidéo...")
            ws = websocket.create_connection("ws://" + host + ":8080/service/video_stream_handler")
            print("Connecté au serveur vidéo avec succès")

            while True:
                ret, frame = cap.read()
                if not ret:
                    print("Échec de la lecture de la trame depuis la caméra")
                    break

                _, buffer = cv2.imencode(".jpg", frame)
                ws.send_binary(buffer.tobytes())
                time.sleep(0.03)

        except Exception as e:
            print("❌ Erreur vidéo :", e)
            time.sleep(2)


def receive_controls():
    while True:
        try:
            print("Tentative de connexion au serveur contrôle...")
            ws = websocket.create_connection("ws://" + host + ":8080/service/control")
            print("Connecté au serveur contrôle avec succès")

            while True:
                message = ws.recv()
                data = json.loads(message)
                if "control_mode" in data:
                    print("Commande contrôle reçue:", data["control_mode"])
                    # Envoyer au port série si disponible
                    # arduino.write(data['control_mode'] + "\n")

        except Exception as e:
            print("❌ Erreur contrôle :", e)
            time.sleep(2)


def simulate_sensor_data():
    while True:
        try:
            ws = websocket.create_connection("ws://" + host + ":8080/service/sensor_data")
            while True:
                data = {
                    "temperature": round(random.uniform(20, 30000), 2),
                    "humidity": round(random.uniform(50, 80), 2),
                    "co2": round(random.uniform(300, 800), 2),
                    "luminosite": round(random.uniform(100, 1000), 2),
                    "x": round(random.uniform(-180.0, 180.0), 6),
                    "y": round(random.uniform(-90.0, 90.0), 6)
                }
                ws.send(json.dumps(data))
                time.sleep(2)
        except Exception as e:
            print("❌ Erreur sensor_data :", e)
            time.sleep(2)


def send_referance_to_api(referance):
    data = {"nom": "R1", "referance": referance}
    try:
        response = requests.post("http://" + host + ":5000/api/robot", json=data)
        print("Reference sent successfully:", response.status_code)
    except requests.RequestException as e:
        print("Failed to send referance:", e)


def get_or_create_robot_referance():
    if os.path.exists(REFERENCE_FILE):
        with open(REFERENCE_FILE, "r") as f:
            ref = f.read().strip()
            if ref:
                return ref

    new_ref = str(uuid.uuid4())
    send_referance_to_api(new_ref)
    with open(REFERENCE_FILE, "w") as f:
        f.write(new_ref)
    return new_ref


def listen_missions(robot_ref):
    while True:
        try:
            print("Tentative de connexion au serveur mission...")
            ws = websocket.create_connection("ws://" + host + ":8080/service/missions?referance=" + robot_ref)
            print("Connecté au serveur mission avec succès")

            while True:
                msg = ws.recv()
                data = json.loads(msg)
                mission = data.get("mission")
                if mission:
                    print("Mission reçue:", mission)
                    # arduino.write(mission + "\n")
                else:
                    print("Aucune mission actuellement.")
                time.sleep(1)
        except Exception as e:
            print("❌ Erreur mission :", e)
            time.sleep(2)


def main():
    robot_ref = get_or_create_robot_referance()

    threads = [
        threading.Thread(target=send_video),
        threading.Thread(target=receive_controls),
        threading.Thread(target=simulate_sensor_data),
        threading.Thread(target=listen_missions, args=(robot_ref,))
    ]

    for t in threads:
        t.daemon = True
        t.start()

    while True:
        time.sleep(1)


if __name__ == "__main__":
    main()
