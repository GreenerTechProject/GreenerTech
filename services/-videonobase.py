import asyncio
import cv2
import numpy as np
from aiohttp import web
from aiortc import RTCPeerConnection, VideoStreamTrack, RTCSessionDescription
from av import VideoFrame
import websockets
from cv2 import QRCodeDetector
import os

qr_detector = QRCodeDetector()  # Initialize once
latest_frame = None  # shared between WebSocket and WebRTC

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

        if frame_to_use is None:
            raise Exception("No video stream and no fallback image found!")

        frame = cv2.cvtColor(frame_to_use, cv2.COLOR_BGR2RGB)
        av_frame = VideoFrame.from_ndarray(frame, format="rgb24")
        av_frame.pts = pts
        av_frame.time_base = time_base
        return av_frame

async def websocket_handler(websocket):
    global latest_frame
    async for message in websocket:
        # message is raw JPEG bytes, no base64 decoding
        npdata = np.frombuffer(message, dtype=np.uint8)
        frame = cv2.imdecode(npdata, 1)
        if frame is None:
            print("Warning: Failed to decode JPEG frame")
            continue

        # QR Code detection and annotation
        retval, decoded_info, points, _ = qr_detector.detectAndDecodeMulti(frame)
        if retval and points is not None:
            for i in range(len(decoded_info)):
                pts = points[i].astype(int)
                for j in range(4):
                    pt1 = tuple(pts[j])
                    pt2 = tuple(pts[(j + 1) % 4])
                    cv2.line(frame, pt1, pt2, (0, 255, 0), 2)

                text = decoded_info[i]
                if text:
                    x, y = pts[0]
                    cv2.putText(frame, text, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

        latest_frame = frame  # Update the shared frame

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
    await pc.setRemoteDescription(RTCSessionDescription(sdp=offer["sdp"], type=offer["type"]))
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    return web.json_response({
        "sdp": pc.localDescription.sdp,
        "type": pc.localDescription.type
    })

async def start_all():
    app = web.Application()
    app.router.add_get("/service/video/", index)
    app.router.add_post("/service/video/offer", offer)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, port=8080)
    await site.start()
    print("HTTP server running at http://0.0.0.0:8080/service/video/")

    ws_server = websockets.serve(websocket_handler, "0.0.0.0", 8765)
    await ws_server
    print("WebSocket server running at ws://0.0.0.0:8765")

    while True:
        await asyncio.sleep(3600)

if __name__ == "__main__":
    asyncio.run(start_all())

