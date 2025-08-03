import asyncio
import cv2
import numpy as np
from aiohttp import web, WSMsgType
from cv2 import QRCodeDetector
import json
import os
import time
#from detectobjects import detect_frame
#from classificationmaladies import predict_frame

qr_detector = QRCodeDetector()
latest_frame = None
latest_qr_results = []
connected_qr_clients = set()
connected_video_clients = set()
last_frame_time = 0

no_signal_image = cv2.imread(os.path.join(os.path.dirname(__file__), "no_signal.jpg"))
ret, no_signal_jpeg = cv2.imencode('.jpg', no_signal_image) if no_signal_image is not None else (False, None)

async def video_stream_handler(request):
    global latest_frame, latest_qr_results, last_frame_time

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
                                print("Detected bilan : " + data["nom"])
                            except json.JSONDecodeError:
                                print("No json", text)

                            pts = points[i].astype(int)
                            for j in range(4):
                                pt1 = tuple(pts[j])
                                pt2 = tuple(pts[(j + 1) % 4])
                                cv2.line(frame, pt1, pt2, (0, 255, 0), 2)
                            x, y = pts[0]
                            cv2.putText(frame, text, (x, y - 10),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                            qr_results.append(text)

                latest_frame = frame

                if qr_results:
                    if qr_results != latest_qr_results:
                        latest_qr_results = qr_results
                last_frame_time = time.time()

            except Exception as e:
                print(f"❌ Error decoding video frame: {e}")

    return ws

async def video_viewer_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    connected_video_clients.add(ws)
    try:
        while not ws.closed:
            if latest_frame is not None:
                ret, jpeg = cv2.imencode('.jpg', latest_frame)
                if ret:
                    await ws.send_bytes(jpeg.tobytes())
            else:
                if no_signal_jpeg is not None:
                    await ws.send_bytes(no_signal_jpeg.tobytes())
            await asyncio.sleep(0.1)  
    finally:
        connected_video_clients.discard(ws)

    return ws

async def qr_data_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    connected_qr_clients.add(ws)
    try:
        previous_qr = None
        while not ws.closed:
            if latest_qr_results != previous_qr:
                try:
                    await ws.send_str(json.dumps({"qr_codes": latest_qr_results}))
                    previous_qr = latest_qr_results.copy()
                except Exception as e:
                    print(f"❌ Failed to send QR data: {e}")
            await asyncio.sleep(0.8)
    finally:
        connected_qr_clients.discard(ws)

    return ws

def get_latest_qr_results():
    return latest_qr_results

def get_latest_frame():
    return latest_frame

async def index(request):
    return web.Response(content_type="text/html", text=open("2index.html", encoding="utf-8").read())

async def monitor_video_timeout():
    global latest_frame, last_frame_time
    while True:
        if time.time() - last_frame_time > 3:
            latest_frame = None
        await asyncio.sleep(1)