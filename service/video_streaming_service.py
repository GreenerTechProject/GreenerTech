# server.py
import asyncio
import base64
import cv2
import numpy as np
from aiohttp import web
from aiortc import RTCPeerConnection, VideoStreamTrack, RTCSessionDescription
from av import VideoFrame
import websockets
from ia_abdellah.detectobjects import detect_frame
from cv2 import QRCodeDetector

qr_detector = QRCodeDetector()  # Initialize once

latest_frame = None  # shared between WebSocket and WebRTC

import os

class RelayStreamTrack(VideoStreamTrack):
    def __init__(self):
        super().__init__()
        image_path = os.path.join(os.path.dirname(__file__), "no_signal.jpg")
        self.fallback_frame = cv2.imread(image_path)  # Use absolute path

        if self.fallback_frame is None:
            print(f"⚠️ Failed to load fallback image from: {image_path}")


    async def recv(self):
        global latest_frame
        pts, time_base = await self.next_timestamp()
        frame_to_use = latest_frame if latest_frame is not None else self.fallback_frame

        # Ensure the fallback frame is valid
        #if latest_frame is None:
        #    print("⚠️ Using fallback image: no live stream detected.")
        if frame_to_use is None:
            raise Exception("No video stream and no fallback image found!")
        if self.fallback_frame is None:
            print(f"❌ Failed to load fallback image from: {fallback_path}")
        else:
            #frame = detect_frame(latest_frame)
            print(f"✅ Fallback image loaded. Shape: {self.fallback_frame.shape}")
            frame = detect_frame(latest_frame)



        #while latest_frame is None:
        #    await asyncio.sleep(0.01)
        #frame = detect_frame(latest_frame)
        frame = cv2.cvtColor(latest_frame, cv2.COLOR_BGR2RGB)
        av_frame = VideoFrame.from_ndarray(frame, format="rgb24")
        av_frame.pts = pts
        av_frame.time_base = time_base
        return av_frame

async def websocket_handler(websocket):
    global latest_frame
    async for message in websocket:
        data = base64.b64decode(message)
        npdata = np.frombuffer(data, dtype=np.uint8)
        frame = cv2.imdecode(npdata, 1)

        # 🧠 QR Code Detection
        retval, decoded_info, points, _ = qr_detector.detectAndDecodeMulti(frame)
        if retval and points is not None:
            for i in range(len(decoded_info)):
                pts = points[i].astype(int)
                for j in range(4):
                    pt1 = tuple(pts[j])
                    pt2 = tuple(pts[(j + 1) % 4])
                    cv2.line(frame, pt1, pt2, (0, 255, 0), 2)

                # Draw decoded text above the QR code
                text = decoded_info[i]
                if text:
                    x, y = pts[0]
                    cv2.putText(frame, text, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

        latest_frame = frame  # Set the processed frame
        

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

# Start both HTTP server and WebSocket server
async def start_all():
    app = web.Application()
    app.router.add_get("/service/video/", index)
    app.router.add_post("/service/video/offer", offer)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, port=8080)
    await site.start()
    print("HTTP server running at ")

    ws_server = websockets.serve(websocket_handler, "0.0.0.0", 8765)
    await ws_server
    print("WebSocket server running at ")

    while True:
        await asyncio.sleep(3600)

asyncio.run(start_all())
