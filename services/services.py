import asyncio
from aiohttp import web, WSMsgType
#from video_streaming_service_ai import index, offer, video_stream_handler, qr_data_handler, monitor_video_timeout
from robotcontrole_service import control_handler
from sensors_realtime_service import sensor_data_handler
#from mission_data_handler import mission_data_handler

async def start_all():
    app = web.Application()
    #app.router.add_get("/video/", index)
    #app.router.add_post("/service/video_stream_service", offer)
    #app.router.add_get("/service/video_stream_handler", video_stream_handler)
    #app.router.add_get("/service/qr_data", qr_data_handler)
    app.router.add_get("/service/control", control_handler)
    app.router.add_get("/service/sensor_data", sensor_data_handler)
    app.router.add_get("/service/missions", mission_data_handler)


    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", 8080)
    await site.start()
    print("✅ HTTP + WebSocket server running at http://0.0.0.0:8080")

    asyncio.create_task(monitor_video_timeout())
    await asyncio.Future()

asyncio.run(start_all())
