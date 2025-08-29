#!/usr/bin/env python3
import cv2
import asyncio
import websockets
import json

import serial


host = "greenertech.mywire.org"

AI_ENABLED = False



import os
import sys

# save current working directory
cwd = os.getcwd()

# change to ia/models so ALL.py can find the model file
os.chdir(os.path.join(cwd, '../../ia/models'))

# ensure this path is in sys.path for the import
if os.getcwd() not in sys.path:
    sys.path.insert(0, os.getcwd())

# import the functions
#from ALL import detect_frame, predict_frame
#from detectobjects import detect_frame, predict_frame

# return to original working directory
os.chdir(cwd)

"""
def usb_camera_pipeline(device=0, width=1280, height=720, fps=30):
    return (
        f"v4l2src device=/dev/video{device} ! "
        f"image/jpeg, width={width}, height={height}, framerate={fps}/1 ! "
        f"appsink drop=true max-buffers=1"
    )"""


def usb_camera_pipeline(device=0, width=1280, height=720, fps=30):
    return (
        f"v4l2src device=/dev/video{device} ! "
        f"image/jpeg, width={width}, height={height}, framerate={fps}/1 ! "
        f"jpegdec ! videoconvert ! video/x-raw, format=BGR ! "
        f"appsink drop=true max-buffers=1"
    )

"""
def usb_camera_pipeline(device=0, width=640, height=480, fps=10):
    return f"v4l2src device=/dev/video{device} ! video/x-raw, width={width}, height={height}, framerate={fps}/1 ! videoconvert ! video/x-raw, format=BGR ! appsink"
"""
"""
def gstreamer_pipeline(
    sensor_id=0,
    capture_width=640,
    capture_height=480,
    display_width=640,
    display_height=480,
    framerate=30,
    flip_method=0,
):
    return (
        f"nvarguscamerasrc sensor-id={sensor_id} ! "
        f"video/x-raw(memory:NVMM), width={capture_width}, height={capture_height}, "
        f"format=NV12, framerate={framerate}/1 ! "
        f"nvvidconv flip-method={flip_method} ! "
        f"video/x-raw, width={display_width}, height={display_height}, format=BGRx ! "
        f"videoconvert ! "
        f"video/x-raw, format=BGR ! appsink"
    )

"""

def gstreamer_pipeline(sensor_id=0, width=640, height=480, fps=30, flip_method=0):
    return (
        f"nvarguscamerasrc sensor-id={sensor_id} ! "
        f"video/x-raw(memory:NVMM), width=(int){width}, height=(int){height}, "
        f"format=NV12, framerate={fps}/1 ! "
        f"nvvidconv flip-method={flip_method} ! "
        f"video/x-raw, format=BGRx ! appsink"
    )







import aiohttp
from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack
from av import VideoFrame

class CameraVideoTrack(VideoStreamTrack):
    def __init__(self, device=0, width=1280, height=720, fps=30, type=0):
        super().__init__()
        if type == "usb" :
          pipeline = usb_camera_pipeline(device)
        else :
          pipeline = gstreamer_pipeline(device)

        #self.cap = cv2.VideoCapture(pipeline, cv2.CAP_GSTREAMER)
        self.cap = cv2.VideoCapture("/dev/video"+str(device), cv2.CAP_V4L2)
        
        fps = self.cap.get(cv2.CAP_PROP_FPS)
        print("FPS actuel:", fps)
        
        width = self.cap.get(cv2.CAP_PROP_FRAME_WIDTH)
        height = self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
        print(f"Resolution actuelle: {width}x{height}")

        #self.cap = cv2.VideoCapture(device)
        
        #self.cap = cv2.VideoCapture(pipeline, cv2.CAP_GSTREAMER)
        
        #self.cap = cv2.VideoCapture(device)
        #self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
        #self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
        #self.cap.set(cv2.CAP_PROP_FPS, fps)

    async def recv(self):
        global AI_ENABLED
        pts, time_base = await self.next_timestamp()
        ret, frame = self.cap.read()
        if not ret:
            raise Exception("❌ Failed to read from camera")
        
        #if AI_ENABLED:
        #    frame = detect_frame(frame)  # only apply detection when enabled
        #    bilan = predict_frame(frame)

        # BGR → RGB → VideoFrame
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        av_frame = VideoFrame.from_ndarray(frame_rgb, format="rgb24")
        av_frame.pts = pts
        av_frame.time_base = time_base
        return av_frame

