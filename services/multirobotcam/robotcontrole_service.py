from aiohttp import web, WSMsgType
import json

shared_state = {"AI_ENABLED": False}

def is_ai_enabled():
    return shared_state["AI_ENABLED"]

# Dictionary of connected clients: {ws: robot_id}
control_clients = {}

def get_robot_id(request):
    return request.query.get("robot", "1")

async def control_handler(request):
    robot_id = get_robot_id(request)
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    control_clients[ws] = robot_id
    print(f"🤖 Control client connected (robot {robot_id})")

    try:
        async for msg in ws:
            if msg.type == WSMsgType.TEXT:
                try:
                    data = json.loads(msg.data)
                    if "control_mode" in data:
                        control_mode = data["control_mode"]
                        print(f"[Robot {robot_id}] Control mode received: {control_mode}")

                        if control_mode == "ENABLE_AI":
                            shared_state["AI_ENABLED"] = True
                        elif control_mode == "DISABLE_AI":
                            shared_state["AI_ENABLED"] = False
                        
                        if control_mode == "PAUSE_MISSION" :
                            control_mode = "STOP"
                        elif control_mode == "PLAY_MISSION" :
                            control_mode = "LEFT"
                        
                        # Broadcast ONLY to clients of the same robot
                        for client_ws, client_robot_id in control_clients.items():
                            if (
                                client_ws != ws
                                and not client_ws.closed
                                and client_robot_id == robot_id
                            ):
                                await client_ws.send_str(json.dumps({
                                    "control_mode": control_mode
                                }))
                except Exception as e:
                    print(f"[Robot {robot_id}] ❌ JSON error in control message: {e}")

            elif msg.type == WSMsgType.ERROR:
                print(f"[Robot {robot_id}] WS connection closed with exception {ws.exception()}")

    finally:
        control_clients.pop(ws, None)
        print(f"🔌 Control client disconnected (robot {robot_id})")

    return ws
