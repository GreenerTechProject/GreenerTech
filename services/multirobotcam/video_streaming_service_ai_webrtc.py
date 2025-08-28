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



from multirobotcam.sensors_realtime_service import get_latest_sensor_data

from PIL import Image
from dotenv import load_dotenv

import boto3
from io import BytesIO

from multirobotcam.robotcontrole_service import send_control_command, is_ai_enabled
#AI_ENABLED = False


import sys

# save current working directory
cwd = os.getcwd()

# change to ia/models so ALL.py can find the model file
os.chdir(os.path.join(cwd, '../ia/models'))

# ensure this path is in sys.path for the import
if os.getcwd() not in sys.path:
    sys.path.insert(0, os.getcwd())

# import the functions
from ALL import detect_frame, predict_frame

# return to original working directory
os.chdir(cwd)




import asyncpg
from datetime import datetime, timezone, timedelta


DB_URL = "postgresql://postgres:postgres@localhost:5433/greenertech"

qr_detector = QRCodeDetector()

# Data store for each robot+camera combination
stream_data = defaultdict(lambda: {
    "latest_frame": None,
    "latest_qr_results": [],
    "last_frame_time": 0
})

def get_stream_data():
    return stream_data

connected_qr_clients = set()

def get_key_from_request(request):
    robot_id = request.query.get("robot", "1")
    camera_id = request.query.get("camera", "right")
    return f"{robot_id}_{camera_id}"

async def process_ai_task(key):
    while True:
        frame = stream_data[key]["latest_frame"]
        #if frame is not None and is_ai_enabled():
        if frame is not None:
            try:
                bilan = predict_frame(frame)
                print(bilan)
                
                
                warnings = []
                if bilan["Virus de la feuille jaune en boucle de la tomate"] == 0:
                    warnings.append("Virus de la feuille jaune en boucle de la tomate")
                if bilan["powdery_mildew"] == 0:
                    warnings.append("powdery_mildew")
                    
                sensor_data = get_latest_sensor_data(key)
                s3 = boto3.client("s3")
                bucket_name = "bucket-greenertech"
                region = "eu-west-1"
                
                for warning in warnings:
                    latest_qr = stream_data[key]["latest_qr_results"] if key in stream_data else None
                    latest_frame = stream_data[key]["latest_frame"] if key in stream_data else None
                    if latest_qr and latest_frame is not None:
                        qrdata = json.loads(latest_qr[0])
                        print(f"[{key}] Anomalie in: {qrdata['nom']}")
                        print(warning)

                        # Convert BGR (OpenCV) to RGB (PIL)
                        pil_img = Image.fromarray(latest_frame[:, :, ::-1])
                        
                        os.makedirs("../backend/app/static/images", exist_ok=True)
                        timanow = datetime.now().strftime("%Y%m%d%H%M%S")
                        image_filename = f"{qrdata['id']}_{timanow}.jpg"
                        image_path = f"../backend/app/static/images/{image_filename}"
                        pil_img.save(image_path, format="JPEG", quality=95)
                        
                        
                        try:
                            s3 = boto3.client("s3")
                            bucket_name = "bucket-greenertech"
                            region = "eu-west-1"

                            timanow = datetime.now().strftime("%Y%m%d%H%M%S")
                            image_filename = f"{qrdata['id']}_{timanow}.jpg"
                            s3_key = f"images/{image_filename}"

                            buffer = BytesIO()
                            pil_img.save(buffer, format="JPEG", quality=95)
                            buffer.seek(0)

                            s3.upload_fileobj(buffer, bucket_name, s3_key)

                            print(f"✅ Image saved to s3://{bucket_name}/{s3_key}")
                        
                            
                        except Exception as e:
                            print(f"❌ Error: {e}")


                                     
                        # Send alert
                        alert_data = {
                            "id_bilan": qrdata["id"],
                            "status_alert": 3, #1, 2, 3
                            "maladie": warning,
                            #"lien_image": f"/static/images/{image_filename}",
                            "lien_image": f"https://{bucket_name}.s3.{region}.amazonaws.com/{s3_key}",
                            "x1": sensor_data["x"],
                            "y1": sensor_data["y"],
                            "status": "non_vue" #non_vue vue résolue
                        }
                        try:
                            response = requests.post(
                                os.getenv("BACKTEND_URL", "http://localhost:5000") + "/api/alerte",
                                json=alert_data
                            )
                            print(f"[{key}] ✅ Alert sent:", response.status_code, response.text)
                        except Exception as e:
                            print(f"[{key}] ❌ Failed to send alert:", e)
                        await asyncio.sleep(5)
                    
                #stream_data[key]["latest_bilan"] = bilan
            except Exception as e:
                print(f"[{key}] ❌ Error in AI processing: {e}")
        await asyncio.sleep(2)


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
        if is_ai_enabled():
            frame_to_use = detect_frame(data["latest_frame"]) if data["latest_frame"] is not None else self.fallback_frame
            
            #Billan_dicts = predict_frame(data["latest_frame"]) if data["latest_frame"] is not None else self.fallback_frame
            #print (Billan_dicts)
        
        #frame_to_use = data["latest_frame"] or self.fallback_frame
        #if AI_ENABLED and data["latest_frame"] is not None:
        #    frame_to_use = detect_frame(frame_to_use)

        if frame_to_use is None:
            raise Exception("No video stream and no fallback image found!")

        if not np.array_equal(frame_to_use, self.cached_frame):
            rgb_frame = cv2.cvtColor(frame_to_use, cv2.COLOR_BGR2RGB)
            self.cached_frame = frame_to_use.copy()
            self.av_frame = VideoFrame.from_ndarray(rgb_frame, format="rgb24")

        self.av_frame.pts = pts
        self.av_frame.time_base = time_base
        return self.av_frame









