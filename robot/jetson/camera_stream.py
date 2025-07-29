import cv2
import asyncio
import websockets
import json

video_uri = "ws://greenertech.mywire.org:8080/service/video_stream_handler"
control_uri = "ws://greenertech.mywire.org:8080/service/control"

async def send_video():
    cap = cv2.VideoCapture(1)

    while True:
        try:
            print("Tentative de connexion au serveur vidéo...")
            async with websockets.connect(video_uri) as websocket:
                print("Connecté au serveur vidéo avec succès")
                while True:
                    ret, frame = cap.read()
                    if not ret:
                        print("Échec de la lecture de la trame depuis la caméra")
                        break

                    _, buffer = cv2.imencode(".jpg", frame)
                    await websocket.send(buffer.tobytes())
                    await asyncio.sleep(0.03)  # ~30fps

        except (websockets.exceptions.ConnectionClosedError, ConnectionRefusedError) as e:
            print(f"❌ Connexion vidéo échouée ou perdue : {e}. Nouvelle tentative dans 2 secondes...")
            await asyncio.sleep(2)

        except Exception as e:
            print(f"❌ Erreur vidéo inattendue : {e}. Nouvelle tentative dans 2 secondes...")
            await asyncio.sleep(2)

async def receive_controls():
    while True:
        try:
            print("Tentative de connexion au serveur contrôle...")
            async with websockets.connect(control_uri) as websocket:
                print("Connecté au serveur contrôle avec succès")
                async for message in websocket:

                    data = json.loads(message)
                    if "control_mode" in data:
                        print(f"Commande contrôle reçue: {data['control_mode']}")
        except (websockets.exceptions.ConnectionClosedError, ConnectionRefusedError) as e:
            print(f"❌ Connexion contrôle échouée ou perdue : {e}. Nouvelle tentative dans 2 secondes...")
            await asyncio.sleep(2)
        except Exception as e:
            print(f"❌ Erreur contrôle inattendue : {e}. Nouvelle tentative dans 2 secondes...")
            await asyncio.sleep(2)


async def main():
    await asyncio.gather(
        send_video(),
        receive_controls()
    )

if __name__ == "__main__":
    asyncio.run(main())
