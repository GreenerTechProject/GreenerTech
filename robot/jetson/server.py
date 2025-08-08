import asyncio
import websockets
import serial
import json

# Configuration du port série (à adapter selon ton OS ou port réel)
try:
    arduino = serial.Serial('/dev/ttyACM0', 9600)
    print("✅ Port série vers Arduino ouvert.")
except Exception as e:
    print(f"❌ Erreur ouverture port série : {e}")
    arduino = None

host = "greenertech.mywire.org"

async def receive_controls():
    while True:
        try:
            print("Tentative de connexion au serveur contrôle...")
            control_uri = f"ws://{host}:8080/service/control"
            async with websockets.connect(control_uri) as websocket:
                print("✅ Connecté au serveur contrôle.")
                async for message in websocket:
                    print("Message reçu du serveur contrôle :", message)
                    try:
                        data = json.loads(message)
                        if "control_mode" in data:
                            commande = data["control_mode"]
                            print(f"➡️ Commande contrôle reçue : {commande}")
                            
                            if arduino and arduino.is_open:
                                arduino.write((commande + "\n").encode())
                                print("✅ Commande envoyée à Arduino.")
                            else:
                                print("⚠️ Port série non disponible.")
                    except json.JSONDecodeError:
                        print("❌ Erreur de décodage JSON.")
        except (websockets.exceptions.ConnectionClosedError, ConnectionRefusedError) as e:
            print(f"❌ Connexion contrôle échouée/perdue : {e} → Nouvelle tentative dans 2 sec.")
            await asyncio.sleep(2)
        except Exception as e:
            print(f"❌ Erreur inattendue : {e} → Nouvelle tentative dans 2 sec.")
            await asyncio.sleep(2)

async def main():
    #robot_ref = "robot_123"
    
    await asyncio.gather(
        receive_controls()
        )




# Exemple de lancement si ce script est exécuté seul
if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main())
