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
import aioredis

# Load variables from .env into environment
load_dotenv()

sensor_clients = set()

redis = None

sensor_bounds = {
    "temperature": {"min": None, "max": None, "sum": 0.0, "count": 0, "mean": None},
    "humidity": {"min": None, "max": None, "sum": 0.0, "count": 0, "mean": None},
    "co2": {"min": None, "max": None, "sum": 0.0, "count": 0, "mean": None},
    "luminosite": {"min": None, "max": None, "sum": 0.0, "count": 0, "mean": None},
}

async def init_redis():
    global redis
    redis = await aioredis.create_redis_pool('redis://localhost')

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
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    sensor_clients.add(ws)
    print("Nouveau client connecté (capteur ou dashboard)")

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

                    update_bounds("temperature", temperature)
                    update_bounds("humidity", humidity)
                    update_bounds("co2", co2)
                    update_bounds("luminosite", luminosite)

                    extended_data = {
                        **data,
                        **{f"min_{k}": v["min"] for k, v in sensor_bounds.items()},
                        **{f"max_{k}": v["max"] for k, v in sensor_bounds.items()},
                        **{f"mean_{k}": v["mean"] for k, v in sensor_bounds.items()}
                    }

                    # تخزين البيانات في Redis (كنص JSON)
                    await redis.set('latest_sensor_data', json.dumps(extended_data))

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
                        qr_results_json = await redis.get('latest_qr_results')
                        if qr_results_json:
                            qr_results = json.loads(qr_results_json)
                            if qr_results:
                                qrdata = json.loads(qr_results[0])
                                print("Anomalie in : " + qrdata["nom"])
                                print(warning)

                                img_array = get_latest_frame()

                                img_rgb = img_array[:, :, ::-1]
                                pil_img = Image.fromarray(img_rgb)

                                os.makedirs("../backend/static/images", exist_ok=True)

                                timanow = datetime.now().strftime("%Y%m%d%H%M%S")
                                image_filename = f"{qrdata['id']}_{timanow}.jpg"
                                image_path = f"../backend/static/images/{image_filename}"
                                pil_img.save(image_path, format="JPEG", quality=95)

                                alert_data = {
                                    "id_bilan": qrdata["id"],
                                    "status_alert": 1,
                                    "maladie": "M1",
                                    "lien_image": f"/static/images/{image_filename}",
                                    "x1": x,
                                    "y1": y,
                                    "status": "résolue"
                                }

                                try:
                                    response = requests.post(
                                        os.getenv("BACKTEND_URL", "http://localhost:3000") + "/api/alerte",
                                        json=alert_data
                                    )
                                    print("✅ Alert sent:", response.status_code, response.text)
                                except Exception as e:
                                    print("❌ Failed to send alert:", e)

                                await asyncio.sleep(5)

                    # إرسال البيانات لجميع العملاء ما عدا المرسل
                    latest_sensor_data_json = await redis.get('latest_sensor_data')
                    if latest_sensor_data_json:
                        for client in sensor_clients:
                            if client != ws and not client.closed:
                                await client.send_str(latest_sensor_data_json)

                except Exception as e:
                    print(f"❌ Erreur JSON : {e}")
    finally:
        sensor_clients.discard(ws)
        print("🔌 Client déconnecté")
    return ws


async def get_latest_sensor_data():
    data_json = await redis.get('latest_sensor_data')
    if data_json:
        return json.loads(data_json)
    else:
        return {}

