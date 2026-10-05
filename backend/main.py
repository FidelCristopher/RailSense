"""
RailSense Backend - FastAPI & WebSocket Server
Menjalankan inferensi model YOLOv8-seg dan menyiarkan status keselamatan ke Next.js Web
"""

import os
import json
import asyncio
import cv2
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

app = FastAPI(title="RailSense Backend API", version="1.0.0")

# CORS middleware agar dapat diakses dari Next.js (http://localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model bobot terbaik
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "best.pt")
print(f"Memuat model dari: {MODEL_PATH}")
model = YOLO(MODEL_PATH)

# Status Global
current_system_state = {
    "status": "SAFE",
    "traffic_light": "GREEN",
    "detections": [],
    "alarm": False
}

@app.get("/")
def read_root():
    return {
        "system": "RailSense AI Backend",
        "model": "YOLOv8n-seg",
        "status": current_system_state["status"]
    }

@app.websocket("/ws/crossing-status")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint untuk mengirim data telemetri real-time ke Next.js frontend
    """
    await websocket.accept()
    print("[WebSocket] Client Frontend Terhubung!")
    try:
        while True:
            # Kirim status berkala setiap 500ms
            await websocket.send_text(json.dumps(current_system_state))
            await asyncio.sleep(0.5)
    except WebSocketDisconnect:
        print("[WebSocket] Client Terputus.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
