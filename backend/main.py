"""
RailSense Backend - Real-time AI Video Streamer & WebSocket Interlocking
Menjalankan model YOLOv8-seg pada CCTV/YouTube Live dan me-stream hasil berarsir poligon via /video_feed
"""

import os
import time
import json
import asyncio
import glob
import threading
import cv2
import numpy as np
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO

app = FastAPI(title="RailSense AI Stream Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Load Model
MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "best.pt"))
print(f"[RailSense] Memuat model AI dari: {MODEL_PATH}")
model = YOLO(MODEL_PATH)

# 2. State Global Sistem
current_system_state = {
    "status": "SAFE",
    "traffic_light": "GREEN",
    "condition": "Palang Terbuka / Rel Steril",
    "confidence": 0.92,
    "detections": [],
    "fps": 30.0,
    "source_name": "JPL 04 Bandung (Live Simulation Feed)",
    "timestamp": ""
}

# Lock untuk sinkronisasi frame
frame_lock = threading.Lock()
latest_annotated_frame: Optional[bytes] = None

# 3. Stream Manager (Mendukung YouTube Live, .m3u8 Dishub, dan Fallback Sample Video Loop)
class StreamManager:
    def __init__(self):
        self.running = True
        self.source_url = None
        self.cap = None
        self.fallback_images = []
        self._init_fallback_samples()

    def _init_fallback_samples(self):
        # Ambil sampel gambar dari dataset sebagai fallback stream loop jika tidak ada koneksi
        sample_pattern = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "datasets", "dataset_tambahan", "train", "images", "*.*")
        )
        self.fallback_images = sorted(glob.glob(sample_pattern))
        if not self.fallback_images:
            alt_pattern = os.path.abspath(
                os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "samples", "*.*")
            )
            self.fallback_images = sorted(glob.glob(alt_pattern))

    def set_source(self, url: str):
        print(f"[StreamManager] Mengubah sumber video ke: {url}")
        self.source_url = url
        if self.cap:
            self.cap.release()
            self.cap = None

    def _get_stream_capture(self):
        if not self.source_url:
            return None

        # Jika URL adalah YouTube, ekstrak HLS stream menggunakan yt-dlp
        if "youtube.com" in self.source_url or "youtu.be" in self.source_url:
            try:
                import yt_dlp
                ydl_opts = {'format': 'best[ext=mp4]/best', 'quiet': True}
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(self.source_url, download=False)
                    stream_url = info.get('url')
                    if stream_url:
                        return cv2.VideoCapture(stream_url)
            except Exception as e:
                print(f"[StreamManager] Gagal parse YouTube URL: {e}")
                return None

        # Jika URL langsung (.m3u8, rtsp, mp4)
        return cv2.VideoCapture(self.source_url)

    def worker_loop(self):
        global latest_annotated_frame, current_system_state
        img_idx = 0
        last_time = time.time()

        while self.running:
            raw_frame = None

            # Coba ambil frame dari capture stream jika ada
            if self.source_url:
                if not self.cap or not self.cap.isOpened():
                    self.cap = self._get_stream_capture()

                if self.cap and self.cap.isOpened():
                    ret, frame = self.cap.read()
                    if ret:
                        raw_frame = frame
                    else:
                        print("[StreamManager] Stream terputus, mencoba rekoneksi...")
                        self.cap.release()
                        self.cap = None
                        time.sleep(1)

            # Jika tidak ada live stream atau terputus, gunakan fallback sample images loop
            if raw_frame is None and self.fallback_images:
                img_path = self.fallback_images[img_idx % len(self.fallback_images)]
                raw_frame = cv2.imread(img_path)
                time.sleep(1.0)  # ganti frame setiap 1 detik untuk simulasi CCTV
                img_idx += 1

            if raw_frame is None:
                # Blank frame darurat jika tidak ada gambar
                raw_frame = np.zeros((480, 640, 3), dtype=np.uint8)
                cv2.putText(raw_frame, "MENUNGGU FEED CCTV...", (50, 240),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                time.sleep(0.1)

            # --- JALANKAN INFERENSI YOLOV8-SEG DI GPU/CPU ---
            try:
                resized_input = cv2.resize(raw_frame, (640, 640))
                results = model(resized_input, conf=0.25, verbose=False)
                annotated = results[0].plot()  # Menggambar mask poligon otomatis

                # Ekstrak kelas & evaluasi status
                detected_classes = []
                for box in results[0].boxes:
                    cls_id = int(box.cls[0])
                    name = model.names[cls_id]
                    conf = float(box.conf[0])
                    detected_classes.append({"class": name, "confidence": round(conf, 2)})

                class_names = [d["class"] for d in detected_classes]

                # Logika Keselamatan RailSense
                if "danger" in class_names:
                    status = "DANGER"
                    traffic_light = "RED"
                    condition = "Kondisi 3: Terdeteksi Kendaraan Terjebak di Rel!"
                elif "safe" in class_names:
                    status = "SAFE"
                    traffic_light = "GREEN"
                    condition = "Kondisi Aman: Palang Terbuka / Rel Steril"
                else:
                    status = "SAFE"
                    traffic_light = "GREEN"
                    condition = "Perlintasan Siaga"

                # Hitung FPS
                now = time.time()
                fps = round(1.0 / max(0.001, (now - last_time)), 1)
                last_time = now

                # Update State Global
                current_system_state["status"] = status
                current_system_state["traffic_light"] = traffic_light
                current_system_state["condition"] = condition
                current_system_state["detections"] = detected_classes
                current_system_state["fps"] = fps
                current_system_state["timestamp"] = time.strftime("%H:%M:%S")

                # Encode Frame ke JPEG untuk MJPEG Streamer
                ret_enc, buffer = cv2.imencode('.jpg', annotated, [cv2.IMWRITE_JPEG_QUALITY, 80])
                if ret_enc:
                    with frame_lock:
                        latest_annotated_frame = buffer.tobytes()

            except Exception as e:
                print(f"[Inference Error]: {e}")
                time.sleep(0.1)

stream_manager = StreamManager()
stream_thread = threading.Thread(target=stream_manager.worker_loop, daemon=True)
stream_thread.start()

# 4. HTTP Endpoint Streaming MJPEG (/video_feed)
def generate_mjpeg():
    while True:
        with frame_lock:
            frame = latest_annotated_frame

        if frame:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        time.sleep(0.033)  # ~30 FPS

@app.get("/video_feed")
def video_feed():
    """
    Endpoint MJPEG streaming: menampilkan live video feed yang sudah
    diarsir dengan poligon YOLOv8-seg secara real-time.
    Bisa langsung dipanggil di Next.js: <img src="http://localhost:8000/video_feed" />
    """
    return StreamingResponse(
        generate_mjpeg(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

# 5. REST & WebSocket Endpoints
@app.get("/api/status")
def get_status():
    return current_system_state

class SourcePayload(BaseModel):
    url: str

@app.post("/api/set_source")
def set_source(payload: SourcePayload):
    stream_manager.set_source(payload.url)
    return {"message": "Sumber stream diperbarui", "url": payload.url}

@app.websocket("/ws/crossing-status")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("[WebSocket] Dashboard Frontend Terhubung!")
    try:
        while True:
            await websocket.send_text(json.dumps(current_system_state))
            await asyncio.sleep(0.25)  # Kirim telemetri 4x per detik
    except WebSocketDisconnect:
        print("[WebSocket] Dashboard Terputus.")

if __name__ == "__main__":
    import uvicorn
    print("[RailSense] Menjalankan server di http://0.0.0.0:8000")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
