# def start_robot_mission(mission_id):
#     # Logique pour démarrer une mission robot
#     return f"Mission {mission_id} démarrée"

from aiohttp import web, WSMsgType
import json



control_clients = set()


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
                    print(f"Control mode received: {mode}")

                    for client in control_clients:
                        if client is not ws and not client.closed:
                            await client.send_str(json.dumps({"control_mode": mode}))
            elif msg.type == WSMsgType.ERROR:
                print('ws connection closed with exception %s' % ws.exception())
    finally:
        control_clients.discard(ws)
    return ws