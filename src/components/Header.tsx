import React from "react";
import { Cpu, Database, Sparkles, Wifi, RefreshCw } from "lucide-react";
import { BackendStatus } from "../types";

interface HeaderProps {
  status: BackendStatus | null;
  loading: boolean;
  onRefresh: () => void;
  onResetDatabase: () => void;
}

export default function Header({ status, loading, onRefresh, onResetDatabase }: HeaderProps) {
  const [utcTime, setUtcTime] = React.useState<string>(new Date().toUTCString());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setUtcTime(new Date().toUTCString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="border-b border-cosmic-border bg-black/60 backdrop-blur-md px-6 py-5 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Branding & Architecture Name */}
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
            <h1 className="text-xs uppercase tracking-[0.3em] text-zinc-400 font-mono font-bold">
              Archival Stream Node // System Alpha
            </h1>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-white mt-1 bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Project Emergence Portfolio
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-mono">
            Autogenous Chronicle Stream & Telemetry Bridge
          </p>
        </div>

        {/* Dynamic Clocks and Metadata */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Database Engine Status */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono transition-colors ${
              status?.database_connected 
                ? "bg-green-950/40 border-green-800 text-green-400" 
                : "bg-amber-950/40 border-amber-800 text-amber-400"
            }`}>
              <Database className="h-3.5 w-3.5" />
              <span>
                {status?.database_connected ? "DB: ATLAS CONNECTED" : "DB: LOCAL FALLBACK"}
              </span>
            </div>

            {/* Neural Translator Key Status */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono transition-colors ${
              status?.gemini_key_configured 
                ? "bg-blue-950/40 border-blue-800 text-blue-400" 
                : "bg-zinc-900 border-zinc-800 text-zinc-400"
            }`}>
              <Sparkles className="h-3.5 w-3.5" />
              <span>
                {status?.gemini_key_configured ? "CHRONICLER: ACTIVE" : "CHRONICLER: OFFLINE"}
              </span>
            </div>

            {/* Health Pulse Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 text-xs font-mono">
              <Wifi className="h-3.5 w-3.5 text-blue-500" />
              <span>SYS PULSE: ACTIVE</span>
            </div>
          </div>

          {/* Action triggers */}
          <div className="flex items-center gap-1.5 ml-2 border-l border-zinc-800 pl-3">
            <button
              onClick={onRefresh}
              disabled={loading}
              title="Poll database"
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-300 disabled:opacity-50 transition-all cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
            </button>
            <button
              onClick={onResetDatabase}
              title="Reset state to baseline seed data"
              className="px-3 py-2 rounded-lg bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900/30 hover:border-red-900 text-xs font-mono hover:text-red-200 transition-all cursor-pointer"
            >
              Reset Stream
            </button>
          </div>
        </div>

      </div>

      {/* Clock Line */}
      <div className="max-w-7xl mx-auto mt-3 pt-2 border-t border-zinc-900/40 flex justify-between items-center text-[11px] font-mono text-zinc-500">
        <div className="flex items-center gap-2">
          <span>UTC TIME: <span className="text-zinc-300">{utcTime}</span></span>
        </div>
        <div>
          <span>MODEL: <span className="text-blue-400 font-bold font-mono">gemini-3.5-flash</span></span>
        </div>
      </div>
    </header>
  );
}
