# client.py
import cv2
import asyncio
import websockets
import base64

async def send_video():
    uri = "ws://greenertech.mywire.org:8765"
    #uri = "ws://192.168.10.237:8765"
    cap = cv2.VideoCapture(0)  # or 1 for external cam

    async with websockets.connect(uri) as websocket:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
                
            # Display frame locally
            #cv2.imshow("Local Camera", frame)
            #if cv2.waitKey(1) & 0xFF == ord('q'):
            #    break
                
                
            _, buffer = cv2.imencode(".jpg", frame)
            jpg_as_text = base64.b64encode(buffer).decode('utf-8')
            await websocket.send(jpg_as_text)
            await asyncio.sleep(0.03)  # ~30fps

asyncio.run(send_video())
