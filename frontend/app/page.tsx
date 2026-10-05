"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Radio,
  Train,
  AlertTriangle,
  Cpu,
  Volume2,
  VolumeX,
  RefreshCw,
  ExternalLink,
  Clock,
  Layers,
  Sparkles,
} from "lucide-react";

type SystemState = "SAFE" | "DANGER" | "STANDBY";

interface LogEntry {
  id: string;
  time: string;
  state: SystemState;
  message: string;
  action: string;
}

export default function Dashboard() {
  const [systemState, setSystemState] = useState<SystemState>("SAFE");
  const [trafficSignal, setTrafficSignal] = useState<"GREEN" | "YELLOW" | "RED">("GREEN");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string>("safe_open");
  const [connectedBackend, setConnectedBackend] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "1",
      time: "10:14:02",
      state: "SAFE",
      message: "Palang terbuka normal, arus lalu lintas lancar",
      action: "Traffic Light: HIJAU (Normal)",
    },
    {
      id: "2",
      time: "10:15:30",
      state: "SAFE",
      message: "Palang tertutup, zona rel steril dari hambatan",
      action: "Traffic Light: HIJAU (Rel Aman)",
    },
  ]);

  // Update clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("id-ID", { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle scenario changes
  const applyScenario = (scenario: string) => {
    setActiveScenario(scenario);
    const timeStr = new Date().toLocaleTimeString("id-ID", { hour12: false });

    if (scenario === "danger_trapped") {
      setSystemState("DANGER");
      setTrafficSignal("YELLOW");
      setTimeout(() => setTrafficSignal("RED"), 800);

      const newLog: LogEntry = {
        id: Date.now().toString(),
        time: timeStr,
        state: "DANGER",
        message: "KENDARAAN TERJEBAK DI REL! Palang tertutup + Obstacle",
        action: "INTERLOCK: Traffic Light MERAH (Stop Arus Belakang)",
      };
      setLogs((prev) => [newLog, ...prev.slice(0, 7)]);
    } else if (scenario === "safe_closed_empty") {
      setSystemState("SAFE");
      setTrafficSignal("GREEN");

      const newLog: LogEntry = {
        id: Date.now().toString(),
        time: timeStr,
        state: "SAFE",
        message: "Palang tertutup, tidak ada kendaraan di atas rel (Steril)",
        action: "Traffic Light: HIJAU (Kereta akan melintas aman)",
      };
      setLogs((prev) => [newLog, ...prev.slice(0, 7)]);
    } else {
      setSystemState("SAFE");
      setTrafficSignal("GREEN");

      const newLog: LogEntry = {
        id: Date.now().toString(),
        time: timeStr,
        state: "SAFE",
        message: "Palang terbuka, keramaian kendaraan diizinkan melintas",
        action: "Traffic Light: HIJAU (Arus Normal)",
      };
      setLogs((prev) => [newLog, ...prev.slice(0, 7)]);
    }
  };

  // Sound beep simulation when danger occurs
  useEffect(() => {
    if (systemState === "DANGER" && soundEnabled) {
      try {
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch {
        // AudioContext policy fallback
      }
    }
  }, [systemState, soundEnabled]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md px-6 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Train className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                RailSense
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800/80 text-cyan-300 font-mono">
                v1.0-segmentation
              </span>
            </div>
            <p className="text-xs text-slate-400">
              AI Railway Crossing & Traffic Light Interlocking System
            </p>
          </div>
        </div>

        {/* Telemetry Quick Badges */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
            <Cpu className="h-4 w-4 text-emerald-400" />
            <span className="text-slate-300">GPU:</span>
            <span className="text-emerald-400 font-semibold">RTX 2050 (CUDA)</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
            <Layers className="h-4 w-4 text-indigo-400" />
            <span className="text-slate-300">Model:</span>
            <span className="text-indigo-400 font-semibold">YOLOv8n-seg</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
            <Clock className="h-4 w-4 text-cyan-400" />
            <span className="text-cyan-300 font-semibold">{currentTime || "--:--:--"}</span>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border transition-all ${
              soundEnabled
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
            }`}
            title={soundEnabled ? "Mute Siren" : "Enable Siren Audio"}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Danger Banner if Active */}
      {systemState === "DANGER" && (
        <div className="bg-red-600 text-white px-6 py-2.5 flex items-center justify-between font-semibold text-sm danger-glow">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 animate-bounce" />
            <span>
              [DARURAT] KENDARAAN TERJEBAK DI REL! Traffic Light Belakang Otomatis Diubah Menjadi MERAH!
            </span>
          </div>
          <span className="text-xs bg-red-950/70 border border-red-300/40 px-2 py-0.5 rounded font-mono">
            INTERLOCK ACTUATED
          </span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        {/* Left Column: Live Feed & Detection View (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md overflow-hidden shadow-2xl">
            {/* Monitor Header */}
            <div className="px-5 py-3 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-sm font-semibold tracking-wide text-slate-200">
                  CCTV Live Feed — JPL Perlintasan Sebidang #04
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  30 FPS • 640x640
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-800/60">
                  Polygon Mask ON
                </span>
              </div>
            </div>

            {/* Video / Visual Simulation Canvas */}
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              {/* Overlay Video Representation */}
              <div
                className={`absolute inset-0 bg-cover bg-center transition-all duration-500 ${
                  activeScenario === "danger_trapped"
                    ? "opacity-90 contrast-125"
                    : "opacity-80"
                }`}
                style={{
                  backgroundImage: `radial-gradient(ellipse at center, rgba(15, 23, 42, 0.4) 0%, rgba(2, 6, 23, 0.9) 100%)`,
                }}
              >
                {/* SVG Visual Mask Overlay Simulator */}
                <svg className="w-full h-full pointer-events-none" viewBox="0 0 800 450">
                  {/* Railway Tracks */}
                  <line x1="100" y1="280" x2="700" y2="280" stroke="#475569" strokeWidth="6" strokeDasharray="12 12" />
                  <line x1="100" y1="310" x2="700" y2="310" stroke="#475569" strokeWidth="6" strokeDasharray="12 12" />

                  {/* Railroad Gate Left & Right */}
                  {activeScenario === "danger_trapped" || activeScenario === "safe_closed_empty" ? (
                    <>
                      {/* Gate Closed Position */}
                      <line x1="180" y1="260" x2="380" y2="260" stroke="#ef4444" strokeWidth="8" strokeDasharray="20 10" />
                      <line x1="420" y1="260" x2="620" y2="260" stroke="#ef4444" strokeWidth="8" strokeDasharray="20 10" />
                      <text x="390" y="245" fill="#f87171" fontSize="12" fontWeight="bold" textAnchor="middle">
                        [Palang Tertutup]
                      </text>
                    </>
                  ) : (
                    <>
                      {/* Gate Open Position */}
                      <line x1="180" y1="260" x2="220" y2="170" stroke="#22c55e" strokeWidth="8" strokeDasharray="20 10" />
                      <line x1="620" y1="260" x2="580" y2="170" stroke="#22c55e" strokeWidth="8" strokeDasharray="20 10" />
                      <text x="210" y="160" fill="#4ade80" fontSize="12" fontWeight="bold">
                        [Palang Terbuka]
                      </text>
                    </>
                  )}

                  {/* Danger Obstacle Mask (Trapped Bus/Car) */}
                  {activeScenario === "danger_trapped" && (
                    <g className="animate-pulse">
                      {/* Semi-transparent Polygon Mask */}
                      <polygon
                        points="320,230 480,230 490,320 310,320"
                        fill="rgba(239, 68, 68, 0.45)"
                        stroke="#ef4444"
                        strokeWidth="3"
                        strokeDasharray="4 2"
                      />
                      <rect x="330" y="200" width="140" height="24" rx="4" fill="rgba(239, 68, 68, 0.9)" />
                      <text x="400" y="216" fill="white" fontSize="11" fontWeight="bold" textAnchor="middle">
                        danger: 0.94 (Kendaraan)
                      </text>
                    </g>
                  )}

                  {/* Safe Mask (Clear Area) */}
                  {activeScenario !== "danger_trapped" && (
                    <g>
                      <polygon
                        points="260,250 540,250 560,330 240,330"
                        fill="rgba(34, 197, 94, 0.15)"
                        stroke="#22c55e"
                        strokeWidth="2"
                      />
                      <rect x="350" y="275" width="100" height="22" rx="4" fill="rgba(34, 197, 94, 0.8)" />
                      <text x="400" y="290" fill="white" fontSize="11" fontWeight="bold" textAnchor="middle">
                        safe: 0.92
                      </text>
                    </g>
                  )}
                </svg>
              </div>

              {/* Status Pill in Video Corner */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <div
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg backdrop-blur-md ${
                    systemState === "DANGER"
                      ? "bg-red-500/20 border-red-500 text-red-300"
                      : "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                  }`}
                >
                  {systemState === "DANGER" ? (
                    <>
                      <ShieldAlert className="h-4 w-4 animate-spin text-red-400" />
                      Status: DANGER (Bahaya)
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      Status: SAFE (Aman)
                    </>
                  )}
                </div>
              </div>

              {/* Watermark / Coordinates */}
              <div className="absolute bottom-4 right-4 text-[11px] font-mono text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded border border-slate-800">
                LAT: -6.9147° S • LON: 107.6098° E (Bandung)
              </div>
            </div>

            {/* Scenario Control Panel (Interactive Demo) */}
            <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span>Simulasi Skenario Lapangan:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => applyScenario("safe_open")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    activeScenario === "safe_open"
                      ? "bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/30"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  🟢 1. Palang Terbuka + Arus Ramai (SAFE)
                </button>

                <button
                  onClick={() => applyScenario("safe_closed_empty")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    activeScenario === "safe_closed_empty"
                      ? "bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/30"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  🟢 2. Palang Tertutup + Rel Bersih (SAFE)
                </button>

                <button
                  onClick={() => applyScenario("danger_trapped")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    activeScenario === "danger_trapped"
                      ? "bg-red-600 border-red-400 text-white shadow-lg shadow-red-600/40 animate-pulse"
                      : "bg-red-950/40 border-red-800/80 text-red-300 hover:bg-red-900/60"
                  }`}
                >
                  🔴 3. Palang Tertutup + Kendaraan Terjebak (DANGER)
                </button>
              </div>
            </div>
          </div>

          {/* Incident Event Log */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-semibold tracking-wide text-slate-200">
                  Live Incident & Decision Audit Log
                </h3>
              </div>
              <button
                onClick={() => applyScenario(activeScenario)}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
              >
                <RefreshCw className="h-3 w-3" /> Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono">
                    <th className="pb-2.5 font-medium">WAKTU</th>
                    <th className="pb-2.5 font-medium">STATUS AI</th>
                    <th className="pb-2.5 font-medium">DESKRIPSI DETEKSI</th>
                    <th className="pb-2.5 font-medium">RESPONS INTERLOCK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/20 transition font-mono">
                      <td className="py-2.5 text-slate-400">{log.time}</td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.state === "DANGER"
                              ? "bg-red-950 border border-red-700 text-red-300"
                              : "bg-emerald-950 border border-emerald-700 text-emerald-300"
                          }`}
                        >
                          {log.state}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-200 font-sans">{log.message}</td>
                      <td className="py-2.5 font-sans">
                        <span
                          className={
                            log.state === "DANGER"
                              ? "text-red-400 font-semibold"
                              : "text-emerald-400"
                          }
                        >
                          {log.action}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Physical Traffic Light Interlocking Simulator (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Traffic Light Physical Box */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-6 shadow-2xl flex flex-col items-center">
            <h3 className="text-sm font-semibold text-slate-200 tracking-wide mb-1 text-center">
              Traffic Light Interlocking Actuator
            </h3>
            <p className="text-xs text-slate-400 mb-6 text-center">
              Sinyal Lampu Lalu Lintas di Persimpangan Belakang Perlintasan
            </p>

            {/* Traffic Light Hardware Case */}
            <div className="w-32 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 rounded-3xl border-4 border-slate-700 shadow-2xl flex flex-col items-center gap-4 relative">
              {/* Sun visor hoods on lamps */}
              {/* RED LIGHT */}
              <div className="relative">
                <div
                  className={`w-20 h-20 rounded-full transition-all duration-300 flex items-center justify-center ${
                    trafficSignal === "RED"
                      ? "bg-red-600 shadow-[0_0_45px_#ef4444] border-2 border-red-300"
                      : "bg-red-950/40 border border-red-900/40 opacity-40"
                  }`}
                >
                  <span className="text-[10px] font-bold text-red-100 opacity-60">STOP</span>
                </div>
              </div>

              {/* YELLOW LIGHT */}
              <div className="relative">
                <div
                  className={`w-20 h-20 rounded-full transition-all duration-300 flex items-center justify-center ${
                    trafficSignal === "YELLOW"
                      ? "bg-amber-400 shadow-[0_0_45px_#f59e0b] border-2 border-amber-200"
                      : "bg-amber-950/40 border border-amber-900/40 opacity-40"
                  }`}
                >
                  <span className="text-[10px] font-bold text-amber-100 opacity-60">SIAGA</span>
                </div>
              </div>

              {/* GREEN LIGHT */}
              <div className="relative">
                <div
                  className={`w-20 h-20 rounded-full transition-all duration-300 flex items-center justify-center ${
                    trafficSignal === "GREEN"
                      ? "bg-emerald-500 shadow-[0_0_45px_#10b981] border-2 border-emerald-200"
                      : "bg-emerald-950/40 border border-emerald-900/40 opacity-40"
                  }`}
                >
                  <span className="text-[10px] font-bold text-emerald-100 opacity-60">JALAN</span>
                </div>
              </div>
            </div>

            {/* Actuator Status Card */}
            <div className="w-full mt-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1 font-mono">
                Status Sinyal Fisik:
              </span>
              <span
                className={`text-lg font-black tracking-wide block ${
                  trafficSignal === "RED"
                    ? "text-red-500 animate-pulse"
                    : trafficSignal === "YELLOW"
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              >
                {trafficSignal === "RED"
                  ? "MERAH (ARUS DIHENTIKAN)"
                  : trafficSignal === "YELLOW"
                  ? "KUNING (PERSIAPAN STOP)"
                  : "HIJAU (LALU LINTAS LANCAR)"}
              </span>
              <p className="text-[11px] text-slate-400 mt-2">
                {trafficSignal === "RED"
                  ? "Mencegah antrean kendaraan terus masuk dan terjebak di rel kereta api."
                  : "Arus lalu lintas menuju perlintasan sebidang dinyatakan aman."}
              </p>
            </div>
          </div>

          {/* Backend Connection Setup Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-xl">
            <h4 className="text-xs font-semibold text-slate-300 tracking-wider uppercase font-mono mb-2 flex items-center gap-2">
              <Radio className="h-4 w-4 text-cyan-400" />
              Integrasi Backend FastAPI
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Dashboard ini siap menerima stream inference real-time dari model <code className="text-cyan-300">best.pt</code> melalui WebSocket backend.
            </p>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-1 mb-4">
              <div className="text-slate-400 text-[10px]">WebSocket URL:</div>
              <div className="text-cyan-400 select-all">ws://localhost:8000/ws/crossing-status</div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Status Koneksi:</span>
              <span className="text-amber-400 font-medium flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping"></span>
                Menunggu Server (:8000)
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 px-6 py-4 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© 2026 RailSense — Intelligent Railway Crossing Safety System</p>
        <p className="font-mono text-[11px] text-slate-400">
          Powered by YOLOv8n-seg & Next.js TypeScript
        </p>
      </footer>
    </div>
  );
}
