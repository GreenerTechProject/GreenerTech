import asyncpg
import os
from datetime import datetime
import asyncio
from aiohttp import web, WSMsgType


DB_URL = "postgresql://postgres:postgres@localhost:5433/greenertech"


mission_clients = set()

pool = None

async def init_db_pool():
    global pool
    pool = await asyncpg.create_pool(dsn=DB_URL, min_size=1, max_size=10)

async def mission_data_handler(request):
    global pool
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    robot_reference = request.query.get("reference", "")
    print("🔎 Incoming mission request from robot: "+robot_reference)

    mission_clients.add(ws)
    print("📘 Mission WebSocket client connected")

    try:
        while not ws.closed:
            try:
                now = datetime.utcnow()
                async with pool.acquire() as conn:
                    rows = await conn.fetch("""
                        SELECT * FROM mission 
                        WHERE reference = $1 
                          AND EXTRACT(YEAR FROM date_debut) = $2
                          AND EXTRACT(MONTH FROM date_debut) = $3
                          AND EXTRACT(DAY FROM date_debut) = $4
                          AND EXTRACT(HOUR FROM date_debut) = $5
                          AND EXTRACT(MINUTE FROM date_debut) = $6
                          AND EXTRACT(SECOND FROM created_at) = $7
                        ORDER BY id DESC 
                        LIMIT 1
                        """,
                        robot_reference,
                        now.year, now.month, now.day, now.hour, now.minute, now.second
                    )

                mission = dict(rows[0]) if rows else None
                await ws.send_str(json.dumps({"mission": mission}))
            except Exception as e:
                print(f"❌ Error fetching missions: {e}")
            await asyncio.sleep(5)
    finally:
        mission_clients.discard(ws)
        print("📕 Mission WebSocket client disconnected")

    return ws