async def send_video(robot_ref, camera, idcamera, type=0):
    pc = RTCPeerConnection()
    pc.addTrack(CameraVideoTrack(device=idcamera, type=0))

    offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    try:
        print("Tentative de connexion au serveur vidéo...")
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"http://{host}:8080/service/video_stream_handler?robot={robot_ref}&camera={camera}",
                json={"offer": {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}},
            ) as resp:
                answer = await resp.json()

        await pc.setRemoteDescription(
            RTCSessionDescription(sdp=answer["sdp"], type=answer["type"])
        )

        print("✅ WebRTC connection established with server")

        await asyncio.Future()
    
    except (websockets.exceptions.ConnectionClosedError, ConnectionRefusedError) as e:
        print(f"❌ Connexion video échouée ou perdue : {e}. Nouvelle tentative dans 2 secondes...")
        await asyncio.sleep(2)
    except Exception as e:
        print(f"❌ Erreur video inattendue : {e}. Nouvelle tentative dans 2 secondes...")
        await asyncio.sleep(2)

"""
async def send_video(robot_ref, camera, idcamera, type=0):

    if type == "usb" :
      pipeline = usb_camera_pipeline(idcamera)
    else :
      pipeline = gstreamer_pipeline(idcamera)

    cap = cv2.VideoCapture(pipeline, cv2.CAP_GSTREAMER)

    while True:
        try:
            print("Tentative de connexion au serveur vidéo...")
            video_uri = "ws://"+host+":8080/service/video_stream_handler?robot="+robot_ref+"&camera="+camera
            async with websockets.connect(video_uri) as websocket:
                print("Connecté au serveur vidéo avec succès")
                while True:
                    ret, frame = cap.read()
                    if not ret:
                        print("Échec de la lecture de la trame depuis la caméra")
                        break

                    #_, buffer = cv2.imencode(".jpg", frame)
                    #await websocket.send(buffer.tobytes())
                    await websocket.send(frame.tobytes())
                    await asyncio.sleep(0.03)  # 1/0.03=33 ~30fps
                    #await asyncio.sleep(0.06)  # 1/0.06=16 ~15fps
                    #await asyncio.sleep(0.12)  # 1/0.12=8 ~8

        except (websockets.exceptions.ConnectionClosedError, ConnectionRefusedError) as e:
            print(f"❌ Connexion vidéo échouée ou perdue : {e}. Nouvelle tentative dans 2 secondes...")
            await asyncio.sleep(2)

        except Exception as e:
            print(f"❌ Erreur vidéo inattendue : {e}. Nouvelle tentative dans 2 secondes...")
            await asyncio.sleep(2)
"""

# import asyncio
# import websockets
# import serial
# import json

# # Configuration du port série (à adapter selon ton OS ou port réel)
try:
    arduino = serial.Serial('/dev/ttyACM0', 9600)
    arduino.write(("STOP\n").encode())
    print("✅ Port série vers Arduino ouvert.")
except Exception as e:
    print(f"❌ Erreur ouverture port série : {e}")
    arduino = None

# host = "192.168.10.237" # adresse IP de ton serveur de contrôle ou localhost si en local

# async def receive_controls():
#     while True:
#         try:
#             print("Tentative de connexion au serveur contrôle...")
#             control_uri = f"ws://{host}:8080/service/control"
#             async with websockets.connect(control_uri) as websocket:
#                 print("✅ Connecté au serveur contrôle.")
#                 async for message in websocket:
#                     print("Message reçu du serveur contrôle :", message)
#                     try:
#                         data = json.loads(message)
#                         if "control_mode" in data:
#                             commande = data["control_mode"]
#                             print(f"➡️ Commande contrôle reçue : {commande}")

