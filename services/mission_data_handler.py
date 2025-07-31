import asyncpg
import os
from datetime import datetime
import asyncio
from aiohttp import web, WSMsgType



async def init_db_pool():
    return await asyncpg.create_pool(dsn="postgresql://postgres:postgres@localhost:5433/greenertech")


import json

mission_clients = {}

async def mission_data_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    
    reference = request.query.get("reference", "")
    print(f"🔎 Robot connected with reference: {reference}")
    
    mission_clients[reference] = ws
    
    try:
        while not ws.closed:
            await asyncio.sleep(1)  # استمر في إبقاء الاتصال حيًا
    finally:
        del mission_clients[reference]
        print(f"📕 Robot {reference} disconnected from missions WebSocket")

    return ws



async def notify_listener(pool):
    while True:
        async with pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT * FROM mission 
                WHERE date_debut <= NOW() AND executed IS FALSE
            """)
            for row in rows:
                ref = row["reference"]
                if ref in mission_clients:
                    try:
                        await mission_clients[ref].send_str(json.dumps({"mission": dict(row)}))
                        await conn.execute("UPDATE mission SET executed = TRUE WHERE id = $1", row["id"])
                        print(f"📤 Mission sent to {ref}")
                    except Exception as e:
                        print(f"❌ Failed to send mission to {ref}: {e}")
        await asyncio.sleep(1)
