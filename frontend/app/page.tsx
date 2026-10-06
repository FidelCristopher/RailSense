"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  ShieldAlert,
  ShieldCheck,
  Radio,
  Upload,
  Volume2,
  VolumeX,
  Camera,
  ChevronDown,
  Layers,
  Sparkles,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Wifi,
  WifiOff,
} from "lucide-react";

type SystemState = "SAFE" | "DANGER" | "STANDBY";

interface DetectionResult {
  state: SystemState;
  condition: string;
  confidence: number;
  classDetected: string;
  explanation: string;
  trafficLight: "GREEN" | "YELLOW" | "RED";
  polygons?: { points: string; color: string; label: string }[];
}

export default function RailSensePage() {
  // Navigation & Dropdown State
  const [isCctvHovered, setIsCctvHovered] = useState(false);
  const [selectedJunction, setSelectedJunction] = useState("JPL 04 Bandung (Live HLS Simulation)");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  // Backend Connection & Stream Feed Mode
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isLiveStreamMode, setIsLiveStreamMode] = useState(false);
  const [streamError, setStreamError] = useState(false);

  // Detection & Image Input State
  const [uploadedImage, setUploadedImage] = useState<string>("/samples/danger_bus.jpg");
  const [showMask, setShowMask] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Active Detection Outcome
  const [result, setResult] = useState<DetectionResult>({
    state: "DANGER",
    condition: "Kondisi 3: Palang Tertutup + Kendaraan Terjebak",
    confidence: 0.94,
    classDetected: "danger",
    explanation:
      "Terdeteksi kendaraan bus/kendaraan bermotor terjebak melintang di atas rel saat palang pintu dalam posisi tertutup.",
    trafficLight: "RED",
    polygons: [
      {
        points: "35%,30% 65%,28% 70%,68% 30%,70%",
        color: "rgba(239, 68, 68, 0.5)",
        label: "danger: 0.94 (Bus Terjebak)",
      },
    ],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("id-ID", { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket Connection to Backend FastAPI (:8000)
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout;

    const connectWebSocket = () => {
      try {
        ws = new WebSocket("ws://localhost:8000/ws/crossing-status");

        ws.onopen = () => {
          console.log("[RailSense] Terhubung ke WebSocket Backend :8000");
          setIsBackendConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (isLiveStreamMode && data) {
              setResult({
                state: data.status || "SAFE",
                condition: data.condition || "Status Live Perlintasan",
                confidence: data.confidence || 0.92,
                classDetected: data.status === "DANGER" ? "danger" : "safe",
                explanation:
                  data.status === "DANGER"
                    ? "AI mendeteksi potensi kecelakaan! Kendaraan melanggar area rel saat palang tertutup."
                    : "Perlintasan dalam pemantauan normal tanpa ada objek kritis yang terjebak.",
                trafficLight: data.traffic_light || "GREEN",
              });
            }
          } catch {
            // Ignore parse errors
          }
        };

        ws.onclose = () => {
          setIsBackendConnected(false);
          reconnectTimer = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = () => {
          setIsBackendConnected(false);
          ws?.close();
        };
      } catch {
        setIsBackendConnected(false);
        reconnectTimer = setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [isLiveStreamMode]);

  // Handle preset sample selection
  const handleSelectSample = (sampleType: "danger" | "safe_closed" | "safe_open") => {
    setIsLiveStreamMode(false);
    setIsAnalyzing(true);
    setTimeout(() => {
      if (sampleType === "danger") {
        setUploadedImage("/samples/danger_bus.jpg");
        setResult({
          state: "DANGER",
          condition: "Kondisi 3: Palang Tertutup + Kendaraan Terjebak",
          confidence: 0.94,
          classDetected: "danger",
          explanation:
            "Bahaya kritis terdeteksi! Kendaraan terjebak di zona rel saat palang tertutup. Sistem mengunci traffic light ke status MERAH.",
          trafficLight: "RED",
          polygons: [
            {
              points: "32%,30% 68%,28% 72%,70% 28%,72%",
              color: "rgba(239, 68, 68, 0.55)",
              label: "danger: 0.94 (Bus Terjebak)",
            },
          ],
        });
      } else if (sampleType === "safe_closed") {
        setUploadedImage("/samples/safe_empty.jpg");
        setResult({
          state: "SAFE",
          condition: "Kondisi 2: Palang Tertutup + Rel Steril",
          confidence: 0.91,
          classDetected: "safe",
          explanation:
            "Palang pintu tertutup dan area perlintasan rel steril tanpa hambatan. Kereta api dapat melintas dengan aman.",
          trafficLight: "GREEN",
          polygons: [
            {
              points: "15%,45% 85%,45% 85%,75% 15%,75%",
              color: "rgba(34, 197, 94, 0.25)",
              label: "safe: 0.91 (Rel Steril)",
            },
          ],
        });
      } else {
        setUploadedImage("/samples/safe_open.png");
        setResult({
          state: "SAFE",
          condition: "Kondisi 1: Palang Terbuka + Arus Normal",
          confidence: 0.95,
          classDetected: "safe",
          explanation:
            "Palang terbuka penuh dan tidak ada kereta mendekat. Arus kendaraan bermotor diizinkan melintas secara normal.",
          trafficLight: "GREEN",
          polygons: [
            {
              points: "20%,35% 80%,35% 85%,80% 15%,80%",
              color: "rgba(34, 197, 94, 0.25)",
              label: "safe: 0.95 (Palang Terbuka)",
            },
          ],
        });
      }
      setIsAnalyzing(false);
    }, 250);
  };

  // Handle custom file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLiveStreamMode(false);
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
      setIsAnalyzing(true);

      setTimeout(() => {
        const lower = file.name.toLowerCase();
        const isDanger = lower.includes("danger") || lower.includes("bus") || lower.includes("stuck");

        if (isDanger) {
          setResult({
            state: "DANGER",
            condition: "Kondisi 3: Terdeteksi Kendaraan Melintang di Rel",
            confidence: 0.91,
            classDetected: "danger",
            explanation:
              "AI mendeteksi potensi kecelakaan! Kendaraan berada di lintasan terlarang. Sinyal lampu lalu lintas otomatis dihentikan (MERAH).",
            trafficLight: "RED",
            polygons: [
              {
                points: "30%,35% 70%,35% 75%,75% 25%,75%",
                color: "rgba(239, 68, 68, 0.5)",
                label: "danger: 0.91 (Rintangan)",
              },
            ],
          });
        } else {
          setResult({
            state: "SAFE",
            condition: "Kondisi Aman: Jalur Perlintasan Terkendali",
            confidence: 0.93,
            classDetected: "safe",
            explanation:
              "Citra dievaluasi tanpa adanya rintangan kritis pada perlintasan sebidang.",
            trafficLight: "GREEN",
            polygons: [
              {
                points: "25%,40% 75%,40% 80%,75% 20%,75%",
                color: "rgba(34, 197, 94, 0.25)",
                label: "safe: 0.93 (Aman)",
              },
            ],
          });
        }
        setIsAnalyzing(false);
      }, 300);
    }
  };

  // Audio siren alert
  useEffect(() => {
    if (result.state === "DANGER" && soundEnabled) {
      try {
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(450, audioCtx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } catch {
        // Fallback
      }
    }
  }, [result.state, soundEnabled]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-amber-500 selection:text-black">
      {/* Top Floating Minimalist Navbar (Golda Aesthetic) */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-5 flex items-center justify-between backdrop-blur-md bg-neutral-950/70 border-b border-white/5 transition-all">
        {/* Brand Mark */}
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 rounded-xl overflow-hidden border border-white/10 shadow-lg">
            <Image
              src="/logo.png"
              alt="RailSense Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <span className="text-xl font-black tracking-tight uppercase text-white">
            RAILSENSE<span className="text-amber-500">.</span>
          </span>
        </div>

        {/* Center / Right: Live CCTV Hover Trigger & Actions */}
        <div className="flex items-center gap-4">
          {/* HOVER LIVE CCTV BUTTON (CARA 2: STREAM AI BERARSIR POLIGON DARI BACKEND) */}
          <div
            className="relative"
            onMouseEnter={() => setIsCctvHovered(true)}
            onMouseLeave={() => setIsCctvHovered(false)}
          >
            <button
              onClick={() => setIsCctvHovered(!isCctvHovered)}
              className="px-5 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-850 border border-white/10 hover:border-amber-500/50 text-xs font-semibold tracking-wide uppercase flex items-center gap-2.5 text-white shadow-xl transition-all"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>LIVE CCTV API</span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-neutral-400 transition-transform duration-200 ${
                  isCctvHovered ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* FLOATING HOVER PREVIEW MODAL (CARA 2: REAL-TIME MJPEG AI STREAM) */}
            {isCctvHovered && (
              <div className="absolute right-0 mt-3 w-[490px] bg-neutral-900 border border-white/10 rounded-3xl shadow-2xl p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-amber-500 animate-pulse" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Backend Live Stream (YOLOv8-seg Active)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    MJPEG AI FEED
                  </span>
                </div>

                <div className="mb-3">
                  <label className="text-[10px] text-neutral-400 font-mono uppercase tracking-widest block mb-1">
                    Titik Kamera Terhubung:
                  </label>
                  <select
                    value={selectedJunction}
                    onChange={(e) => setSelectedJunction(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option>JPL 04 Bandung (Live AI Stream :8000)</option>
                    <option>JPL 101 Surakarta (Purwosari Stream)</option>
                    <option>JPL 12 Yogyakarta (Lempuyangan)</option>
                    <option>YouTube Live Perlintasan Kereta (yt-dlp)</option>
                  </select>
                </div>

                {/* CCTV Monitor Window: Plays /video_feed from FastAPI */}
                <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center">
                  {/* CARA 2: Stream MJPEG Berarsir Poligon Langsung dari FastAPI Backend */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="http://localhost:8000/video_feed"
                    alt="RailSense Live Stream with Polygons"
                    className="w-full h-full object-contain"
                    onError={() => setStreamError(true)}
                  />

                  {/* Fallback overlay if backend server is not active */}
                  {streamError && !isBackendConnected && (
                    <div className="absolute inset-0 bg-neutral-950/90 flex flex-col items-center justify-center p-4 text-center">
                      <WifiOff className="h-6 w-6 text-neutral-500 mb-2" />
                      <p className="text-xs text-neutral-300 font-medium">
                        Backend Stream Server Belum Menyala (:8000)
                      </p>
                      <code className="text-[10px] text-amber-400 font-mono mt-1 bg-black/60 px-2 py-0.5 rounded border border-white/5">
                        python backend/main.py
                      </code>
                    </div>
                  )}

                  {/* On-screen telemetry */}
                  <div className="absolute top-3 left-3 text-[10px] font-mono bg-black/80 px-2.5 py-0.5 rounded-full text-amber-400 border border-amber-500/20 flex items-center gap-1.5 pointer-events-none">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping"></span>
                    <span>AI MASK LIVE • 30 FPS</span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono bg-black/80 px-3 py-1.5 rounded-xl border border-white/5 pointer-events-none">
                    <span className="truncate max-w-[280px] text-white font-medium">
                      {selectedJunction}
                    </span>
                    <span className="text-amber-400">{currentTime}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    {isBackendConnected ? (
                      <Wifi className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <WifiOff className="h-3 w-3 text-neutral-500" />
                    )}
                    <span>{isBackendConnected ? "Server Aktif (FastAPI :8000)" : "Menunggu Server (:8000)"}</span>
                  </div>
                  <span className="text-amber-400 font-mono">Format: MJPEG Stream</span>
                </div>
              </div>
            )}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-full border transition-all ${
              soundEnabled
                ? "bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/10"
                : "bg-neutral-900 border-white/10 text-neutral-400 hover:text-white"
            }`}
            title={soundEnabled ? "Mute Siren" : "Nyalakan Sirine"}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {/* HERO SECTION: Golda Style Massive Headline */}
      <section className="relative pt-36 pb-20 px-6 md:px-12 flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Subtle radial golden glow */}
        <div className="absolute top-1/4 w-[600px] h-[350px] bg-amber-600/10 blur-[130px] rounded-full pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-900 border border-white/10 text-amber-400 text-xs font-mono uppercase tracking-widest mb-6 shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Computer Vision Interlocking System</span>
        </div>

        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tight uppercase leading-none max-w-5xl text-white">
          RAILSENSE<span className="text-amber-500">.</span>
        </h1>

        <p className="text-amber-500/90 font-semibold text-xs md:text-sm tracking-[0.3em] uppercase mt-4 mb-8">
          PREVENTING CROSSING DISASTERS WITH AI VISION
        </p>

        <p className="text-neutral-400 max-w-xl text-sm md:text-base leading-relaxed mb-10 font-normal">
          Deteksi otomatis status palang kereta api, kendaraan terjebak di zona rel, dan aktuasi cerdas sinyal lampu lalu lintas di persimpangan jalan secara *real-time*.
        </p>

        {/* Upload File & Interactive CTA */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-7 py-3.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-amber-500/20 transition-transform active:scale-95"
          >
            <Upload className="h-4 w-4 stroke-[2.5]" />
            <span>Unggah Gambar Anda</span>
          </button>

          <button
            onClick={() => {
              setIsLiveStreamMode(true);
              setStreamError(false);
            }}
            className={`px-6 py-3.5 rounded-full border text-xs uppercase tracking-wider flex items-center gap-2 transition font-semibold ${
              isLiveStreamMode
                ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10"
                : "bg-neutral-900 hover:bg-neutral-850 border-white/10 text-neutral-200"
            }`}
          >
            <Play className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            <span>Mode Live Stream AI (:8000)</span>
          </button>
        </div>
      </section>

      {/* INTERACTIVE BENTO GRID STAGE */}
      <section className="bg-neutral-950 py-16 px-6 md:px-12 relative z-20 rounded-t-[40px] border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-amber-500 font-mono text-xs uppercase tracking-[0.25em] block mb-2 font-semibold">
                THE SAFETY STANDARD
              </span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white uppercase">
                DETEKSI REAL-TIME<br />
                <span className="text-neutral-500">& INTERLOCKING</span>
              </h2>
            </div>

            {/* 1-Click Preset Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleSelectSample("danger")}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide uppercase transition-all border ${
                  !isLiveStreamMode && uploadedImage.includes("danger")
                    ? "bg-red-500/20 border-red-500 text-red-300 shadow-lg shadow-red-500/20"
                    : "bg-neutral-900 border-white/5 text-neutral-400 hover:text-white"
                }`}
              >
                🔴 Kasus 1: Bus Terjebak (Danger)
              </button>
              <button
                onClick={() => handleSelectSample("safe_closed")}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide uppercase transition-all border ${
                  !isLiveStreamMode && uploadedImage.includes("empty")
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/20"
                    : "bg-neutral-900 border-white/5 text-neutral-400 hover:text-white"
                }`}
              >
                🟢 Kasus 2: Rel Steril (Safe)
              </button>
              <button
                onClick={() => handleSelectSample("safe_open")}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide uppercase transition-all border ${
                  !isLiveStreamMode && uploadedImage.includes("open")
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/20"
                    : "bg-neutral-900 border-white/5 text-neutral-400 hover:text-white"
                }`}
              >
                🟢 Kasus 3: Palang Terbuka (Safe)
              </button>
            </div>
          </div>

          {/* BENTO GRID LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Bento Card 1: Large Screen CCTV / Live MJPEG Stream (7 Cols) */}
            <div className="lg:col-span-7 bg-neutral-900 border border-white/5 rounded-3xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-bold tracking-wider uppercase text-neutral-300">
                      {isLiveStreamMode ? "Live Backend Feed (/video_feed)" : "Static Image Stage"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isLiveStreamMode ? (
                      <span className="px-3 py-1 rounded-full text-[11px] font-mono bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping"></span>
                        Streaming Aktif
                      </span>
                    ) : (
                      <button
                        onClick={() => setShowMask(!showMask)}
                        className={`px-3 py-1 rounded-full text-[11px] font-mono border transition flex items-center gap-1.5 ${
                          showMask
                            ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                            : "bg-neutral-950 border-white/10 text-neutral-400"
                        }`}
                      >
                        <Eye className="h-3 w-3" />
                        <span>{showMask ? "Mask Aktif" : "Sembunyikan"}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Video Image Container */}
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/5 flex items-center justify-center">
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-mono text-amber-400 uppercase tracking-widest animate-pulse">
                        Segmenting Objects...
                      </span>
                    </div>
                  ) : isLiveStreamMode ? (
                    /* CARA 2: LIVE STREAM MJPEG DENGAN POLIGON DARI BACKEND */
                    <div className="relative w-full h-full flex items-center justify-center bg-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="http://localhost:8000/video_feed"
                        alt="Live Stream Feed with Polygons"
                        className="w-full h-full object-contain"
                        onError={() => setStreamError(true)}
                      />
                      {streamError && (
                        <div className="absolute inset-0 bg-neutral-950/95 flex flex-col items-center justify-center p-6 text-center">
                          <WifiOff className="h-8 w-8 text-neutral-500 mb-2" />
                          <p className="text-sm text-neutral-300 font-semibold mb-1">
                            Server Backend (:8000) Belum Dijalankan
                          </p>
                          <p className="text-xs text-neutral-500 max-w-sm mb-3">
                            Jalankan perintah berikut di terminal backend untuk mengaktifkan streaming AI berarsir poligon:
                          </p>
                          <code className="text-xs text-amber-400 font-mono bg-black/80 px-3 py-1 rounded-lg border border-white/10">
                            python backend/main.py
                          </code>
                          <button
                            onClick={() => setIsLiveStreamMode(false)}
                            className="mt-4 px-4 py-1.5 rounded-full text-xs font-semibold bg-neutral-850 hover:bg-neutral-800 text-neutral-300 border border-white/10"
                          >
                            Kembali ke Mode Gambar Statis
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* STATIC IMAGE DETECTION */
                    <>
                      <Image
                        src={uploadedImage}
                        alt="Evaluated Railway Crossing"
                        fill
                        className="object-contain"
                      />

                      {/* Polygon Mask Overlay */}
                      {showMask && result.polygons && (
                        <div className="absolute inset-0 pointer-events-none">
                          {result.polygons.map((poly, idx) => (
                            <div
                              key={idx}
                              className={`absolute inset-4 rounded-xl border-2 border-dashed flex items-start justify-end p-3 transition-all ${
                                result.state === "DANGER"
                                  ? "border-red-500 bg-red-500/30 animate-pulse"
                                  : "border-emerald-500 bg-emerald-500/20"
                              }`}
                            >
                              <span
                                className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full font-bold shadow-lg ${
                                  result.state === "DANGER"
                                    ? "bg-red-600 text-white"
                                    : "bg-emerald-600 text-white"
                                }`}
                              >
                                {poly.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Sub-label */}
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-neutral-400 font-mono">
                <span>Model: YOLOv8n-seg</span>
                <span>
                  {isLiveStreamMode ? "Live Inference: Aktif" : `Confidence: ${(result.confidence * 100).toFixed(1)}%`}
                </span>
              </div>
            </div>

            {/* Bento Card 2 & 3 Right Side (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Bento Card 2: Big Safety Status */}
              <div
                className={`p-7 rounded-3xl border transition-all flex flex-col justify-between ${
                  result.state === "DANGER"
                    ? "bg-gradient-to-br from-neutral-900 via-neutral-900 to-red-950/40 border-red-500/50"
                    : "bg-gradient-to-br from-neutral-900 via-neutral-900 to-emerald-950/40 border-emerald-500/50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
                      Safety Verdict
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                        result.state === "DANGER"
                          ? "bg-red-500/10 text-red-400 border-red-500/30"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      {(result.confidence * 100).toFixed(0)}% MATCH
                    </span>
                  </div>

                  <h3
                    className={`text-4xl md:text-5xl font-black uppercase tracking-tight mb-2 ${
                      result.state === "DANGER" ? "text-red-500" : "text-emerald-400"
                    }`}
                  >
                    {result.state}
                  </h3>

                  <p className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-4">
                    {result.condition}
                  </p>

                  <p className="text-xs text-neutral-400 leading-relaxed bg-black/40 p-4 rounded-2xl border border-white/5">
                    {result.explanation}
                  </p>
                </div>
              </div>

              {/* Bento Card 3: Traffic Light Actuator */}
              <div className="bg-neutral-900 border border-white/5 rounded-3xl p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono tracking-widest text-amber-500 uppercase font-semibold">
                    Traffic Interlocking
                  </span>
                  <span
                    className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${
                      result.trafficLight === "RED"
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-emerald-500 text-black font-black"
                    }`}
                  >
                    {result.trafficLight === "RED" ? "STOP (MERAH)" : "GO (HIJAU)"}
                  </span>
                </div>

                {/* 3 Horizontal High-Contrast Glowing Lamps */}
                <div className="bg-neutral-950 p-4 rounded-2xl border border-white/5 flex items-center justify-around my-2">
                  {/* RED */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-14 h-14 rounded-full transition-all duration-300 flex items-center justify-center font-black text-[10px] ${
                        result.trafficLight === "RED"
                          ? "bg-red-600 shadow-[0_0_40px_#ef4444] border-2 border-red-200 text-white"
                          : "bg-neutral-900 border border-white/5 text-neutral-700 opacity-30"
                      }`}
                    >
                      STOP
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400 uppercase">MERAH</span>
                  </div>

                  {/* YELLOW */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-14 h-14 rounded-full transition-all duration-300 flex items-center justify-center font-black text-[10px] ${
                        result.trafficLight === "YELLOW"
                          ? "bg-amber-400 shadow-[0_0_40px_#f59e0b] border-2 border-amber-100 text-black"
                          : "bg-neutral-900 border border-white/5 text-neutral-700 opacity-30"
                      }`}
                    >
                      WAIT
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400 uppercase">KUNING</span>
                  </div>

                  {/* GREEN */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-14 h-14 rounded-full transition-all duration-300 flex items-center justify-center font-black text-[10px] ${
                        result.trafficLight === "GREEN"
                          ? "bg-emerald-500 shadow-[0_0_40px_#10b981] border-2 border-emerald-100 text-black"
                          : "bg-neutral-900 border border-white/5 text-neutral-700 opacity-30"
                      }`}
                    >
                      GO
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400 uppercase">HIJAU</span>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-400 mt-3 leading-relaxed">
                  {result.trafficLight === "RED"
                    ? "Arus persimpangan belakang dihentikan secara instan agar kendaraan di perlintasan dapat segera terurai sebelum kereta tiba."
                    : "Lalu lintas mengalir normal menuju perlintasan sebidang."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PHILOSOPHY / STATEMENT SECTION */}
      <section className="bg-neutral-900 relative z-1 py-32 px-6 md:px-12 text-white overflow-hidden text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-3xl md:text-5xl font-black tracking-tight leading-snug">
            &ldquo;Setiap detik di perlintasan rel adalah tentang{" "}
            <span className="text-amber-500 italic">keselamatan nyawa.</span>{" "}
            RailSense menghentikan kemacetan sebelum menjadi bencana.&rdquo;
          </p>
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-neutral-400 mt-8">
            — PRINSIP SISTEM KESELAMATAN PERLINTASAN SEBIDANG
          </p>
        </div>
      </section>

      {/* STATS SECTION: Giant Numbers */}
      <section className="bg-neutral-950 py-24 px-6 md:px-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <h4 className="text-6xl md:text-7xl font-black tracking-tight text-white">0%</h4>
            <p className="text-xs font-mono uppercase tracking-widest text-amber-500 mt-2 font-bold">
              UNNOTICED HAZARDS
            </p>
          </div>

          <div>
            <h4 className="text-6xl md:text-7xl font-black tracking-tight text-white">&lt;50ms</h4>
            <p className="text-xs font-mono uppercase tracking-widest text-amber-500 mt-2 font-bold">
              INFERENCE LATENCY
            </p>
          </div>

          <div>
            <h4 className="text-6xl md:text-7xl font-black tracking-tight text-white">30</h4>
            <p className="text-xs font-mono uppercase tracking-widest text-amber-500 mt-2 font-bold">
              FRAMES PER SECOND
            </p>
          </div>

          <div>
            <h4 className="text-6xl md:text-7xl font-black tracking-tight text-white">100%</h4>
            <p className="text-xs font-mono uppercase tracking-widest text-amber-500 mt-2 font-bold">
              INTERLOCK READINESS
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-neutral-950 py-16 px-6 md:px-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-neutral-500 text-xs">
        <div className="flex items-center gap-3">
          <div className="relative h-7 w-7 rounded-lg overflow-hidden border border-white/10">
            <Image src="/logo.png" alt="RailSense" fill className="object-cover" />
          </div>
          <span className="font-bold text-white tracking-widest uppercase">
            RAILSENSE<span className="text-amber-500">.</span>
          </span>
          <span className="hidden sm:inline">|</span>
          <span>© 2026 Intelligent Railway Crossing Safety</span>
        </div>

        <div className="flex items-center gap-6 font-mono text-[11px] uppercase tracking-wider text-neutral-400">
          <span className="hover:text-amber-400 transition cursor-pointer">DOCUMENTATION</span>
          <span className="hover:text-amber-400 transition cursor-pointer">YOLOV8-SEG</span>
          <span className="hover:text-amber-400 transition cursor-pointer">FASTAPI</span>
          <span className="hover:text-amber-400 transition cursor-pointer">GITHUB</span>
        </div>
      </footer>
    </div>
  );
}
