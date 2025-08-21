from aiohttp import web, WSMsgType
import json
from multirobotcam.video_streaming_service_ai import get_stream_data  # use the updated dict
from PIL import Image
from datetime import datetime
import requests
import asyncio
import os
from dotenv import load_dotenv

import boto3
from io import BytesIO

stream_data = get_stream_data()

# Load environment variables
load_dotenv()

# Set of connected sensor/dashboard clients
sensor_clients = {}

# Latest sensor data per robot-camera key
latest_sensor_data = {}

# Aggregate stats per robot-camera key
sensor_bounds = {}

def get_key_from_request(request):
    return request.query.get("robot", "1")

def init_bounds_for_key(key):
    if key not in sensor_bounds:
        sensor_bounds[key] = {
            "temperature": {"min": None, "max": None, "sum": 0.0, "count": 0, "mean": None},
            "humidity": {"min": None, "max": None, "sum": 0.0, "count": 0, "mean": None},
            "co2": {"min": None, "max": None, "sum": 0.0, "count": 0, "mean": None},
            "luminosite": {"min": None, "max": None, "sum": 0.0, "count": 0, "mean": None},
        }

def update_bounds(key, metric, value):
    if value is None:
        return
    bounds = sensor_bounds[key][metric]
    if bounds["min"] is None or value < bounds["min"]:
        bounds["min"] = value
    if bounds["max"] is None or value > bounds["max"]:
        bounds["max"] = value
    bounds["sum"] += value
    bounds["count"] += 1
    bounds["mean"] = round(bounds["sum"] / bounds["count"], 2)

async def sensor_data_handler(request):
    key = get_key_from_request(request)
    init_bounds_for_key(key)
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    sensor_clients[ws] = key
    print(f"📡 New sensor/dashboard client connected ({key})")
    try:
        async for msg in ws:
            if msg.type == WSMsgType.TEXT:
                try:
                    data = json.loads(msg.data)
                    temperature = data.get("temperature")
                    humidity = data.get("humidity")
                    co2 = data.get("co2")
                    luminosite = data.get("luminosite")
                    x = data.get("x")
                    y = data.get("y")

                    update_bounds(key, "temperature", temperature)
                    update_bounds(key, "humidity", humidity)
                    update_bounds(key, "co2", co2)
                    update_bounds(key, "luminosite", luminosite)

                    extended_data = {
                        **data,
                        **{f"min_{k}": v["min"] for k, v in sensor_bounds[key].items()},
                        **{f"max_{k}": v["max"] for k, v in sensor_bounds[key].items()},
                        **{f"mean_{k}": v["mean"] for k, v in sensor_bounds[key].items()}
                    }
                    latest_sensor_data[key] = extended_data

                    # Generate warnings
                    warnings = []
                    if temperature is not None and not (15 <= temperature <= 35):
                        warnings.append(f"⚠️ Température anormale: {temperature}°C")
                    if humidity is not None and not (30 <= humidity <= 90):
                        warnings.append(f"⚠️ Humidité anormale: {humidity}%")
                    if co2 is not None and not (300 <= co2 <= 1000):
                        warnings.append(f"⚠️ CO2 anormal: {co2} ppm")
                    if luminosite is not None and not (100 <= luminosite <= 2000):
                        warnings.append(f"⚠️ Luminosité anormale: {luminosite} lx")

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
                                s3_key = f"images/{image_filename}"   # مكان التخزين داخل S3

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
                                "status_alert": 1, #1, 2, 3
                                "maladie": warning,
                                #"lien_image": f"/static/images/{image_filename}",
                                "lien_image": f"https://{bucket_name}.s3.{region}.amazonaws.com/{s3_key}",
                                "x1": x,
                                "y1": y,
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

                    # Broadcast to all other clients
                    for client_ws, client_robot_id in sensor_clients.items():
                        if client_ws != ws and not client_ws.closed and client_robot_id == key:
                            await client_ws.send_str(json.dumps(latest_sensor_data[key]))
                except Exception as e:
                    print(f"[{key}] ❌ JSON error: {e}")
    finally:
        sensor_clients.pop(ws, None)
        print(f"🔌 Client disconnected ({key})")
    return ws

def get_latest_sensor_data(key=None):
    if key:
        return latest_sensor_data.get(key)
    return latest_sensor_data