async def process_robot_video(track, key, robot_reference):
    global stream_data
    while True:
        frame = await track.recv()
        frame = frame.to_ndarray(format="bgr24")

        
        #npdata = np.frombuffer(msg.data, dtype=np.uint8)
        #frame = cv2.imdecode(npdata, cv2.IMREAD_COLOR)

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
                                print(get_latest_sensor_data(key))
                                
                                
                                conn = None
                                try:
                                    conn = await asyncpg.connect(DB_URL)
                                    
                                    
                                    robot = await conn.fetchrow(
                                        "SELECT id FROM robots WHERE referance = $1", 
                                        robot_reference
                                    )
                                    
                                    if not robot:
                                        raise ValueError(f"Robot with reference {robot_reference} not found")
                                    
                                    mission = await conn.fetchrow(
                                        "SELECT id, bilans FROM missions_robot WHERE id_robot = $1 AND executed = True ORDER BY id DESC LIMIT 1",
                                        robot['id']
                                    )
                                    
                                    if not mission:
                                        raise ValueError(f"No executed mission found for robot {robot['id']}")
                                    
                                    
                                    try:
                                        bilans = json.loads(mission['bilans']) if isinstance(mission['bilans'], str) else mission['bilans']
                                        last_bilan = {'id': max(bilans)}
                                    except (json.JSONDecodeError, TypeError, ValueError) as e:
                                        raise ValueError(f"Invalid bilans format: {mission['bilans']}")
                                    
                                
                                    if data2["id"] == last_bilan or data["nom"] == "-Fin-" :
                                        print ("You are in last bilan")
                                        #data2['id']
                                        robot_reference = request.query.get("robot")
                                        await send_control_command(robot_reference, "STOP")
                                        
                                        await conn.execute(f"""
                                            UPDATE missions_robot SET date_fin = $1
                                            WHERE id = $2
                                        """, datetime.now(timezone(timedelta(hours=1))), mission['id'])
                                    
                                except Exception as e:
                                    print(f"❌ Database error: {str(e)}")
                                    raise
                                finally:
                                    if conn is not None:
                                        await conn.close()
                                
                                
                                sensor_data = get_latest_sensor_data(key)
                                data3 = {
                                    "id_bilan": data2["id"],
                                    
                                    "mean_temperature": sensor_data["mean_temperature"],
                                    "mean_humidite": sensor_data["mean_humidity"],
                                    "mean_luminosite": sensor_data["mean_luminosite"],
                                    "mean_co2": sensor_data["mean_co2"],
                                    
                                    "max_temperature": sensor_data["max_temperature"],
                                    "max_humidite": sensor_data["max_humidity"],
                                    "max_luminosite": sensor_data["max_luminosite"],
                                    "max_co2": sensor_data["max_co2"],
                                    
                                    "min_temperature": sensor_data["min_temperature"],
                                    "min_humidite": sensor_data["min_humidity"],
                                    "min_luminosite": sensor_data["min_luminosite"],
                                    "min_co2": sensor_data["min_co2"],
                                    
                                    "nombre_tomates_maladies": 0,
                                    "nombre_tomates_non_maladies": 0,
                                    "nombre_malade1": 0,
                                    "nombre_malade2": 0,
                                    #"rendement": 0
                                }
                                try:
                                    response = requests.post(os.getenv("BACKTEND_URL", "http://localhost:5000") + "/api/etat_bilan", json=data3)
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
        #print(f"[{key}] frame received and stored")
        if qr_results:
            if qr_results != stream_data[key]["latest_qr_results"]:
                stream_data[key]["latest_qr_results"] = qr_results
        stream_data[key]["last_frame_time"] = time.time()