#                             if arduino and arduino.is_open:
#                                 arduino.write((commande + "\n").encode())
#                                 print("✅ Commande envoyée à Arduino.")
#                             else:
#                                 print("⚠️ Port série non disponible.")
#                     except json.JSONDecodeError:
#                         print("❌ Erreur de décodage JSON.")
#         except (websockets.exceptions.ConnectionClosedError, ConnectionRefusedError) as e:
#             print(f"❌ Connexion contrôle échouée/perdue : {e} → Nouvelle tentative dans 2 sec.")
#             await asyncio.sleep(2)
#         except Exception as e:
#             print(f"❌ Erreur inattendue : {e} → Nouvelle tentative dans 2 sec.")
#             await asyncio.sleep(2)

# async def main():
#     #robot_ref = "robot_123"

#     await asyncio.gather(
#         receive_controls()
#     )



# Ouvre le port série vers Arduino (adapter le port si besoin)
#arduino = serial.Serial('/dev/ttyACM0', 9600)

async def receive_controls(robot_ref):
    global AI_ENABLED
    while True:
        try:
            print("Tentative de connexion au serveur contrôle...")
            control_uri = "ws://"+host+":8080/service/control?robot="+robot_ref
            async with websockets.connect(control_uri) as websocket:
                print("Connecté au serveur contrôle avec succès")
                async for message in websocket:

                    data = json.loads(message)
                    if "control_mode" in data:
                        print(f"Commande contrôle reçue: {data['control_mode']}")
                        

                        if data['control_mode'] == "ENABLE_AI":
                            AI_ENABLED = True
                        elif data['control_mode'] == "DISABLE_AI":
                            AI_ENABLED = False


                        arduino.write((data['control_mode'] + "\n").encode())


        except (websockets.exceptions.ConnectionClosedError, ConnectionRefusedError) as e:
            arduino.write(("STOP" + "\n").encode())
            print(f"❌ Connexion contrôle échouée ou perdue : {e}. Nouvelle tentative dans 2 secondes...")
            await asyncio.sleep(2)
        except Exception as e:
            arduino.write(("STOP" + "\n").encode())
            print(f"❌ Erreur contrôle inattendue : {e}. Nouvelle tentative dans 2 secondes...")
            await asyncio.sleep(2)




import rclpy
from rclpy.node import Node
from std_msgs.msg import String

import re

