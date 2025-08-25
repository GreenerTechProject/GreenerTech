from aiohttp import web, WSMsgType
import redis
import json
import uuid  # Pour générer un id unique pour chaque WebSocket

# Connexion Redis
r = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)

def get_robot_id(request):

    return request.query.get("robot", "1")


async def control_handler(request):
    robot_id = get_robot_id(request)
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    # Générer un identifiant unique pour ce WebSocket
    ws_id = str(uuid.uuid4())

    # Sauvegarder le client dans Redis (hash: control_clients)
    r.hset("control_clients", ws_id, robot_id)
    print(f"🤖 Control client connected (robot {robot_id}, ws_id {ws_id})")

    try:
        async for msg in ws:
            if msg.type == WSMsgType.TEXT:
                try:
                    data = json.loads(msg.data)

                    if "control_mode" in data:
                        control_mode = data["control_mode"]
                        print(f"[Robot {robot_id}] Control mode received: {control_mode}")

                        # Ajustement des commandes si nécessaire
                        if control_mode == "PAUSE_MISSION":
                            control_mode = "STOP"
                        elif control_mode == "PLAY_MISSION":
                            control_mode = "LEFT"

                        # 🔹 Sauvegarde de l'état actuel du robot
                        r.set(f"robot:{robot_id}:control_mode", control_mode)

                        # 🔹 Ajout au journal des commandes
                        r.lpush(f"robot:{robot_id}:history", json.dumps(data))

                        # 🔹 Publication Pub/Sub pour tous les abonnés (robots)
                        r.publish(f"robot:{robot_id}", json.dumps({"control_mode": control_mode}))

                except Exception as e:
                    print(f"[Robot {robot_id}] ❌ JSON error in control message: {e}")

            elif msg.type == WSMsgType.ERROR:
                print(f"[Robot {robot_id}] WS connection closed with exception {ws.exception()}")

    finally:
        # Supprimer le client de Redis à la déconnexion
        r.hdel("control_clients", ws_id)
        print(f"🔌 Control client disconnected (robot {robot_id}, ws_id {ws_id})")

    return ws
