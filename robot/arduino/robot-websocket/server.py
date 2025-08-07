import asyncio
import websockets
import serial

arduino = serial.Serial('/dev/ttyACM0', 9600)

async def handle_connection(websocket, path):
    async for message in websocket:
        print("Commande reçue :", message)
        arduino.write(message.encode())

start_server = websockets.serve(handle_connection, '0.0.0.0', 8765)

asyncio.get_event_loop().run_until_complete(start_server)
print("Serveur WebSocket actif sur ws://0.0.0.0:8765")
asyncio.get_event_loop().run_forever()

