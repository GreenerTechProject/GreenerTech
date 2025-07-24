import threading
import subprocess
from app import create_app  # Import your Flask app

app = create_app()

def run_flask():
    app.run(host="0.0.0.0", port=5000)

def run_video_stream_service():
    import app.services.video_streaming_service

if __name__ == "__main__":
    t1 = threading.Thread(target=run_flask)
    t2 = threading.Thread(target=run_video_stream_service)

    t1.start()
    t2.start()

    t1.join()
    t2.join()
