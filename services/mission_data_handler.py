import asyncpg
import os
from datetime import datetime
import asyncio
import json
from aiohttp import web, WSMsgType


DB_URL = "postgresql://postgres:postgres@localhost:5433/greenertech"


mission_clients = set()

async def mission_data_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    robot_referance = request.query.get("referance", "")
    print("🔎 Incoming mission request from robot: "+robot_referance)


    mission_clients.add(ws)
    print("📘 Mission WebSocket client connected")

    try:
        while not ws.closed:
            try:
            
                now = datetime.utcnow()
                print("""
                    SELECT * FROM missions_robot 
                    WHERE referance = $1 
                      AND EXTRACT(YEAR FROM date_debut) = $2
                      AND EXTRACT(MONTH FROM date_debut) = $3
                      AND EXTRACT(DAY FROM date_debut) = $4
                      AND EXTRACT(HOUR FROM date_debut) = $5
                      AND EXTRACT(MINUTE FROM date_debut) = $6
                      AND EXTRACT(SECOND FROM created_at) = $7
                    ORDER BY id DESC 
                    LIMIT 1
                    """,
                    robot_referance,
                    now.year, now.month, now.day, now.hour, now.minute, now.second
                )
                conn = await asyncpg.connect(DB_URL)
                robot = await conn.fetchrow("SELECT id FROM robots WHERE referance = $1", robot_referance)
                if not robot:
                    await ws.send_str(json.dumps({"error": "Robot not found"}))
                    continue

                id_robot = robot['id']
                
                rows = await conn.fetch("""
                    SELECT * FROM missions_robot 
                    WHERE id_robot = $1 
                      AND EXTRACT(YEAR FROM date_debut) = $2
                      AND EXTRACT(MONTH FROM date_debut) = $3
                      AND EXTRACT(DAY FROM date_debut) = $4
                      AND EXTRACT(HOUR FROM date_debut) = $5
                      AND EXTRACT(MINUTE FROM date_debut) = $6
                    ORDER BY id DESC 
                    LIMIT 1
                    """,
                    id_robot,
                    now.year, now.month, now.day, now.hour, now.minute
                )
                await conn.close()

                mission = dict(rows[0]) if rows else None
                await ws.send_str(json.dumps({"mission": mission}))
            except Exception as e:
                print(f"❌ Error fetching missions: {e}")
            await asyncio.sleep(5)  # adjust polling interval
    finally:
        mission_clients.discard(ws)
        print("📕 Mission WebSocket client disconnected")

    return ws
