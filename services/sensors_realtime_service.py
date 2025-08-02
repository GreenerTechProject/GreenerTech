from aiohttp import web, WSMsgType
import json


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
