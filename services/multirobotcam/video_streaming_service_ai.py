import asyncio
import cv2
import numpy as np
from aiohttp import web, WSMsgType
from aiortc import RTCPeerConnection, VideoStreamTrack, RTCSessionDescription
from av import VideoFrame
from cv2 import QRCodeDetector
import json
import os
import time
import requests
from collections import defaultdict

qr_detector = QRCodeDetector()

# Data store for each robot+camera combination
stream_data = defaultdict(lambda: {
    "latest_frame": None,
    "latest_qr_results": [],
    "last_frame_time": 0
})

connected_qr_clients = set()

def get_key_from_request(request):
    robot_id = request.query.get("robot", "1")
    camera_id = request.query.get("camera", "right")
    return f"{robot_id}_{camera_id}"

class RelayStreamTrack(VideoStreamTrack):
    def __init__(self, key):
        super().__init__()
        self.key = key
        image_path = os.path.join(os.path.dirname(__file__), "no_signal.jpg")
        self.fallback_frame = cv2.imread(image_path)
        if self.fallback_frame is None:
            print(f"⚠️ Failed to load fallback image from: {image_path}")
        self.cached_frame = None

    async def recv(self):
        data = stream_data[self.key]
        pts, time_base = await self.next_timestamp()
        frame_to_use = data["latest_frame"] if data["latest_frame"] is not None else self.fallback_frame

        if frame_to_use is None:
            raise Exception("No video stream and no fallback image found!")

        if not np.array_equal(frame_to_use, self.cached_frame):
            rgb_frame = cv2.cvtColor(frame_to_use, cv2.COLOR_BGR2RGB)
            self.cached_frame = frame_to_use.copy()
            self.av_frame = VideoFrame.from_ndarray(rgb_frame, format="rgb24")

        self.av_frame.pts = pts
        self.av_frame.time_base = time_base
        return self.av_frame


async def video_stream_handler(request):
    key = get_key_from_request(request)
    from sensors_realtime_service import get_latest_sensor_data

    ws = web.WebSocketResponse()
    await ws.prepare(request)

    async for msg in ws:
        if msg.type == WSMsgType.BINARY:
            try:
                npdata = np.frombuffer(msg.data, dtype=np.uint8)
                frame = cv2.imdecode(npdata, cv2.IMREAD_COLOR)

                qr_results = []
                retval, decoded_info, points, _ = qr_detector.detectAndDecodeMulti(frame)
                if retval and points is not None:
                    for i, text in enumerate(decoded_info):
                        if text:
                            try:
                                data = json.loads(text)
                                print(f"[{key}] Detected bilan: {data['nom']}")
                                prev_qrs = stream_data[key]["latest_qr_results"]
                                if prev_qrs and text != prev_qrs[0]:
                                    data2 = json.loads(prev_qrs[0])
                                    if data["nom"] != data2["nom"]:
                                        print(f"[{key}] Old bilan: {data2['nom']}")
                                        print(get_latest_sensor_data())

                                        data3 = {
                                            "id_bilan": data2["id"],
                                            "temperature": get_latest_sensor_data()["mean_temperature"],
                                            "humidite": get_latest_sensor_data()["mean_humidity"],
                                            "luminosite": get_latest_sensor_data()["mean_luminosite"],
                                            "co2": get_latest_sensor_data()["mean_co2"],
                                            "nombre_tomates_maladies": 0,
                                            "nombre_tomates_non_maladies": 0,
                                            "nombre_malade1": 0,
                                            "nombre_malade2": 0,
                                            "rendement": 0
                                        }
                                        try:
                                            response = requests.post("http://greenertech.mywire.org:5000/api/etat_bilan", json=data3)
                                            print(f"[{key}] ✅ etat_bilan sent:", response.status_code, response.text)
                                        except Exception as e:
                                            print(f"[{key}] ❌ Failed to send etat_bilan:", e)
                            except json.JSONDecodeError:
                                print(f"[{key}] No json", text)

                            pts = points[i].astype(int)
                            for j in range(4):
                                pt1 = tuple(pts[j])
                                pt2 = tuple(pts[(j + 1) % 4])
                                cv2.line(frame, pt1, pt2, (0, 255, 0), 2)
                            x, y = pts[0]
                            cv2.putText(frame, text, (x, y - 10),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                            qr_results.append(text)

                stream_data[key]["latest_frame"] = frame
                if qr_results:
                    if qr_results != stream_data[key]["latest_qr_results"]:
                        stream_data[key]["latest_qr_results"] = qr_results
                stream_data[key]["last_frame_time"] = time.time()

            except Exception as e:
                print(f"[{key}] ❌ Error decoding video frame: {e}")

    return ws


async def qr_data_handler(request):
    key = get_key_from_request(request)
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    connected_qr_clients.add(ws)
    try:
        previous_qr = None
        while not ws.closed:
            current_qrs = stream_data[key]["latest_qr_results"]
            if current_qrs != previous_qr:
                try:
                    await ws.send_str(json.dumps({"qr_codes": current_qrs}))
                    previous_qr = current_qrs.copy()
                except Exception as e:
                    print(f"[{key}] ❌ Failed to send QR data: {e}")
            await asyncio.sleep(0.8)
    finally:
        connected_qr_clients.discard(ws)
    return ws


async def offer(request):
    key = get_key_from_request(request)
    if request.method == "OPTIONS":
        return set_cors_headers(web.Response())

    try:
        params = await request.json()
        offer = params["offer"]

        pc = RTCPeerConnection()
        @pc.on("connectionstatechange")
        async def on_connectionstatechange():
            print(f"[{key}] Connection state:", pc.connectionState)

        pc.addTrack(RelayStreamTrack(key))
        await pc.setRemoteDescription(RTCSessionDescription(sdp=offer["sdp"], type=offer["type"]))
        answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        return set_cors_headers(web.json_response({
            "sdp": pc.localDescription.sdp,
            "type": pc.localDescription.type
        }))
    except Exception as e:
        return set_cors_headers(web.json_response({"error": str(e)}, status=500))



def set_cors_headers(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "*"
    return resp


async def monitor_video_timeout():
    while True:
        now = time.time()
        for key, data in stream_data.items():
            if now - data["last_frame_time"] > 3:
                data["latest_frame"] = None
        await asyncio.sleep(1)