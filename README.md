# 🚆 RailSense
### *Intelligent Railway Crossing & Traffic Light Interlocking System*

[![Computer Vision](https://img.shields.io/badge/Computer%20Vision-YOLOv8--seg-blue?style=for-the-badge&logo=yolo)](https://ultralytics.com)
[![PyTorch](https://img.shields.io/badge/PyTorch-CUDA%2012.4-EE4C2C?style=for-the-badge&logo=pytorch)](https://pytorch.org)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014%20(TS)-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

## 📌 1. Latar Belakang & Ringkasan Proyek

Kecelakaan pada perlintasan sebidang rel kereta api di Indonesia sering kali terjadi bukan semata-mata karena kelalaian masinis, melainkan akibat **antrean kendaraan bermotor (bus, mobil, atau motor) yang terjebak di tengah rel akibat kemacetan di persimpangan jalan di belakangnya saat palang pintu mulai tertutup**.

**RailSense** adalah sistem keselamatan cerdas berbasis *Computer Vision (Instance Segmentation)* dan *Real-Time Interlocking System*. Sistem ini memantau area perlintasan kereta melalui kamera CCTV secara otomatis. Jika terdeteksi adanya kendaraan atau rintangan yang terjebak saat palang tertutup, sistem secara instan mengirimkan sinyal kendali untuk **mengubah lampu lalu lintas (traffic light) di persimpangan jalan belakangnya menjadi KUNING lalu MERAH**, memblokir arus kendaraan yang masuk, mengurai kemacetan, dan membunyikan peringatan darurat sebelum kereta melintas.

---

## 🚦 2. Logika Keselamatan (*Safety Decision Matrix*)

Sistem RailSense mengklasifikasikan kondisi operasional menjadi 3 aturan logika utama:

| Kondisi | Status Palang | Kondisi Zona Rel | Status Sistem | Aksi Traffic Light & Alarm |
| :---: | :---: | :---: | :---: | :--- |
| **Kondisi 1** | Terbuka (*Open*) | Arus kendaraan ramai/normal | 🟢 **SAFE** | **HIJAU** (Arus lalu lintas berjalan normal). |
| **Kondisi 2** | Tertutup (*Closed*) | Zona rel bersih tanpa halangan | 🟢 **SAFE** | **HIJAU / NORMAL INTERLOCK** (Kereta lewat tanpa rintangan). |
| **Kondisi 3** | Tertutup (*Closed*) | **Kendaraan / Objek terjebak di rel** | 🔴 **DANGER** | **KUNING ➔ MERAH** (Stop arus kendaraan belakang) + **Alarm Darurat AKTIF**. |

---

## 🧠 3. Model Computer Vision (AI Engine)

* **Arsitektur Model**: **YOLOv8 Nano Instance Segmentation (`yolov8n-seg.pt`)**
* **Keunggulan Segmentasi**: Tidak hanya membuat kotak *bounding box*, melainkan menghasilkan arsiran poligon (*pixel-level mask*) presisi tinggi yang melacak lekukan kendaraan yang melanggar batas rel.
* **Target Kelas**:
  1. `[0] danger`: Kendaraan/rintangan yang terjebak di zona rel saat palang tertutup.
  2. `[1] safe`: Palang terbuka normal atau perlintasan bersih tanpa gangguan.
* **Hardware Akselerasi**: Dilatih dan dioptimalkan dengan akselerasi **NVIDIA GPU (CUDA)**.

---

## 🏗️ 4. Arsitektur Sistem

```text
[ CCTV Stream / Video Feed ]
              │ (RTSP / HLS / Video File)
              ▼
    [ Python Backend (FastAPI) ]
              │
              ├──▶ [ OpenCV Frame Ingestion & Buffer ]
              │
              ├──▶ [ YOLOv8-seg Inference Engine (CUDA) ]
              │
              ├──▶ [ Safety Decision & Smoothing Filter ]
              │
              └──▶ [ WebSocket Broadcaster (sub-50ms) ]
                               │
                               ▼
            [ Frontend Web Dashboard (Next.js + TypeScript) ]
              ├── 📺 Live CCTV Stream dengan Mask Overlay
              ├── 🚦 Digital Traffic Light Interlocking Indicator
              ├── 🚨 Alarm Peringatan Darurat
              └── 📋 Riwayat Log Insiden Real-time
```

---

## 💻 5. Tech Stack

### Frontend:
* **Framework**: [Next.js](https://nextjs.org/) (App Router, React 18/19)
* **Bahasa**: [TypeScript](https://www.typescriptlang.org/)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **Komunikasi**: WebSocket Client + REST Fetch

### Backend (Rekomendasi):
* **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python Asynchronous ASGI)
* **Computer Vision**: [Ultralytics YOLOv8](https://docs.ultralytics.com/) & [OpenCV (cv2)](https://opencv.org/)
* **Deep Learning Runtime**: [PyTorch with CUDA 12.4](https://pytorch.org/)
* **Server**: Uvicorn ASGI Server

---

## 📁 6. Struktur Direktori Proyek

```text
RailSense/
├── README.md                 # Dokumentasi utama proyek
├── best.pt                   # Bobot model YOLOv8-seg terbaik hasil training
├── yolov8n-seg.pt            # Pretrained base model
├── train_model.ipynb         # Notebook training GPU lokal (CUDA)
├── test_model.ipynb          # Notebook verifikasi & simulasi interlocking
├── dataset_tambahan/         # 52 Gambar poligon (danger vs safe)
├── seg_dataset/              # Dataset split (train 80% : valid 20%)
│
├── frontend/                 # Web Dashboard (Next.js + TypeScript)
│   ├── app/
│   │   ├── page.tsx          # Halaman utama dashboard monitoring
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/           # Komponen UI (TrafficLight, LiveStream, LogTable)
│   └── package.json
│
└── backend/                  # API & Engine Inferensi (FastAPI)
    ├── main.py
    └── requirements.txt
```

---

## 🚀 7. Panduan Menjalankan Sistem

### A. Persiapan Lingkungan Model & Python
Pastikan PyTorch dengan CUDA telah terpasang:
```bash
# Uji model inferensi lokal
# Buka test_model.ipynb di VS Code dan jalankan pengujian
```

### B. Menjalankan Frontend Web (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Buka browser pada alamat `http://localhost:3000`.

---

## 🔮 8. Roadmap Pengembangan Selanjutnya
- [x] Kurasi dataset spesifik (52 gambar poligon Danger vs Safe).
- [x] Training model Instance Segmentation dengan akselerasi GPU (CUDA).
- [x] Validasi logika keselamatan & simulasi respons traffic light.
- [ ] Implementasi Backend FastAPI dengan WebSocket stream.
- [ ] Integrasi feed CCTV publik / RTSP Dishub secara langsung.
- [ ] Pengujian lapangan dengan modul IoT ESP32 untuk mengontrol traffic light fisik.

---
**RailSense Team** © 2026. *Building Smarter, Safer Crossings with Computer Vision.*
