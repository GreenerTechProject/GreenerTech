import asyncpg
import os
from datetime import datetime, timedelta, timezone
import asyncio
import json
from aiohttp import web, WSMsgType


DB_URL = "postgresql://postgres:postgres@localhost:5433/greenertech"


mission_clients = set()

async def mission_data_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    robot_referance = request.query.get("referance", "")
    print("🔎 Incoming mission request from robot: " + robot_referance)

    mission_clients.add(ws)
    print("📘 Mission WebSocket client connected")

    last_mission_id = None
    
    conn = None

    try:
        conn = await asyncpg.connect(DB_URL)
        robot = await conn.fetchrow("SELECT id FROM robots WHERE referance = $1", robot_referance)
        if not robot:
            await ws.send_str(json.dumps({"error": "Robot not found"}))
            await conn.close()
            return ws

        id_robot = robot['id']

        while not ws.closed:
            try:
            
                now = datetime.now(timezone(timedelta(hours=1)))
                #print("""
                #    SELECT * FROM missions_robot 
                #    WHERE referance = $1 
                #      AND EXTRACT(YEAR FROM date_debut) = $2
                #      AND EXTRACT(MONTH FROM date_debut) = $3
                #      AND EXTRACT(DAY FROM date_debut) = $4
                #      AND EXTRACT(HOUR FROM date_debut) = $5
                #      AND EXTRACT(MINUTE FROM date_debut) <= $6
                #    ORDER BY id DESC 
                #    LIMIT 1
                #    """,
                #    robot_referance,
                #    now.year, now.month, now.day, now.hour, now.minute, now.second
                #)
                #0000-00-00 00:00:00
                rows = await conn.fetch("""
                    SELECT * FROM missions_robot 
                    WHERE id_robot = $1 AND ( (
                      EXTRACT(YEAR FROM date_debut) = $2
                      AND EXTRACT(MONTH FROM date_debut) = $3
                      AND EXTRACT(DAY FROM date_debut) = $4
                      AND EXTRACT(HOUR FROM date_debut) = $5
                      AND EXTRACT(MINUTE FROM date_debut) <= $6
                      AND executed = False) 
                      
                      
                      OR ( rep_jr = 1 AND heure = $5 AND minute <= $6 AND executed = False )
                      
                      OR ( rep_sem = 1 AND jour = EXTRACT(DOW FROM NOW()) AND heure = $5 AND minute <= $6 AND executed = False ) )
                    ORDER BY id DESC 
                    LIMIT 1
                    """,
                    id_robot,
                    now.year, now.month, now.day, now.hour, now.minute
                )

                if rows:
                    mission = dict(rows[0])
                    if mission["id"] != last_mission_id:
                        last_mission_id = mission["id"]

                        for k, v in mission.items():
                            if isinstance(v, datetime):
                                mission[k] = v.isoformat()
                        #
                        await conn.execute(f"""
                            UPDATE missions_robot SET executed = True
                            WHERE id = $1
                        """, mission["id"])
                        #await ws.send_str(json.dumps({"mission": mission}))
                        await ws.send_str(json.dumps({ "mission": mission, "control_mode": "LEFT" }))
                else:
                    pass
                #    #await ws.send_str(json.dumps({"type": "no_mission"}))

            except Exception as e:
                print(f"❌ Error fetching missions: {e}")

            await asyncio.sleep(30)

    finally:
        mission_clients.discard(ws)
        if conn is not None:
            await conn.close()
        print("📕 Mission WebSocket client disconnected")

    return ws

