import asyncio
import cv2
import numpy as np
from aiohttp import web, WSMsgType
from aiortc import RTCPeerConnection, VideoStreamTrack, RTCSessionDescription
from av import VideoFrame
from cv2 import QRCodeDetector
from detectobjects import detect_frame
#import json
import os
import time
import json
import requests
import aioredis

qr_detector = QRCodeDetector()
connected_qr_clients = set()

redis = None

async def init_redis():
    global redis
    redis = await aioredis.create_redis_pool('redis://localhost')

class RelayStreamTrack(VideoStreamTrack):
    def __init__(self):
        super().__init__()
        image_path = os.path.join(os.path.dirname(__file__), "no_signal.jpg")
        self.fallback_frame = cv2.imread(image_path)
        if self.fallback_frame is None:
            print(f"⚠️ Failed to load fallback image from: {image_path}")
        self.cached_frame = None

    async def recv(self):
        pts, time_base = await self.next_timestamp()

        # استرجاع آخر إطار من Redis
        frame_bytes = await redis.get('latest_frame')
        if frame_bytes:
            nparr = np.frombuffer(frame_bytes, np.uint8)
            latest_frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        else:
            latest_frame = None

        frame_to_use = latest_frame if latest_frame is not None else self.fallback_frame
        frame_to_use = detect_frame(frame_to_use) if frame_to_use is not None else self.fallback_frame

        # إذا عندك دالة predict_frame مفعلة عطل السطر التالي مؤقتاً
        # _, Billan_dicts = predict_frame(frame_to_use)
        # print(Billan_dicts)

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
                                print("Detected bilan : "+data["nom"])

                                qr_json = await redis.get('latest_qr_results')
                                if qr_json:
                                    latest_qr_results = json.loads(qr_json)
                                else:
                                    latest_qr_results = []

                                if latest_qr_results and text != latest_qr_results[0]:
                                    data2 = json.loads(latest_qr_results[0])
                                    if data["nom"] != data2["nom"]:
                                        print("Old bilan : "+data2["nom"])
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
                                        print(data3)
                                        try:
                                            response = requests.post("http://greenertech.mywire.org:5000/api/etat_bilan", json=data3)
                                            print("✅ etat_bilan sent:", response.status_code, response.text)
                                        except Exception as e:
                                            print("❌ Failed to send etat_bilan:", e)

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

                # تخزين آخر إطار في Redis
                _, img_encoded = cv2.imencode('.jpg', frame)
                img_bytes = img_encoded.tobytes()
                await redis.set('latest_frame', img_bytes)
                await redis.set('latest_frame_time', str(time.time()))

                if qr_results:
                    qr_json = json.dumps(qr_results)
                    await redis.set('latest_qr_results', qr_json)

            except Exception as e:
                print(f"❌ Error decoding video frame: {e}")

    return ws

async def qr_data_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    connected_qr_clients.add(ws)
    try:
        previous_qr = None
        while not ws.closed:
            qr_json = await redis.get('latest_qr_results')
            if qr_json:
                latest_qr_results = json.loads(qr_json)
            else:
                latest_qr_results = []

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

async def index(request):
    return web.Response(content_type="text/html", text=open("index.html", encoding="utf-8").read())

async def offer(request):
    params = await request.json()
    offer = params["offer"]

    pc = RTCPeerConnection()

    @pc.on("connectionstatechange")
    async def on_connectionstatechange():
        print("Connection state:", pc.connectionState)

    pc.addTrack(RelayStreamTrack())
    await pc.setRemoteDescription(
        RTCSessionDescription(sdp=offer["sdp"], type=offer["type"])
    )
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    return web.json_response({
        "sdp": pc.localDescription.sdp,
        "type": pc.localDescription.type
    })

async def monitor_video_timeout():
    while True:
        last_time = await redis.get('latest_frame_time')
        if last_time:
            last_time = float(last_time)
            if time.time() - last_time > 3:
                await redis.delete('latest_frame')
                await redis.delete('latest_frame_time')
        await asyncio.sleep(1)

async def main():
    await init_redis()

    app = web.Application()
    app.router.add_get('/', index)
    app.router.add_post('/offer', offer)
    app.router.add_get('/video_stream', video_stream_handler)
    app.router.add_get('/qr_data', qr_data_handler)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', 8080)
    await site.start()

    asyncio.create_task(monitor_video_timeout())

    print("Server running at http://0.0.0.0:8080")
    while True:
        await asyncio.sleep(3600)

if __name__ == "__main__":
    asyncio.run(main())
