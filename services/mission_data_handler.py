from aiohttp import web, WSMsgType
import json
import asyncpg
import datetime

DB_URL = "postgresql://postgres:postgres@localhost:5433/greenertech"

mission_clients = set()

async def broadcast_mission_update(data):
    disconnected = []
    for ws in mission_clients:
        if ws.closed:
            disconnected.append(ws)
        else:
            try:
                await ws.send_str(json.dumps(data))
            except:
                disconnected.append(ws)
    for ws in disconnected:
        mission_clients.discard(ws)

async def mission_data_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    mission_clients.add(ws)
    print("🚀 Mission WebSocket client connected")

    try:
        async for msg in ws:
            if msg.type == WSMsgType.TEXT:
                try:
                    data = json.loads(msg.data)
                    action = data.get("action")

                    conn = await asyncpg.connect(DB_URL)

                    if action == "create":
                        referance = data.get("referance")
                        id_serre = data.get("id_serre")
                        date_debut = datetime.fromisoformat(data.get("date_debut"))
                        date_fin = datetime.fromisoformat(data.get("date_fin"))
                        rep_jr = data.get("rep_jr", 0)
                        rep_sem = data.get("rep_sem", 0)

                        if not (referance and id_serre and date_debut and date_fin):
                            await ws.send_str(json.dumps({"error": "Missing fields"}))
                            continue

                        robot = await conn.fetchrow("SELECT id FROM robots WHERE referance = $1", referance)
                        if not robot:
                            await ws.send_str(json.dumps({"error": "Robot not found"}))
                            continue

                        id_robot = robot['id']

                        result = await conn.fetchrow("""
                            INSERT INTO missions_robot (id_serre, id_robot, date_debut, date_fin, rep_jr, rep_sem)
                            VALUES ($1, $2, $3, $4, $5, $6)
                            RETURNING *
                        """, id_serre, id_robot, date_debut, date_fin, rep_jr, rep_sem)

                        await broadcast_mission_update({"event": "created", "mission": dict(result)})

                        await ws.send_str(json.dumps({"success": "Mission created", "mission": dict(result)}))

                    elif action == "read":
                        id_mission = data.get("id")
                        if id_mission:
                            mission = await conn.fetchrow("SELECT * FROM missions_robot WHERE id = $1", id_mission)
                            if mission:
                                await ws.send_str(json.dumps(dict(mission)))
                            else:
                                await ws.send_str(json.dumps({"error": "Mission not found"}))
                        else:
                            missions = await conn.fetch("SELECT * FROM missions_robot")
                            await ws.send_str(json.dumps([dict(m) for m in missions]))

                    elif action == "update":
                        id_mission = data.get("id")
                        fields = ["id_serre", "date_debut", "date_fin", "rep_jr", "rep_sem"]
                        updates = {f: data[f] for f in fields if f in data}

                        if not id_mission or not updates:
                            await ws.send_str(json.dumps({"error": "Missing ID or data to update"}))
                            continue

                        set_clause = ", ".join([f"{k} = ${i+2}" for i, k in enumerate(updates.keys())])
                        values = list(updates.values())

                        await conn.execute(f"""
                            UPDATE missions_robot SET {set_clause}
                            WHERE id = $1
                        """, id_mission, *values)

                        updated_mission = await conn.fetchrow("SELECT * FROM missions_robot WHERE id = $1", id_mission)

                        await broadcast_mission_update({"event": "updated", "mission": dict(updated_mission)})

                        await ws.send_str(json.dumps({"success": "Mission updated", "mission": dict(updated_mission)}))

                    elif action == "delete":
                        id_mission = data.get("id")
                        if not id_mission:
                            await ws.send_str(json.dumps({"error": "Missing mission ID"}))
                            continue

                        await conn.execute("DELETE FROM missions_robot WHERE id = $1", id_mission)

                        await broadcast_mission_update({"event": "deleted", "mission_id": id_mission})

                        await ws.send_str(json.dumps({"success": "Mission deleted"}))

                    else:
                        await ws.send_str(json.dumps({"error": "Invalid action"}))

                    await conn.close()

                except Exception as e:
                    await ws.send_str(json.dumps({"error": str(e)}))

            elif msg.type == WSMsgType.ERROR:
                print('WebSocket connection closed with exception %s' % ws.exception())

    finally:
        mission_clients.discard(ws)
        print("❌ Mission WebSocket client disconnected")

    return ws
