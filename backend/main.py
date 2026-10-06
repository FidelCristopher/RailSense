"""
RailSense Backend - Real-time AI Video Streamer & WebSocket Interlocking
Menjalankan model YOLOv8-seg pada CCTV / YouTube Live perlintasan kereta api
dan me-stream hasil berarsir poligon via /video_feed
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

# Default: Video Perlintasan Kereta Api Indonesia Nyata
DEFAULT_STREAM_URL = "https://www.youtube.com/watch?v=wDfaAyOyYDQ"

# 2. State Global Sistem
current_system_state = {
    "status": "SAFE",
    "traffic_light": "GREEN",
    "condition": "Memantau Perlintasan...",
    "confidence": 0.92,
    "detections": [],
    "fps": 25.0,
    "source_name": "Perlintasan Kereta Api Balecatur Yogyakarta",
    "source_url": DEFAULT_STREAM_URL,
    "timestamp": ""
}

# Lock untuk sinkronisasi frame
frame_lock = threading.Lock()
latest_annotated_frame: Optional[bytes] = None

# 3. Stream Manager: Mendukung YouTube Live/Video, M3U8, RTSP, dan Webcam
class StreamManager:
    def __init__(self):
        self.running = True
        self.source_url = DEFAULT_STREAM_URL
        self.cap = None
        self.fallback_images = []
        self._init_fallback_samples()

    def _init_fallback_samples(self):
        sample_pattern = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "datasets", "dataset_tambahan", "train", "images", "*.*")
        )
        self.fallback_images = sorted(glob.glob(sample_pattern))

    def set_source(self, url: str, name: str = ""):
        print(f"[StreamManager] Mengalihkan sumber video ke: {url}")
        self.source_url = url
        if name:
            current_system_state["source_name"] = name
        current_system_state["source_url"] = url
        if self.cap:
            try:
                self.cap.release()
            except Exception:
                pass
            self.cap = None

    def _extract_youtube_stream(self, yt_url: str):
        try:
            import yt_dlp
            ydl_opts = {
                'quiet': True,
                'no_warnings': True,
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(yt_url, download=False)
                # Prioritaskan format video 720p atau 480p agar inferensi lancar tanpa lag jaringan
                v_formats = [
                    f for f in info.get('formats', [])
                    if f.get('vcodec') != 'none' and f.get('url') and (f.get('height') or 0) <= 720
                ]
                chosen = v_formats[-1] if v_formats else info['formats'][0]
                return chosen.get('url')
        except Exception as e:
            print(f"[StreamManager] Gagal ekstrak YouTube stream: {e}")
            return None

    def _open_capture(self):
        if not self.source_url:
            return None

        # Jika webcam lokal (misal input '0')
        if str(self.source_url).strip() == "0":
            print("[StreamManager] Membuka webcam lokal...")
            return cv2.VideoCapture(0)

        # Jika YouTube URL
        if "youtube.com" in self.source_url or "youtu.be" in self.source_url:
            print(f"[StreamManager] Menghubungkan ke YouTube stream: {self.source_url}")
            direct_url = self._extract_youtube_stream(self.source_url)
            if direct_url:
                cap = cv2.VideoCapture(direct_url)
                if cap.isOpened():
                    print("[StreamManager] Berhasil terhubung ke YouTube stream!")
                    return cap

        # Jika direct URL (HLS .m3u8, RTSP, atau MP4)
        print(f"[StreamManager] Membuka URL stream langsung: {self.source_url}")
        cap = cv2.VideoCapture(self.source_url)
        if cap.isOpened():
            return cap

        return None

    def worker_loop(self):
        global latest_annotated_frame, current_system_state
        img_idx = 0
        last_time = time.time()

        while self.running:
            raw_frame = None

            # 1. Coba baca frame dari capture aktif
            if not self.cap or not self.cap.isOpened():
                self.cap = self._open_capture()

            if self.cap and self.cap.isOpened():
                ret, frame = self.cap.read()
                if ret and frame is not None:
                    raw_frame = frame
                else:
                    # Jika video habis (bukan live stream tak terbatas), putar ulang dari awal
                    pos = self.cap.get(cv2.CAP_PROP_POS_FRAMES)
                    total = self.cap.get(cv2.CAP_PROP_FRAME_COUNT)
                    if total > 0 and pos >= total:
                        self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    else:
                        print("[StreamManager] Stream terputus, mencoba rekoneksi dalam 2 detik...")
                        try:
                            self.cap.release()
                        except Exception:
                            pass
                        self.cap = None
                        time.sleep(2)

            # 2. Fallback darurat jika koneksi internet terputus
            if raw_frame is None and self.fallback_images:
                img_path = self.fallback_images[img_idx % len(self.fallback_images)]
                raw_frame = cv2.imread(img_path)
                time.sleep(0.08)
                img_idx += 1

            if raw_frame is None:
                raw_frame = np.zeros((480, 640, 3), dtype=np.uint8)
                cv2.putText(raw_frame, "MENUNGGU FEED CCTV...", (50, 240),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                time.sleep(0.1)

            # 3. Jalankan Inferensi YOLOv8-seg
            try:
                resized_input = cv2.resize(raw_frame, (640, 640))
                results = model(resized_input, conf=0.25, verbose=False)
                annotated = results[0].plot()  # Menggambar arsiran poligon otomatis

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
                    condition = "Kondisi Aman: Jalur Perlintasan Terkendali"
                else:
                    status = "SAFE"
                    traffic_light = "GREEN"
                    condition = "Perlintasan Siaga"

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
                time.sleep(0.05)

stream_manager = StreamManager()
stream_thread = threading.Thread(target=stream_manager.worker_loop, daemon=True)
stream_thread.start()

# 4. HTTP Endpoint Streaming MJPEG (/video_feed)
def generate_mjpeg():
    last_sent = None
    while True:
        with frame_lock:
            frame = latest_annotated_frame

        if frame and frame != last_sent:
            last_sent = frame
            header = (
                b'--frame\r\n'
                b'Content-Type: image/jpeg\r\n'
                b'Content-Length: ' + str(len(frame)).encode() + b'\r\n\r\n'
            )
            yield header + frame + b'\r\n'
        time.sleep(0.04)

@app.get("/video_feed")
def video_feed():
    """
    Endpoint MJPEG streaming: menampilkan live video feed yang sudah
    diarsir dengan poligon YOLOv8-seg secara real-time.
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
    name: Optional[str] = "Custom Stream Feed"

@app.post("/api/set_source")
def set_source(payload: SourcePayload):
    stream_manager.set_source(payload.url, payload.name)
    return {"message": "Sumber stream berhasil diperbarui", "url": payload.url, "name": payload.name}

@app.websocket("/ws/crossing-status")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("[WebSocket] Dashboard Frontend Terhubung!")
    try:
        while True:
            await websocket.send_text(json.dumps(current_system_state))
            await asyncio.sleep(0.25)
    except WebSocketDisconnect:
        print("[WebSocket] Dashboard Terputus.")

if __name__ == "__main__":
    import uvicorn
    print("[RailSense] Menjalankan server di http://0.0.0.0:8000")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