# -------------------- Sensor Data --------------------
class SensorDataNode(Node):
    def __init__(self, robot_ref):
        super().__init__('sensor_data_node')
        self.buffer = {}
        self.measurement_id = 0
        
        self.subscription = self.create_subscription(
            String,
            'arduino_data',
            self.send_ws,
            10
        )
        self.ws = None
        self.uri = f"ws://{host}:8080/service/sensor_data?robot="+robot_ref
        

    async def connect_ws(self):
        while self.ws is None:
            try:
                print("Tentative de connexion au serveur sensors...")
                self.ws = await websockets.connect(self.uri)
                print("Sensor WebSocket connected")
            except Exception as e:
                print(f"Sensor WS error: {e}. Retry in 2s...")
                await asyncio.sleep(2)

    #def send_ws(self, msg: String):
    #    asyncio.create_task(self._send(msg))
    
    

    def send_ws(self, msg: String):
        line = msg.data.strip()

        if line.startswith("------ Nouvelle mesure ------"):
            self.measurement_id += 1
            self.buffer[self.measurement_id] = {}

        elif line.startswith("🌡 Température"):
            m_temp = re.search(r"Température:\s*([\d.]+)", line)
            m_hum = re.search(r"Humidité:\s*([\d.]+)", line)
            if m_temp and m_hum:
                self.buffer[self.measurement_id]["temperature"] = float(m_temp.group(1))
                self.buffer[self.measurement_id]["humidity"] = float(m_hum.group(1))
            else:
                self.buffer[self.measurement_id]["temperature"] = None
                self.buffer[self.measurement_id]["humidity"] = None

        #elif line.startswith("MQ135"):
        #    m = re.search(r"MQ135.*:\s*(\d+)", line)
        #    if m:
        #        self.buffer[self.measurement_id]["co2"] = int(m.group(1))
        #    else:
        #        self.buffer[self.measurement_id]["co2"] = None
        #
        #elif line.startswith("Lumière"):
        #    m = re.search(r"Lumière.*:\s*(\d+)", line)
        #    if m:
        #        self.buffer[self.measurement_id]["luminosite"] = int(m.group(1))
        #    else:
        #        self.buffer[self.measurement_id]["luminosite"] = None
        
        elif line.startswith("MQ135"):
            m = re.search(r"MQ135.*:\s*(\d+)\s*\|\s*Etat:\s*(.+)", line)
            if m:
                self.buffer[self.measurement_id]["co2"] = int(m.group(1))
                self.buffer[self.measurement_id]["co2_etat"] = m.group(2).strip()
            else:
                self.buffer[self.measurement_id]["co2"] = None
                self.buffer[self.measurement_id]["co2_etat"] = None

        elif line.startswith("Lumière"):
            m = re.search(r"Lumière.*:\s*(\d+)\s*\|\s*Etat:\s*(.+)", line)
            if m:
                self.buffer[self.measurement_id]["luminosite"] = int(m.group(1))
                self.buffer[self.measurement_id]["luminosite_etat"] = m.group(2).strip()
            else:
                self.buffer[self.measurement_id]["luminosite"] = None
                self.buffer[self.measurement_id]["luminosite_etat"] = None
                

        elif line.startswith("Accel"):
            m = re.findall(r"-?\d+", line)
            self.buffer[self.measurement_id]["accel"] = [int(x) for x in m]

        elif line.startswith("Gyro"):
            m = re.findall(r"-?\d+", line)
            self.buffer[self.measurement_id]["gyro"] = [int(x) for x in m]

        elif line.startswith("--------------------------"):
            asyncio.create_task(self._send_json(self.buffer[self.measurement_id]))
            del self.buffer[self.measurement_id]

    async def _send_json(self, data_dict):
        try:
            if self.ws:
                json_data = json.dumps(data_dict)
                print(f"Envoi JSON: {json_data}")
                await self.ws.send(json_data)
                
        except Exception as e:
            print(f"Error sending sensor data via WS: {e}")
            self.ws = None
            asyncio.create_task(self.connect_ws())

"""
async def spin_sensor_node(robot_ref):
    rclpy.init(args=None)
    node = SensorDataNode(robot_ref)
    await node.connect_ws()

    loop = asyncio.get_running_loop()
    await loop.run_in_executor(None, rclpy.spin, node)
"""

async def spin_sensor_node(node):
    while rclpy.ok():
        rclpy.spin_once(node, timeout_sec=0.1)
        await asyncio.sleep(0.01)


import random

async def simulate_sensor_data(robot_ref):
    uri = "ws://"+host+":8080/service/sensor_data?robot="+robot_ref
    try:
        print("Tentative de connexion au serveur sensors...")
        async with websockets.connect(uri) as ws:
            while True:
                data = {
                    "temperature": round(random.uniform(20, 60), 2),
                    "humidity": round(random.uniform(50, 80), 2),
                    "co2": round(random.uniform(300, 800), 2),
                    "luminosite": round(random.uniform(100, 1000), 2),
                    "x": round(random.uniform(-180.0, 180.0), 6),  # longitude
                    "y": round(random.uniform(-90.0, 90.0), 6)     # latitude
                }
                await ws.send(json.dumps(data))
                #print(f"📤 Données envoyées : {data}")
                await asyncio.sleep(2)


    except (websockets.exceptions.ConnectionClosedError, ConnectionRefusedError) as e:
        #arduino.write(("STOP" + "\n").encode())
        print(f"❌ Connexion sensors échouée ou perdue : {e}. Nouvelle tentative dans 2 secondes...")
        await asyncio.sleep(2)
    except Exception as e:
        #arduino.write(("STOP" + "\n").encode())
        print(f"❌ Erreur sensors inattendue : {e}. Nouvelle tentative dans 2 secondes...")
        await asyncio.sleep(2)



import uuid
import os
import requests


REFERENCE_FILE = "robot_ref.txt"

