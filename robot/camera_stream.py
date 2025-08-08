# -*- coding: utf-8 -*-
# Python 2 compatible code
import threading
import time
import json
import random
import uuid
import os
import requests
import base64

import serial

# Configuration du port série (à adapter selon ton OS ou port réel)
try:
    arduino = serial.Serial('/dev/ttyACM0', 9600)
    print("Port série vers Arduino ouvert.")
except Exception as e:
    print("Erreur ouverture port série : {}".format(e))
    arduino = None

import websocket
import gi

gi.require_version('Gst', '1.0')
from gi.repository import Gst, GLib

# Initialize GStreamer
Gst.init(None)

host = "greenertech.mywire.org"
REFERENCE_FILE = "robot_ref.txt"




def send_video():
    uri = "ws://{}:8080/service/video_stream_handler".format(host)

    pipeline_str = (
        "nvarguscamerasrc sensor-id=0 ! "
        "video/x-raw(memory:NVMM), width=640, height=480, framerate=8/1 ! "
        "nvjpegenc ! "
        "appsink name=sink emit-signals=true max-buffers=1 drop=true sync=false"
    )

    pipeline = Gst.parse_launch(pipeline_str)
    appsink = pipeline.get_by_name("sink")

    pipeline.set_state(Gst.State.PLAYING)
    time.sleep(1)  # Camera warm-up

    try:
        ws = websocket.create_connection(uri, ping_interval=None)
        while True:
            sample = appsink.emit("try-pull-sample", 500000000)
            if not sample:
                print("No sample received, retrying...")
                time.sleep(0.01)
                continue

            buf = sample.get_buffer()
            result, mapinfo = buf.map(Gst.MapFlags.READ)
            if result:
                jpeg_bytes = mapinfo.data
                ws.send_binary(jpeg_bytes)  # send raw bytes
                buf.unmap(mapinfo)

            time.sleep(0.02)

    except Exception as e:
        print("Error: {}".format(e))

    finally:
        pipeline.set_state(Gst.State.NULL)
        try:
            ws.close()
        except:
            pass




# -------------------- Video Streaming --------------------
def send_video222():
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
                    arduino.write((data['control_mode'] + "\n").encode())

        except Exception as e:
            print("Control connection error: {}. Retrying in 2s...".format(e))
            time.sleep(2)

# -------------------- Sensor Data Simulation --------------------
def simulate_sensor_data():
    uri = "ws://{}:8080/service/sensor_data".format(host)
    while True:
        try:
            ws = websocket.create_connection(uri)
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
            print("Sensor websocket error: {}. Retrying in 2s...".format(e))
            time.sleep(2)

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
    threading.Thread(target=simulate_sensor_data).start()
    threading.Thread(target=listen_missions, args=(robot_ref,)).start()