async def video_stream_handler(request):
    key = get_key_from_request(request)
    try:
        params = await request.json()
        offer = params["offer"]

        pc = RTCPeerConnection()

        @pc.on("connectionstatechange")
        async def on_connectionstatechange():
            print(f"[{key}] Robot connection state:", pc.connectionState)

        @pc.on("track")
        def on_track(track):
            print(f"[{key}] 📡 Robot stream track received: {track.kind}")
            if track.kind == "video":
                asyncio.ensure_future(process_robot_video(track, key, request.query.get("robot")))
                #asyncio.ensure_future(process_ai_task(key))

        await pc.setRemoteDescription(
            RTCSessionDescription(sdp=offer["sdp"], type=offer["type"])
        )
        print("✅ WebRTC connection established with server")
        answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        return web.json_response({
            "sdp": pc.localDescription.sdp,
            "type": pc.localDescription.type
        })

    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)






"""
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
                                        
                                        
                                        conn = None
                                        try:
                                            conn = await asyncpg.connect(DB_URL)
                                            
                                            robot_reference = request.query.get("robot")
                                            
                                            robot = await conn.fetchrow(
                                                "SELECT id FROM robots WHERE referance = $1", 
                                                robot_reference
                                            )
                                            
                                            if not robot:
                                                raise ValueError(f"Robot with reference {robot_reference} not found")
                                            
                                            mission = await conn.fetchrow(
                                                "SELECT id, bilans FROM missions_robot WHERE id_robot = $1 AND executed = True ORDER BY id DESC LIMIT 1",
                                                robot['id']
                                            )
                                            
                                            if not mission:
                                                raise ValueError(f"No executed mission found for robot {robot['id']}")
                                            
                                            
                                            try:
                                                bilans = json.loads(mission['bilans']) if isinstance(mission['bilans'], str) else mission['bilans']
                                                last_bilan = {'id': max(bilans)}
                                            except (json.JSONDecodeError, TypeError, ValueError) as e:
                                                raise ValueError(f"Invalid bilans format: {mission['bilans']}")
                                            
                                        
                                            if data2["id"] == last_bilan or data["nom"] == "--Fin--" :
                                                print ("You are in last bilan")
                                                #data2['id']
                                                
                                                await conn.execute(f""" """
                                                    UPDATE missions_robot SET date_fin = $1
                                                    WHERE id = $2
                                                """ """, datetime.now(timezone(timedelta(hours=1))), mission['id'])
                                            
                                        except Exception as e:
                                            print(f"❌ Database error: {str(e)}")
                                            raise
                                        finally:
                                            if conn is not None:
                                                await conn.close()
                                        
                                        

                                        data3 = {
                                            "id_bilan": data2["id"],
                                            
                                            "mean_temperature": get_latest_sensor_data()["mean_temperature"],
                                            "mean_humidite": get_latest_sensor_data()["mean_humidity"],
                                            "mean_luminosite": get_latest_sensor_data()["mean_luminosite"],
                                            "mean_co2": get_latest_sensor_data()["mean_co2"],
                                            
                                            "max_temperature": get_latest_sensor_data()["max_temperature"],
                                            "max_humidite": get_latest_sensor_data()["max_humidity"],
                                            "max_luminosite": get_latest_sensor_data()["max_luminosite"],
                                            "max_co2": get_latest_sensor_data()["max_co2"],
                                            
                                            "min_temperature": get_latest_sensor_data()["min_temperature"],
                                            "min_humidite": get_latest_sensor_data()["min_humidity"],
                                            "min_luminosite": get_latest_sensor_data()["min_luminosite"],
                                            "min_co2": get_latest_sensor_data()["min_co2"],
                                            
                                            "nombre_tomates_maladies": 0,
                                            "nombre_tomates_non_maladies": 0,
                                            "nombre_malade1": 0,
                                            "nombre_malade2": 0,
                                            #"rendement": 0
                                        }
                                        try:
                                            response = requests.post(os.getenv("BACKTEND_URL", "http://localhost:5000") + "/api/etat_bilan", json=data3)
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
"""


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




#def get_latest_qr_results():
#    return stream_data[key]["latest_qr_results"]
#
#def get_latest_frame():
#    return stream_data[key]["latest_frame"]

async def index(request):
    return web.Response(content_type="text/html", text=open("index.html", encoding="utf-8").read())

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