def send_referance_to_api(referance):
    data = {"nom": "R1", "referance": referance}
    try:
        response = requests.post("http://"+host+":5000/api/robot", json=data)
        response.raise_for_status()
        print(f"Reference sent successfully: {response.status_code}")
    except requests.RequestException as e:
        print(f"Failed to send referance: {e}")

def get_or_create_robot_referance():
    if os.path.exists(REFERENCE_FILE):
        with open(REFERENCE_FILE, "r") as f:
            ref = f.read().strip()
            if ref:
                return ref

    # Generate new referance if not found
    new_ref = str(uuid.uuid4())
    send_referance_to_api(new_ref)
    with open(REFERENCE_FILE, "w") as f:
        f.write(new_ref)
    return new_ref


#async def listen_missions(robot_referance):
#    uri = f"ws://"+host+":8080/service/missions?referance={robot_referance}"
#    async with websockets.connect(uri) as websocket:
#        print(f"Connected to mission websocket for robot '{robot_referance}'")
#        while True:
#            msg = await websocket.recv()
#            data = json.loads(msg)
#            mission = data.get("mission")
#            if mission:
#                print("Received mission:", mission)
#                # Here you can add code to handle the mission (e.g., start tasks)
#            else:
#                print("No mission at this time.")
#            await asyncio.sleep(1)  # adjust sleep if needed



async def listen_missions(robot_referance):
    while True:
        try:
            print("Tentative de connexion au serveur mission...")
            control_uri = "ws://"+host+":8080/service/missions?referance="+robot_referance
            async with websockets.connect(control_uri) as websocket:
                print(f"Connected to mission websocket for robot '{robot_referance}'")
                async for msg in websocket:

                    #data = json.loads(msg)
                    data = msg
                    #mission = data.get("mission")
                    mission = data
                    if mission:
                        print("Received mission:", mission)
                        # Here you can add code to handle the mission (e.g., start tasks)

                        # Ouvre le port série vers Arduino (adapter le port si besoin)
                        #arduino = serial.Serial('/dev/ttyACM0', 9600)
                        #arduino.write((mission+ "\n").encode())
                        arduino.write(("LEFT"+ "\n").encode())
                    else:
                        print("No mission at this time.")
        except (websockets.exceptions.ConnectionClosedError, ConnectionRefusedError) as e:
            print(f"❌ Connexion mission échouée ou perdue : {e}. Nouvelle tentative dans 2 secondes...")
            await asyncio.sleep(2)
        except Exception as e:
            print(f"❌ Erreur mission inattendue : {e}. Nouvelle tentative dans 2 secondes...")
            await asyncio.sleep(2)


"""
async def main():
    #robot_ref = "robot_123"
    robot_ref = get_or_create_robot_referance()
    await asyncio.gather(
#        send_video(robot_ref, "right", 0, "usb"),
#        send_video(robot_ref, "left", 1, "usb"),
        receive_controls(robot_ref),
        #simulate_sensor_data(robot_ref),
        spin_sensor_node(robot_ref),
        listen_missions(robot_ref)
        )
"""

"""
async def main():
    robot_ref = get_or_create_robot_referance()
    node = SensorDataNode(robot_ref)
    await node.connect_ws()
    await asyncio.gather(
        receive_controls(robot_ref),
        spin_sensor_node(node)
    )
"""
"""
async def main():
    robot_ref = get_or_create_robot_referance()
    node = SensorDataNode(robot_ref)  # <-- هنا الخطأ
    await node.connect_ws()
    await asyncio.gather(
        receive_controls(robot_ref),
        spin_sensor_node(node)
    )
"""


async def main():
    rclpy.init()
    try:
        robot_ref = get_or_create_robot_referance()
        node = SensorDataNode(robot_ref)
        await node.connect_ws()
        await asyncio.gather(
            send_video(robot_ref, "right", 0, "usb"),
    #        send_video(robot_ref, "left", 1, "usb"),
            receive_controls(robot_ref),
            #simulate_sensor_data(robot_ref),
            spin_sensor_node(node),
            listen_missions(robot_ref)
        )
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == "__main__":
    asyncio.run(main())