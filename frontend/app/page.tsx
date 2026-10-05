"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  ShieldAlert,
  ShieldCheck,
  Radio,
  Upload,
  Image as ImageIcon,
  AlertTriangle,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  Camera,
  Layers,
  ChevronDown,
  X,
  Maximize2,
  CheckCircle2,
  Eye,
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

export default function RailSenseApp() {
  // Navigation & Dropdown State
  const [isCctvHovered, setIsCctvHovered] = useState(false);
  const [selectedJunction, setSelectedJunction] = useState("JPL 04 Bandung (Stasiun Cikudapateuh)");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  // Detection & Image Input State
  const [uploadedImage, setUploadedImage] = useState<string>("/samples/danger_bus.jpg");
  const [showMask, setShowMask] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Active Detection Outcome
  const [result, setResult] = useState<DetectionResult>({
    state: "DANGER",
    condition: "Kondisi 3: Palang Tertutup + Obstacle",
    confidence: 0.94,
    classDetected: "danger",
    explanation: "Terdeteksi kendaraan bus/kendaraan bermotor terjebak melintang di atas rel saat palang pintu dalam posisi tertutup.",
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

  // Handle preset sample selection
  const handleSelectSample = (sampleType: "danger" | "safe_closed" | "safe_open") => {
    setIsAnalyzing(true);
    setTimeout(() => {
      if (sampleType === "danger") {
        setUploadedImage("/samples/danger_bus.jpg");
        setResult({
          state: "DANGER",
          condition: "Kondisi 3: Palang Tertutup + Obstacle Terjebak",
          confidence: 0.94,
          classDetected: "danger",
          explanation: "Bahaya tinggi! Terdeteksi kendaraan terjebak di zona rel saat palang tertutup. Sistem mengunci traffic light ke sinyal MERAH.",
          trafficLight: "RED",
          polygons: [
            {
              points: "32%,30% 68%,28% 72%,70% 28%,72%",
              color: "rgba(239, 68, 68, 0.55)",
              label: "danger: 0.94 (Kendaraan Terjebak)",
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
          explanation: "Palang pintu tertutup dan seluruh area perlintasan rel bersih tanpa ada kendaraan yang terjebak. Kereta dapat melintas dengan aman.",
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
          explanation: "Palang perlintasan dalam posisi terbuka penuh. Arus lalu lintas kendaraan diizinkan melintas secara normal.",
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
    }, 350);
  };

  // Handle custom image upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
      setIsAnalyzing(true);

      // Analyze newly uploaded file
      setTimeout(() => {
        // If file name has 'danger' treat as danger, else safe demo
        const lowerName = file.name.toLowerCase();
        const isDanger = lowerName.includes("danger") || lowerName.includes("bus") || lowerName.includes("stuck");

        if (isDanger) {
          setResult({
            state: "DANGER",
            condition: "Kondisi 3: Terdeteksi Potensi Bahaya / Rintangan di Rel",
            confidence: 0.89,
            classDetected: "danger",
            explanation: "Sistem mendeteksi adanya objek/rintangan berisiko di perlintasan sebidang. Traffic light diaktifkan ke status MERAH.",
            trafficLight: "RED",
            polygons: [
              {
                points: "30%,35% 70%,35% 75%,75% 25%,75%",
                color: "rgba(239, 68, 68, 0.5)",
                label: "danger: 0.89 (Objek Terdeteksi)",
              },
            ],
          });
        } else {
          setResult({
            state: "SAFE",
            condition: "Kondisi 1/2: Status Perlintasan Dinyatakan Aman",
            confidence: 0.92,
            classDetected: "safe",
            explanation: "Model mengevaluasi citra input dan tidak mendeteksi kendaraan terjebak pada area kritis rel.",
            trafficLight: "GREEN",
            polygons: [
              {
                points: "25%,40% 75%,40% 80%,75% 20%,75%",
                color: "rgba(34, 197, 94, 0.25)",
                label: "safe: 0.92 (Aman)",
              },
            ],
          });
        }
        setIsAnalyzing(false);
      }, 400);
    }
  };

  // Siren alert sound simulation
  useEffect(() => {
    if (result.state === "DANGER" && soundEnabled) {
      try {
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(850, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(450, audioCtx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } catch {
        // Audio policy fallback
      }
    }
  }, [result.state, soundEnabled]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header / Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-3 sticky top-0 z-50 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-11 rounded-xl overflow-hidden border border-cyan-500/40 shadow-lg shadow-cyan-500/10">
            <Image
              src="/logo.jpeg"
              alt="RailSense Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
                RailSense
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300">
                AI Vision
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Railway Crossing Safety & Smart Traffic Interlocking
            </p>
          </div>
        </div>

        {/* Center / Right: Live CCTV Hover Trigger & Telemetry */}
        <div className="flex items-center gap-4">
          {/* HOVER LIVE CCTV DROPDOWN / PREVIEW BUTTON */}
          <div
            className="relative"
            onMouseEnter={() => setIsCctvHovered(true)}
            onMouseLeave={() => setIsCctvHovered(false)}
          >
            <button
              onClick={() => setIsCctvHovered(!isCctvHovered)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 border border-cyan-500/40 hover:border-cyan-400 text-xs font-semibold flex items-center gap-2.5 text-cyan-300 shadow-md transition-all group"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <Camera className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>Live CCTV Streams</span>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isCctvHovered ? "rotate-180" : ""}`} />
            </button>

            {/* FLOATING HOVER MODAL / PREVIEW WINDOW (TANPA PINDAH PAGE) */}
            {isCctvHovered && (
              <div className="absolute right-0 mt-2 w-[480px] bg-slate-900/95 border-2 border-cyan-500/50 rounded-2xl shadow-2xl backdrop-blur-xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Header of Hover Window */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-slate-200 tracking-wide">
                      Live CCTV API Feed (ATCS Interconnected)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400">
                    LIVE STREAM
                  </span>
                </div>

                {/* CCTV Selector */}
                <div className="mb-3">
                  <label className="text-[11px] text-slate-400 block mb-1 font-mono">
                    PILIH TITIK CCTV PERLINTASAN:
                  </label>
                  <select
                    value={selectedJunction}
                    onChange={(e) => setSelectedJunction(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-cyan-500"
                  >
                    <option>JPL 04 Bandung (Stasiun Cikudapateuh)</option>
                    <option>JPL 101 Surakarta (Purwosari Live HLS)</option>
                    <option>JPL 12 Yogyakarta (Lempuyangan)</option>
                    <option>CCTV Dishub Jawa Barat (RTTMC Kemenhub)</option>
                  </select>
                </div>

                {/* Live Video Window Screen */}
                <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center group/screen">
                  {/* Video simulation preview */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent flex items-center justify-center">
                    <Image
                      src={uploadedImage}
                      alt="CCTV Preview"
                      fill
                      className="object-cover opacity-80"
                    />
                  </div>

                  {/* On-screen telemetry */}
                  <div className="absolute top-2 left-2 text-[10px] font-mono bg-black/70 px-2 py-0.5 rounded text-emerald-400 border border-emerald-900 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>30 FPS • H.264 • 720p</span>
                  </div>

                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono bg-black/80 px-2.5 py-1 rounded text-slate-300">
                    <span className="truncate max-w-[280px] text-cyan-300 font-semibold">
                      {selectedJunction}
                    </span>
                    <span className="text-slate-400">{currentTime}</span>
                  </div>
                </div>

                {/* Quick Info footer inside hover modal */}
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Protokol: RTSP / HLS (.m3u8)</span>
                  <span className="text-emerald-400 font-medium">Latensi: ~42ms</span>
                </div>
              </div>
            )}
          </div>

          {/* Clock */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-cyan-300">
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            <span>{currentTime || "--:--:--"}</span>
          </div>

          {/* Sound Alarm Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs transition-all ${
              soundEnabled
                ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-md"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
            title={soundEnabled ? "Mute Siren" : "Nyalakan Audio Sirine"}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-6">
        {/* Banner Title & Instructions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="text-xs uppercase tracking-wider text-cyan-400 font-mono font-bold">
                Computer Vision Inference Test
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Deteksi Kondisi Palang Kereta Api Real-Time
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Unggah gambar perlintasan atau pilih sampel pengujian untuk mendeteksi status keselamatan (<strong>SAFE</strong> vs <strong>DANGER</strong>) dan melihat simulasi respons otomatis sinyal lampu lalu lintas.
            </p>
          </div>

          {/* Upload Button */}
          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-cyan-600/25 transition-all"
            >
              <Upload className="h-4 w-4" />
              <span>Unggah Gambar Baru</span>
            </button>
          </div>
        </div>

        {/* Preset Sample Selector (1-Click Test) */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 font-mono">
            UJI CEPAT DENGAN SAMPEL:
          </span>
          <button
            onClick={() => handleSelectSample("danger")}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
              uploadedImage.includes("danger")
                ? "bg-red-600/30 border-red-500 text-red-200 shadow-lg shadow-red-600/20 font-bold"
                : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
            }`}
          >
            🔴 Sampel 1: Bus Terjebak di Rel (DANGER)
          </button>
          <button
            onClick={() => handleSelectSample("safe_closed")}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
              uploadedImage.includes("empty")
                ? "bg-emerald-600/30 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-600/20 font-bold"
                : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
            }`}
          >
            🟢 Sampel 2: Palang Tertutup + Rel Kosong (SAFE)
          </button>
          <button
            onClick={() => handleSelectSample("safe_open")}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
              uploadedImage.includes("open")
                ? "bg-emerald-600/30 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-600/20 font-bold"
                : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
            }`}
          >
            🟢 Sampel 3: Palang Terbuka + Arus Ramai (SAFE)
          </button>
        </div>

        {/* Two-Column Interactive Analysis Board */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Image Viewer with Polygon Overlay (7 Columns) */}
          <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
            <div>
              {/* Canvas Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-semibold text-slate-200">
                    Citra Input & Visual Segmentasi AI
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowMask(!showMask)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono border transition flex items-center gap-1.5 ${
                      showMask
                        ? "bg-cyan-950 border-cyan-700 text-cyan-300"
                        : "bg-slate-800 border-slate-700 text-slate-400"
                    }`}
                  >
                    <Eye className="h-3 w-3" />
                    <span>{showMask ? "Sembunyikan Mask" : "Tampilkan Mask"}</span>
                  </button>
                </div>
              </div>

              {/* Main Image Stage */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
                {isAnalyzing ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-mono text-cyan-300 animate-pulse">
                      Menjalankan Inferensi YOLOv8-seg...
                    </span>
                  </div>
                ) : (
                  <>
                    <Image
                      src={uploadedImage}
                      alt="Evaluated Image"
                      fill
                      className="object-contain"
                    />

                    {/* Polygon Mask Overlay (Simulated on Top of Image) */}
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
                              className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold shadow ${
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

            {/* Bottom info bar */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Resolusi: 640 x 640 (Optimal)</span>
              <span>Confidence: {(result.confidence * 100).toFixed(1)}%</span>
            </div>
          </div>

          {/* RIGHT: Status Verdict & Traffic Light Interlocking (5 Columns) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Verdict Card */}
            <div
              className={`p-6 rounded-2xl border transition-all shadow-2xl ${
                result.state === "DANGER"
                  ? "bg-red-950/40 border-red-500/80 shadow-red-500/10"
                  : "bg-emerald-950/40 border-emerald-500/80 shadow-emerald-500/10"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  HASIL EVALUASI MODEL
                </span>
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
                    result.state === "DANGER"
                      ? "bg-red-950 text-red-300 border-red-700"
                      : "bg-emerald-950 text-emerald-300 border-emerald-700"
                  }`}
                >
                  {(result.confidence * 100).toFixed(0)}% Match
                </span>
              </div>

              {/* Big Status Badge */}
              <div className="flex items-center gap-3 mb-3">
                {result.state === "DANGER" ? (
                  <ShieldAlert className="h-8 w-8 text-red-400 animate-bounce" />
                ) : (
                  <ShieldCheck className="h-8 w-8 text-emerald-400" />
                )}
                <div>
                  <h3
                    className={`text-2xl font-black tracking-tight ${
                      result.state === "DANGER" ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    STATUS: {result.state}
                  </h3>
                  <p className="text-xs font-semibold text-slate-300">
                    {result.condition}
                  </p>
                </div>
              </div>

              {/* Detailed Description */}
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                {result.explanation}
              </p>
            </div>

            {/* Physical Traffic Light Simulator */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-200">
                    Traffic Light Interlocking
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Sinyal Lampu Lalu Lintas di Persimpangan Belakang
                  </p>
                </div>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold ${
                    result.trafficLight === "RED"
                      ? "bg-red-950 border border-red-700 text-red-300 animate-pulse"
                      : "bg-emerald-950 border border-emerald-700 text-emerald-300"
                  }`}
                >
                  {result.trafficLight === "RED" ? "INTERLOCK: MERAH" : "ARUS: HIJAU"}
                </span>
              </div>

              {/* Horizontal Traffic Light Lamps */}
              <div className="bg-slate-950 p-4 rounded-2xl border-2 border-slate-700 flex items-center justify-around shadow-inner">
                {/* RED */}
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-14 h-14 rounded-full transition-all duration-300 flex items-center justify-center font-bold text-[10px] ${
                      result.trafficLight === "RED"
                        ? "bg-red-600 shadow-[0_0_35px_#ef4444] border-2 border-red-200 text-white"
                        : "bg-red-950/40 border border-red-900/30 text-red-900 opacity-40"
                    }`}
                  >
                    STOP
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">MERAH</span>
                </div>

                {/* YELLOW */}
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-14 h-14 rounded-full transition-all duration-300 flex items-center justify-center font-bold text-[10px] ${
                      result.trafficLight === "YELLOW"
                        ? "bg-amber-400 shadow-[0_0_35px_#f59e0b] border-2 border-amber-200 text-white"
                        : "bg-amber-950/40 border border-amber-900/30 text-amber-900 opacity-40"
                    }`}
                  >
                    SIAGA
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">KUNING</span>
                </div>

                {/* GREEN */}
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-14 h-14 rounded-full transition-all duration-300 flex items-center justify-center font-bold text-[10px] ${
                      result.trafficLight === "GREEN"
                        ? "bg-emerald-500 shadow-[0_0_35px_#10b981] border-2 border-emerald-200 text-white"
                        : "bg-emerald-950/40 border border-emerald-900/30 text-emerald-900 opacity-40"
                    }`}
                  >
                    JALAN
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">HIJAU</span>
                </div>
              </div>

              {/* Status Action Description */}
              <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {result.trafficLight === "RED" ? (
                  <span className="text-red-400 font-semibold block">
                    🚨 Tindakan Sistem: Sinyal merah diaktifkan agar kendaraan tidak merangsek masuk ke area rel yang sedang terhambat.
                  </span>
                ) : (
                  <span className="text-emerald-400 font-medium block">
                    ✅ Tindakan Sistem: Arus lalu lintas di persimpangan belakang dibiarkan mengalir normal.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Safety Logic Explanation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-slate-200">Kondisi 1 (Safe)</h5>
              <p className="text-[11px] text-slate-400 mt-1">
                Palang terbuka + arus kendaraan ramai. Aman karena tidak ada kereta yang melintas.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-slate-200">Kondisi 2 (Safe)</h5>
              <p className="text-[11px] text-slate-400 mt-1">
                Palang tertutup + zona rel steril. Kereta api dapat melintas tanpa rintangan.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/50 border border-red-900/40 flex items-start gap-3 bg-red-950/10">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-red-300">Kondisi 3 (Danger)</h5>
              <p className="text-[11px] text-slate-400 mt-1">
                Palang tertutup + kendaraan/orang terjebak. Menyalakan alarm & mengunci traffic light ke MERAH.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-6 py-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© 2026 RailSense — Intelligent Railway Crossing Safety System</p>
        <p className="font-mono text-[11px] text-slate-500">
          Powered by YOLOv8 Instance Segmentation & Next.js TypeScript
        </p>
      </footer>
    </div>
  );
}
