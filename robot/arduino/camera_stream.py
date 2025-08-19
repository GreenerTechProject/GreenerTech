# Python 2 compatible code
import threading
import time
import json
import random
import uuid
import os
import requests
import base64

import websocket
import gi

gi.require_version('Gst', '1.0')
from gi.repository import Gst, GLib

# Initialize GStreamer
Gst.init(None)

host = "greenertech.mywire.org"
REFERENCE_FILE = "robot_ref.txt"

# -------------------- Video Streaming --------------------
def send_video():
    uri = "ws://{}:8080/service/video_stream_handler".format(host)

    # Pipeline GStreamer: capture CSI, encode en JPEG, sortie appsink
    pipeline_str = (
        "nvarguscamerasrc sensor-id=0 ! "
        "video/x-raw(memory:NVMM), width=640, height=480, framerate=15/1 ! "
        "nvjpegenc ! "
        "appsink name=sink emit-signals=true max-buffers=1 drop=true"
    )

    pipeline = Gst.parse_launch(pipeline_str)
    appsink = pipeline.get_by_name("sink")

    # Start pipeline
    pipeline.set_state(Gst.State.PLAYING)

    try:
        ws = websocket.create_connection(uri)
        print("Video websocket connected")

        while True:
            sample = appsink.emit("try-pull-sample", 1000000000)  # 1s timeout
            if sample:
                buf = sample.get_buffer()
                result, mapinfo = buf.map(Gst.MapFlags.READ)
                if result:
                    jpeg_bytes = mapinfo.data
                    jpg_as_text = base64.b64encode(jpeg_bytes)
                    ws.send(jpg_as_text)
                    buf.unmap(mapinfo)
                    time.sleep(0.06)  # ~30fps
                else:
                    print("No sample received, exiting.")
                    break
            else:
                print("No sample received, retrying...")
                time.sleep(1)

    except Exception as e:
        print("Video connection error: {}".format(e))

    finally:
        pipeline.set_state(Gst.State.NULL)
        try:
            ws.close()
        except:
            pass

# -------------------- Control Reception --------------------
def receive_controls():
    uri = "ws://{}:8080/service/control".format(host)
    while True:
        try:
            print("Connecting to control server...")
            ws = websocket.create_connection(uri)
            print("Connected to control server")

            while True:
                message = ws.recv()
                data = json.loads(message)
                if "control_mode" in data:
                    print("Control command received: {}".format(data['control_mode']))
                    # Send to Arduino if needed
                    # arduino.write((data['control_mode'] + "\n").encode())

        except Exception as e:
            print("Control connection error: {}. Retrying in 2s...".format(e))
            time.sleep(2)

# -------------------- Sensor Data Simulation --------------------
class SensorDataNode(Node):
    def __init__(self):
        super().__init__('sensor_data_node')
        self.subscription = self.create_subscription(
            String,
            'arduino_data',  # le topic publié par serial_node.py
            self.send_ws,
            10
        )
        self.ws = None
        self.host = host
        self.uri = f"ws://{self.host}:8080/service/sensor_data"
        threading.Thread(target=self.connect_ws, daemon=True).start()

    def connect_ws(self):
        while self.ws is None:
            try:
                self.ws = websocket.create_connection(self.uri)
                print("Sensor WebSocket connected")
            except Exception as e:
                print(f"Sensor WS error: {e}. Retry in 2s...")
                time.sleep(2)

    def send_ws(self, msg):
        try:
            if self.ws:
                # on envoie le message reçu du topic ROS2 vers le dashboard
                data = {"data": msg.data}
                self.ws.send(json.dumps(data))
        except Exception as e:
            print(f"Error sending sensor data via WS: {e}")
            self.ws = None
            threading.Thread(target=self.connect_ws, daemon=True).start()


# -------------------- Robot Reference --------------------
def send_reference_to_api(reference):
    data = {"nom": "R1", "referance": reference}
    try:
        response = requests.post("http://{}:5000/api/robot".format(host), json=data)
        response.raise_for_status()
        print("Reference sent successfully: {}".format(response.status_code))
    except requests.RequestException as e:
        print("Failed to send reference: {}".format(e))

def get_or_create_robot_reference():
    if os.path.exists(REFERENCE_FILE):
        with open(REFERENCE_FILE, "r") as f:
            ref = f.read().strip()
            if ref:
                return ref

    new_ref = str(uuid.uuid4())
    send_reference_to_api(new_ref)
    with open(REFERENCE_FILE, "w") as f:
        f.write(new_ref)
    return new_ref

# -------------------- Mission Listening --------------------
def listen_missions(robot_reference):
    uri = "ws://{}:8080/service/missions?referance={}".format(host, robot_reference)
    while True:
        try:
            print("Connecting to mission server...")
            ws = websocket.create_connection(uri)
            print("Connected to mission websocket for robot '{}'".format(robot_reference))

            while True:
                msg = ws.recv()
                data = json.loads(msg)
                mission = data.get("mission")
                if mission:
                    print("Received mission: {}".format(mission))
                    # Send to Arduino if needed
                    # arduino.write((mission + "\n").encode())
                else:
                    print("No mission at this time.")
                time.sleep(1)
        except Exception as e:
            print("Mission connection error: {}. Retrying in 2s...".format(e))
            time.sleep(2)

# -------------------- Main --------------------
if __name__ == "__main__":
    robot_ref = get_or_create_robot_reference()

    # Start threads for all tasks
    threading.Thread(target=send_video).start()
    threading.Thread(target=receive_controls).start()
   # Initialiser ROS2 pour le subscriber capteur
    rclpy.init(args=None)
    sensor_node = SensorDataNode()
    threading.Thread(target=rclpy.spin, args=(sensor_node,), daemon=True).start()
    threading.Thread(target=listen_missions, args=(robot_ref,)).start()
