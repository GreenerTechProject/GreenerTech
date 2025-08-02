import asyncio
import cv2
import numpy as np
from aiohttp import web, WSMsgType
from aiortc import RTCPeerConnection, VideoStreamTrack, RTCSessionDescription
from av import VideoFrame
from cv2 import QRCodeDetector
#from ia.detectobjects import detect_frame
import json
import os
import time
import ast


qr_detector = QRCodeDetector()
latest_frame = None
latest_qr_results = []
connected_qr_clients = set()
last_frame_time = 0
control_clients = set()
last_frame_time = 0

class RelayStreamTrack(VideoStreamTrack):
    def __init__(self):
        super().__init__()
        image_path = os.path.join(os.path.dirname(__file__), "no_signal.jpg")
        self.fallback_frame = cv2.imread(image_path)
        if self.fallback_frame is None:
            print(f"⚠️ Failed to load fallback image from: {image_path}")
        self.cached_frame = None

    async def recv(self):
        global latest_frame
        pts, time_base = await self.next_timestamp()

        frame_to_use = latest_frame if latest_frame is not None else self.fallback_frame
        #frame_to_use = detect_frame(latest_frame) if latest_frame is not None else self.fallback_frame
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
                            #print (decoded_info[0])

                            data = ast.literal_eval(decoded_info[0])

                            print(data["nom"])
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
                latest_qr_results = qr_results
                last_frame_time = time.time()

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
    return web.Response(content_type="text/html", text=open("index.html").read())

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
    global latest_frame, last_frame_time
    while True:
        if time.time() - last_frame_time > 3:
            latest_frame = None
        await asyncio.sleep(1)



async def control_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    control_clients.add(ws)
    try:
        async for msg in ws:
            if msg.type == WSMsgType.TEXT:
                data = json.loads(msg.data)
                if "control_mode" in data:
                    mode = data["control_mode"]
                    #print(f"Control mode received: {mode}")

                    for client in control_clients:
                        if client is not ws and not client.closed:
                            await client.send_str(json.dumps({"control_mode": mode}))
            elif msg.type == WSMsgType.ERROR:
                print('ws connection closed with exception %s' % ws.exception())
    finally:
        control_clients.discard(ws)
    return ws


sensor_clients = set()
latest_sensor_data = {}

async def sensor_data_handler(request):
    global latest_sensor_data
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    sensor_clients.add(ws)
    print(" Nouveau client connecté (capteur ou dashboard)")
    try:
        async for msg in ws:
            if msg.type == WSMsgType.TEXT:
                try:
                    data = json.loads(msg.data)
                    latest_sensor_data = data
                    #print(f"📡 Données reçues : {data}")

                    temperature = data.get("temperature")
                    humidity = data.get("humidity")
                    co2 = data.get("co2")
                    luminosite = data.get("luminosite")

                    warnings = []

                    if temperature is not None:
                        if not (15 <= temperature <= 35):
                            warnings.append(f"⚠️ Température anormale: {temperature}°C")
                    if humidity is not None:
                        if not (30 <= humidity <= 90):
                            warnings.append(f"⚠️ Humidité anormale: {humidity}%")
                    if co2 is not None:
                        if not (300 <= co2 <= 1000):
                            warnings.append(f"⚠️ CO2 anormal: {co2} ppm")
                    if luminosite is not None:
                        if not (100 <= luminosite <= 2000):
                            warnings.append(f"⚠️ Luminosité anormale: {luminosite} lx")

                    for warning in warnings:
                        print(warning)

                    # Diffusion à tous les clients (sauf l'expéditeur)
                    for client in sensor_clients:
                        if client != ws and not client.closed:
                            await client.send_str(json.dumps(data))
                except Exception as e:
                    print(f"❌ Erreur JSON : {e}")
    finally:
        sensor_clients.discard(ws)
        print("🔌 Client déconnecté")
    return ws




import asyncpg
from datetime import datetime


DB_URL = "postgresql://postgres:postgres@localhost:5433/greenertech"


mission_clients = set()

async def mission_data_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    robot_referance = request.query.get("referance", "")
    print("🔎 Incoming mission request from robot: " + robot_referance)

    mission_clients.add(ws)
    print("📘 Mission WebSocket client connected")

    last_mission_id = None

    try:
        conn = await asyncpg.connect(DB_URL)
        robot = await conn.fetchrow("SELECT id FROM robots WHERE referance = $1", robot_referance)
        if not robot:
            await ws.send_str(json.dumps({"error": "Robot not found"}))
            await conn.close()
            return ws

        id_robot = robot['id']

        while not ws.closed:
            try:
                now = datetime.utcnow()
                rows = await conn.fetch("""
                    SELECT * FROM missions_robot 
                    WHERE id_robot = $1 
                      AND EXTRACT(YEAR FROM date_debut) = $2
                      AND EXTRACT(MONTH FROM date_debut) = $3
                      AND EXTRACT(DAY FROM date_debut) = $4
                      AND EXTRACT(HOUR FROM date_debut) = $5
                      AND EXTRACT(MINUTE FROM date_debut) = $6
                      AND executed = False
                    ORDER BY id DESC 
                    LIMIT 1
                    """,
                    id_robot,
                    now.year, now.month, now.day, now.hour, now.minute
                )

                if rows:
                    mission = dict(rows[0])
                    if mission["id"] != last_mission_id:
                        last_mission_id = mission["id"]

                        for k, v in mission.items():
                            if isinstance(v, datetime):
                                mission[k] = v.isoformat()

                        await ws.send_str(json.dumps({"mission": mission}))
                else:
                    pass

            except Exception as e:
                print(f"❌ Error fetching missions: {e}")

            await asyncio.sleep(60)

    finally:
        mission_clients.discard(ws)
        await conn.close()
        print("📕 Mission WebSocket client disconnected")

    return ws





async def start_all():
    app = web.Application()
    app.router.add_get("/video/", index)
    app.router.add_post("/service/video_stream_service", offer)
    app.router.add_get("/service/video_stream_handler", video_stream_handler)
    app.router.add_get("/service/qr_data", qr_data_handler)
    app.router.add_get("/service/control", control_handler)
    app.router.add_get("/service/sensor_data", sensor_data_handler)
    app.router.add_get("/service/missions", mission_data_handler)


    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", 8080)
    await site.start()
    print("✅ HTTP + WebSocket server running at http://0.0.0.0:8080")

    asyncio.create_task(monitor_video_timeout())
    await asyncio.Future()

asyncio.run(start_all())
