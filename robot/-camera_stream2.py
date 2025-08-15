#!/usr/bin/env python2
# -*- coding: utf-8 -*-
# Python 2 compatible code
import time
import json
import uuid
import os
import threading
import requests
import base64
import serial
import websocket
import gi
#import signal
import random

gi.require_version('Gst', '1.0')
from gi.repository import Gst, GLib

Gst.init(None)

host = "greenertech.mywire.org"
REFERENCE_FILE = "robot_ref.txt"
WS_URI = "ws://{}:8080/service/video_stream_handler".format(host)
SENSOR_ID = 0
WIDTH = 640
HEIGHT = 480
FPS = 30

# GStreamer pipeline for video streaming
pipeline_str = (
    "nvarguscamerasrc sensor-id=0 ! "
    "video/x-raw(memory:NVMM), width=640, height=480, framerate=30/1 ! "
    "queue ! nvjpegenc ! "
    "appsink name=sink emit-signals=true max-buffers=1 drop=true sync=false"
)

# Configuration du port série (à adapter selon ton OS ou port réel)
#try:
#    arduino = serial.Serial('/dev/ttyACM0', 9600)
#    print("Port série vers Arduino ouvert.")
#except Exception as e:
#    print("Erreur ouverture port série : {}".format(e))
#    arduino = None


class Streamer:
    def __init__(self, ws_uri):
        self.ws_uri = ws_uri
        self.pipeline = Gst.parse_launch(pipeline_str)
        self.appsink = self.pipeline.get_by_name("sink")
        if not self.appsink:
            raise RuntimeError("appsink not found in pipeline")
        # connect new-sample signal
        self.appsink.connect("new-sample", self.on_new_sample)
        self.queue = []  # holds encoded H.264 byte-frames
        self.running = False
        self.ws = None

    def start(self):
        self.pipeline.set_state(Gst.State.PLAYING)
        self.running = True

    def stop(self):
        self.running = False
        self.pipeline.set_state(Gst.State.NULL)

    def on_new_sample(self, appsink):
        """
        GStreamer thread callback -> push encoded packet into queue.
        We must not block here. If full, drop oldest frame.
        """
        sample = appsink.emit("pull-sample")
        if not sample:
            return Gst.FlowReturn.OK

        buf = sample.get_buffer()
        success, mapinfo = buf.map(Gst.MapFlags.READ)
        if not success:
            return Gst.FlowReturn.OK

        try:
            data = bytes(mapinfo.data)  # encoded JPEG bytes
            if len(self.queue) >= 4:
                self.queue.pop(0)  # Drop oldest frame to make room

            self.queue.append(data)

        finally:
            buf.unmap(mapinfo)

        return Gst.FlowReturn.OK

    def ws_sender(self):
        """
        Connect to websocket and send JPEG byte-chunks as binary messages.
        Keeps reconnecting on failure with a short backoff.
        """
        backoff = 1
        while self.running:
            try:
                print("Connecting to", self.ws_uri)
                ws = websocket.create_connection(self.ws_uri)
                self.ws = ws
                print("WebSocket connected")
                backoff = 1
                while self.running:
                    # wait for next encoded packet
                    if len(self.queue) > 0:
                        data = self.queue.pop(0)
                        try:
                            ws.send(data)  # binary send
                        except Exception as e:
                            print("WS send error:", e)
                            # push back the frame (best effort) - but avoid infinite loop
                            break
            except Exception as e:
                print("WebSocket connection error:", str(e))
                time.sleep(backoff)
                backoff = min(backoff * 2, 10)
            finally:
                self.ws = None


def main_loop():
    streamer = Streamer(WS_URI)
    streamer.start()

    # Create a thread for ws_sender to send data over WebSocket
    sender_thread = threading.Thread(target=streamer.ws_sender)
    sender_thread.start()

    # Handle signals for graceful shutdown
    stop_event = threading.Event()

    def _on_sig(signum, frame):
        print("Signal received, stopping...")
        stop_event.set()

    signal.signal(signal.SIGINT, _on_sig)
    signal.signal(signal.SIGTERM, _on_sig)

    stop_event.wait()
    print("Stopping streamer...")
    streamer.stop()
    sender_thread.join()


# -------------------- Sensor Data Simulation --------------------
def simulate_sensor_data():
    uri = "ws://{}:8080/service/sensor_data".format(host)
    while True:
        try:
            ws = websocket.create_connection(uri)
            while True:
                data = {
                    "temperature": round(random.uniform(20, 3000), 2),
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
                    #arduino.write((data['control_mode'] + "\n").encode())

        except Exception as e:
            print("Control connection error: {}. Retrying in 2s...".format(e))
            time.sleep(2)


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
                #data = json.loads(msg)
                data = msg
                #mission = data.get("mission")
                mission = data
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

    # Start all tasks in separate threads
    threading.Thread(target=simulate_sensor_data).start()  # Simulate sensor data
    threading.Thread(target=main_loop).start()  # Start video stream and WebSocket sender
    threading.Thread(target=send_reference_to_api, args=(robot_ref,)).start()  # Send robot reference
    threading.Thread(target=receive_controls).start()  # Receive control commands
    threading.Thread(target=listen_missions, args=(robot_ref,)).start()  # Listen for missions

    try:
        while True:
            time.sleep(1)  # Main thread can do nothing but wait
    except KeyboardInterrupt:
        pass
