import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cpu, Activity, Clock, ShieldAlert, Zap, Globe, Send } from "lucide-react";
import { SystemState } from "../types";

interface TelemetryPanelProps {
  telemetry: SystemState | null;
  onUpdateState: (newState: Partial<SystemState>) => Promise<void>;
  onTriggerTranslationalAchievement: (source: string, payload: any) => Promise<void>;
}

export default function TelemetryPanel({
  telemetry,
  onUpdateState,
  onTriggerTranslationalAchievement
}: TelemetryPanelProps) {
  const [nodeId, setNodeId] = React.useState("ESP32_01");
  const [frequency, setFrequency] = React.useState(1.618);
  const [vessels, setVessels] = React.useState(1088);
  const [statusVal, setStatusVal] = React.useState("online");
  const [transmitting, setTransmitting] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  // Auto-calculated seconds since last pulse
  const [secondsAgo, setSecondsAgo] = React.useState<number>(0);

  React.useEffect(() => {
    if (!telemetry?.last_pulse) return;
    const interval = setInterval(() => {
      const diff = Math.floor(Date.now() / 1000) - telemetry.last_pulse;
      setSecondsAgo(diff >= 0 ? diff : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [telemetry?.last_pulse]);

  const handleTransmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransmitting(true);
    try {
      // 1. Send the telemetry state to /api/state/pulse
      await onUpdateState({
        node_id: nodeId,
        frequency_hz: frequency,
        active_vessels: vessels,
        status: statusVal,
      });

      // Show toast
      setToast("Telemetry pulse transmitted!");
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setTransmitting(false);
    }
  };

  const handleTranslateAndArchive = async () => {
    setTransmitting(true);
    try {
      // Send hardware telemetry event to translated Chronicler
      const payload = {
        node_id: nodeId,
        frequency_hz: frequency,
        active_vessels: vessels,
      };
      await onTriggerTranslationalAchievement("hardware", payload);
      setToast("Transmitted pulse, translated & archived to milestones!");
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error("Failed to translate the hardware milestone", err);
    } finally {
      setTransmitting(false);
    }
  };

  return (
    <div className="bg-cosmic-surface border border-cosmic-border rounded-xl p-6 glow-active overflow-hidden relative">
      <div className="absolute top-0 right-0 h-40 w-40 bg-blue-500/5 blur-[50px] rounded-full pointers-none" />

      {/* Decorative Matrix Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none opacity-20" />

      <div className="relative">
        {/* Title */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-blue-400" />
            <span className="font-semibold text-sm tracking-wide uppercase text-zinc-100 font-mono">
              Telemetric Matrix (system_state)
            </span>
          </div>
          <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono tracking-widest font-bold border uppercase transition-all ${
            telemetry?.status === "online" 
              ? "bg-green-950/40 border-green-800 text-green-400" 
              : "bg-red-950/40 border-red-800 text-red-400"
          }`}>
            ● {telemetry?.status || "offline"}
          </span>
        </div>

        {/* Real-time Display Grid representing the active Atlas document */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-zinc-950/80 border border-zinc-900/60 font-mono mb-6">
          
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase">SYS_NODE_ID</span>
            <span className="text-sm font-semibold text-zinc-200 mt-1 flex items-center gap-1">
              <span className="h-1.5 w-1.5 bg-blue-500 rounded-full" />
              {telemetry?.node_id || "N/A"}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase">FREQUENCY_HZ</span>
            <span className="text-sm font-semibold text-zinc-200 mt-1 flex items-center gap-1">
              <Activity className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
              {telemetry?.frequency_hz ? telemetry.frequency_hz.toFixed(3) : "1.618"} Hz
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase">ACTIVE_VESSELS</span>
            <span className="text-sm font-semibold text-zinc-200 mt-1 flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              {telemetry?.active_vessels?.toLocaleString() || "1,088"}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase">LAST_HEARTBEAT</span>
            <span className="text-sm font-semibold text-blue-400 mt-1 flex items-center gap-1" title={telemetry?.last_pulse ? new Date(telemetry.last_pulse * 1000).toLocaleString() : undefined}>
              <Clock className="h-3.5 w-3.5" />
              {secondsAgo}s ago
            </span>
          </div>

        </div>

        {/* Live dynamic pulse visualizer */}
        <div className="border border-zinc-900 bg-black/40 h-10 rounded-lg flex items-center justify-center overflow-hidden mb-6 relative px-4">
          <div className="absolute inset-x-0 bottom-0 top-1/2 border-t border-zinc-900/50 pointer-events-none" />
          <svg className="w-full h-8 overflow-visible opacity-50 text-blue-500/60" viewBox="0 0 400 30" preserveAspectRatio="none">
            <path
              d="M0 15 H50 L55 5 L60 25 L65 15 H120 L125 0 L130 30 L135 15 H210 L213 10 L216 20 L219 15 H290 L293 8 L296 22 L299 15 H350 L355 5 L360 25 L365 15 H400"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="animate-dash"
              style={{
                strokeDasharray: "1000",
                animation: `dash 12s linear infinite`
              }}
            />
          </svg>
          <span className="absolute text-[10px] font-mono text-zinc-500 tracking-[0.2em] uppercase">
            ACTIVE HARDWARE INTEGRATION (ESP32 / MQTT CHANNEL)
          </span>
        </div>

        {/* Interactive ESP32 Telemetry Transmitter Hardware Simulation */}
        <div className="border-t border-zinc-900 pt-5">
          <h4 className="text-xs font-semibold text-zinc-400 uppercase font-mono tracking-widest mb-3 flex items-center gap-1">
            <Globe className="h-3.5 w-3.5 text-zinc-500" />
            ESP32 / Telemetry Pulse Simulator
          </h4>

          <form onSubmit={handleTransmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              
              {/* Node selection */}
              <div>
                <label className="block text-[10.5px] font-mono text-zinc-500 mb-1 uppercase">Node Identifier</label>
                <select
                  value={nodeId}
                  onChange={(e) => setNodeId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 font-mono focus:border-blue-500 focus:outline-none"
                >
                  <option value="ESP32_01">ESP32_NODE_01</option>
                  <option value="ESP32_02">ESP32_NODE_02</option>
                  <option value="ESP32_PROD">ESP32_CORE_PROD</option>
                  <option value="NEPHILIM_01">NEPHILIM_NODE_ALPHA</option>
                </select>
              </div>

              {/* Status Select */}
              <div>
                <label className="block text-[10.5px] font-mono text-zinc-500 mb-1 uppercase">Node Health Status</label>
                <select
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 font-mono focus:border-blue-500 focus:outline-none"
                >
                  <option value="online">Online / Synchronized</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="offline">Offline / Degraded</option>
                </select>
              </div>

              {/* Pulse Frequency Slider */}
              <div>
                <label className="block text-[10.5px] font-mono text-zinc-500 mb-1 uppercase flex justify-between">
                  <span>Delta Resonance</span>
                  <span className="text-blue-400 font-bold">{frequency.toFixed(3)} Hz</span>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="5.0"
                  step="0.05"
                  value={frequency}
                  onChange={(e) => setFrequency(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 bg-zinc-900 h-1 rounded-full cursor-pointer mt-3"
                />
              </div>

              {/* Vessels Active Selector */}
              <div>
                <label className="block text-[10.5px] font-mono text-zinc-500 mb-1 uppercase flex justify-between">
                  <span>Active Vessels</span>
                  <span className="text-amber-400 font-bold">{vessels}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="2048"
                  step="16"
                  value={vessels}
                  onChange={(e) => setVessels(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-zinc-900 h-1 rounded-full cursor-pointer mt-3"
                />
              </div>

            </div>

            {/* Simulated Transmission Actions */}
            <div className="flex flex-col sm:flex-row gap-2 mt-2 pt-2 border-t border-zinc-900/60 justify-end">
              <button
                type="submit"
                disabled={transmitting}
                className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-xs font-mono font-medium text-zinc-300 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Activity className="h-3.5 w-3.5 text-zinc-400" />
                Transmit Pulse Only
              </button>

              <button
                type="button"
                disabled={transmitting}
                onClick={handleTranslateAndArchive}
                className="px-4 py-2 rounded-lg bg-blue-950/30 border border-blue-900 text-blue-400 hover:bg-blue-900/30 hover:text-white text-xs font-mono font-medium transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                Transmit, Translate & Archive Milestone
              </button>
            </div>
          </form>
        </div>

        {/* Status Prompt Feed Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute bottom-16 right-0 bg-blue-950/60 border border-blue-800 text-blue-200 text-xs py-2 px-4 rounded-lg font-mono flex items-center gap-2 shadow-2xl backdrop-blur-md"
            >
              <div className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -1000;
          }
        }
        .animate-dash {
          animation: dash 15s linear infinite;
        }
      `}</style>
    </div>
  );
}
