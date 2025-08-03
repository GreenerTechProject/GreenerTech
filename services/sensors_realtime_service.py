from aiohttp import web, WSMsgType
import json
from video_streaming_service_ai import get_latest_qr_results, get_latest_frame

from PIL import Image
from io import BytesIO
import numpy as np
from datetime import datetime
import requests
import asyncio


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
                    x = data.get("x")
                    y = data.get("y")
                    
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

                            # Save as JPG to disk
                            timanow = datetime.now().strftime("%Y%m%d%H%M%S")
                            image_filename = f"{qrdata['id']}_{timanow}.jpg"
                            image_path = f"./images/{image_filename}"
                            pil_img.save(image_path, format="JPEG", quality=95)  # You can adjust quality if needed

                            # Send alert
                            data = {
                                "id_bilan": qrdata["id"],
                                "status_alert": 1,
                                "maladie": "M1",
                                "lien_image": f"http://greenertech.com/{image_filename}",
                                "x1": x,
                                "y1": y,
                                "status": "résolue"
                            }

                            try:
                                response = requests.post("http://greenertech.mywire.org:5000/api/alerte", json=data)
                                print("✅ Alert sent:", response.status_code, response.text)
                            except Exception as e:
                                print("❌ Failed to send alert:", e)
                            await asyncio.sleep(5)



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
