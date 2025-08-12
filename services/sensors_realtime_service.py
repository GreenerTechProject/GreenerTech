from aiohttp import web, WSMsgType
import json
from video_streaming_service_ai import get_latest_qr_results, get_latest_frame

from PIL import Image
from io import BytesIO
import numpy as np
from datetime import datetime
import requests
import asyncio

import os
from dotenv import load_dotenv

# Load variables from .env into environment
load_dotenv()


sensor_clients = set()
latest_sensor_data = {}

sensor_bounds = {
    "temperature": {"min": None, "max": None, "sum": 0.0, "count": 0, "mean": None},
    "humidity": {"min": None, "max": None, "sum": 0.0, "count": 0, "mean": None},
    "co2": {"min": None, "max": None, "sum": 0.0, "count": 0, "mean": None},
    "luminosite": {"min": None, "max": None, "sum": 0.0, "count": 0, "mean": None},
}


def update_bounds(metric, value):
    if value is None:
        return
    bounds = sensor_bounds.get(metric)
    if bounds["min"] is None or value < bounds["min"]:
        bounds["min"] = value
    if bounds["max"] is None or value > bounds["max"]:
        bounds["max"] = value
    bounds["sum"] += value
    bounds["count"] += 1
    bounds["mean"] = round(bounds["sum"] / bounds["count"], 2)



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
                    #print(f"📡 Données reçues : {data}")

                    temperature = data.get("temperature")
                    humidity = data.get("humidity")
                    co2 = data.get("co2")
                    luminosite = data.get("luminosite")
                    x = data.get("x")
                    y = data.get("y")

                    update_bounds("temperature", temperature)
                    update_bounds("humidity", humidity)
                    update_bounds("co2", co2)
                    update_bounds("luminosite", luminosite)
                    
                    # Merge bounds with latest_sensor_data
                    
                    extended_data = {
                        **data,
                        **{
                            f"min_{k}": v["min"]
                            for k, v in sensor_bounds.items()
                        },
                        **{
                            f"max_{k}": v["max"]
                            for k, v in sensor_bounds.items()
                        },
                        **{
                            f"mean_{k}": v["mean"]
                            for k, v in sensor_bounds.items()
                        }
                    }

                    latest_sensor_data = extended_data


                    
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
                        if get_latest_qr_results() : 
                            qrdata = json.loads(get_latest_qr_results()[0])
                            print("Anomalie in : " + qrdata["nom"])
                            print(warning)
                            
                            
                            img_array = get_latest_frame()

                            # Convert BGR (OpenCV format) to RGB (PIL format)
                            img_rgb = img_array[:, :, ::-1]
                            pil_img = Image.fromarray(img_rgb)

                            os.makedirs("../backend/app/static/images", exist_ok=True)
                            
                            # Save as JPG to disk
                            timanow = datetime.now().strftime("%Y%m%d%H%M%S")
                            image_filename = f"{qrdata['id']}_{timanow}.jpg"
                            image_path = f"../backend/app/static/images/{image_filename}"
                            pil_img.save(image_path, format="JPEG", quality=95)  # You can adjust quality if needed

                            # Send alert
                            data = {
                                "id_bilan": qrdata["id"],
                                "status_alert": 1,
                                "maladie": "M1",
                                "lien_image": f"/static/images/{image_filename}",
                                "x1": x,
                                "y1": y,
                                "status": "résolue"
                            }

                            try:
                                response = requests.post(os.getenv("BACKTEND_URL", "http://localhost:3000")+"/api/alerte", json=data)
                                print("✅ Alert sent:", response.status_code, response.text)
                            except Exception as e:
                                print("❌ Failed to send alert:", e)
                            await asyncio.sleep(5)



                    # Diffusion à tous les clients (sauf l'expéditeur)
                    for client in sensor_clients:
                        if client != ws and not client.closed:
                            await client.send_str(json.dumps(latest_sensor_data))
                except Exception as e:
                    print(f"❌ Erreur JSON : {e}")
    finally:
        sensor_clients.discard(ws)
        print("🔌 Client déconnecté")
    return ws


def get_latest_sensor_data():
    return latest_sensor_data