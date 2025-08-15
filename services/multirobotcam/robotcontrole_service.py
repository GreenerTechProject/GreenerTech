from aiohttp import web, WSMsgType
import json

# Set of connected control clients
control_clients = set()

def get_key_from_request(request):
    robot_id = request.query.get("robot", "1")
    camera_id = request.query.get("camera", "right")
    return f"{robot_id}_{camera_id}"

async def control_handler(request):
    key = get_key_from_request(request)
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    control_clients.add(ws)
    print(f"🤖 Control client connected ({key})")

    try:
        async for msg in ws:
            if msg.type == WSMsgType.TEXT:
                try:
                    data = json.loads(msg.data)
                    if "control_mode" in data:
                        mode = data["control_mode"]
                        print(f"[{key}] Control mode received: {mode}")

                        # Broadcast to other clients (including optionally same robot or others)
                        for client in control_clients:
                            if client != ws and not client.closed:
                                await client.send_str(json.dumps({
                                    "key": key,
                                    "control_mode": mode
                                }))
                except Exception as e:
                    print(f"[{key}] ❌ JSON error in control message: {e}")

            elif msg.type == WSMsgType.ERROR:
                print(f"[{key}] WS connection closed with exception {ws.exception()}")

    finally:
        control_clients.discard(ws)
        print(f"🔌 Control client disconnected ({key})")

    return ws
