import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldAlert, RefreshCw, Layers, Sparkles, CheckCircle, Database, Cpu, Terminal, History, CloudLightning, FileCode, Radio, Activity, Shield } from "lucide-react";

import Header from "./components/Header";
import TelemetryPanel from "./components/TelemetryPanel";
import ChroniclerTranslator from "./components/ChroniclerTranslator";
import ChronicleStream from "./components/ChronicleStream";
import GoogleDriveManager from "./components/GoogleDriveManager";
import ArchitecturalInstructions from "./components/ArchitecturalInstructions";
import SecurityAuthConsole from "./components/SecurityAuthConsole";

import { SystemState, ChronicleItem, BackendStatus, UserProfile } from "./types";

export default function App() {
  const [status, setStatus] = React.useState<BackendStatus | null>(null);
  const [telemetry, setTelemetry] = React.useState<SystemState | null>(null);
  const [timeline, setTimeline] = React.useState<ChronicleItem[]>([]);
  
  const [loading, setLoading] = React.useState<boolean>(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  
  // Authentication session state
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);

  // Tabs management
  const [activeTab, setActiveTab] = React.useState<"stream" | "terminal" | "chronicler" | "vault" | "daemons" | "security">("stream");

  // Poll database on load and refresh
  const fetchAllData = async (silent = false) => {
    if (!silent) setLoading(true);
    setErrorMsg(null);
    try {
      // Fetch server status
      const statusRes = await fetch("/api/health");
      const statusData = await statusRes.json();
      setStatus(statusData);

      // Fetch telemetric state
      const stateRes = await fetch("/api/state");
      const stateData = await stateRes.json();
      setTelemetry(stateData);

      // Fetch chronological stream
      const chronicleRes = await fetch("/api/chronicle");
      const chronicleData = await chronicleRes.json();
      setTimeline(chronicleData);
    } catch (err: any) {
      console.error("Failed to synchronize with backend node:", err);
      setErrorMsg("Failed to synchronize with fullstack backend node. Retry in a few seconds.");
    } finally {
      setLoading(false);
    }
  };

  const verifyAuthSessionOnLoad = async () => {
    let token = localStorage.getItem("aether_token");
    if (!token) {
      token = "guest_token";
      localStorage.setItem("aether_token", token);
    }

    try {
      const res = await fetch("/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCurrentUser(data.user);
          console.log("[AUTH] Restored active session for entity:", data.user.name);
        } else {
          localStorage.removeItem("aether_token");
        }
      } else {
        localStorage.removeItem("aether_token");
      }
    } catch (e) {
      console.warn("Auth initialization failed:", e);
    }
  };

  React.useEffect(() => {
    verifyAuthSessionOnLoad().then(() => {
      fetchAllData();
    });

    // Auto-poll metrics every 15 seconds silently to show real-time changes
    const interval = setInterval(() => {
      fetchAllData(true);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const getAuthTokenOrAlert = (): string | null => {
    const token = localStorage.getItem("aether_token");
    if (!token) {
      showToast("Security Gate: Please authenticate first via Aether Identity Shield.");
      setActiveTab("security");
      return null;
    }
    return token;
  };

  // Live trigger to update ESP32 coordinates
  const handleUpdateTelemetry = async (updatedData: Partial<SystemState>) => {
    const token = getAuthTokenOrAlert();
    if (!token) return;

    try {
      const response = await fetch("/api/state/pulse", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updatedData),
      });
      const data = await response.json();
      if (data.success) {
        setTelemetry(data.state);
        showToast("Telemetry metrics updated in database!");
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error(err);
      showToast(`State update failed: ${err.message}`);
    }
  };

  // Direct trigger to pulse metrics, call translate, and post straight to stream
  const handleTranslateAndArchiveHardware = async (source: string, payload: any) => {
    const token = getAuthTokenOrAlert();
    if (!token) return;

    try {
      // 1. Trigger the state pulse first
      const pulseResponse = await fetch("/api/state/pulse", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          node_id: payload.node_id,
          frequency_hz: payload.frequency_hz,
          active_vessels: payload.active_vessels,
        }),
      });
      const pulseData = await pulseResponse.json();
      if (pulseData.success) {
        setTelemetry(pulseData.state);
      } else {
        throw new Error(pulseData.error);
      }

      // 2. Call translational pipeline
      const translateRes = await fetch("/api/chronicle/translate", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ source, raw_payload: payload }),
      });
      const translateData = await translateRes.json();

      if (translateData.error) {
        throw new Error(translateData.error);
      }

      // 3. Publish straight to the collection stream
      await handlePublishMilestone({
        source,
        event_type: "pulse",
        raw_payload: payload,
        executive_summary: translateData.executive_summary,
      });

    } catch (err: any) {
      console.error("Fail step translation hardware:", err);
      showToast(`Automated Archiving Failed: ${err.message}`);
    }
  };

  // Publish a custom synthesized milestone
  const handlePublishMilestone = async (item: Partial<ChronicleItem>) => {
    const token = getAuthTokenOrAlert();
    if (!token) return;

    try {
      const response = await fetch("/api/chronicle/publish", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(item),
      });
      const data = await response.json();
      if (data.success) {
        // Optimistic state prepending
        setTimeline((prev) => [data.item, ...prev]);
        showToast("Milestone successfully streamed to resume portfolio!");
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error(err);
      showToast(`Publishing failed: ${err.message}`);
    }
  };

  // Delete/Prune individual milestone
  const handleDeleteMilestone = async (timestamp: number, summary: string) => {
    const token = getAuthTokenOrAlert();
    if (!token) return;

    try {
      const response = await fetch("/api/chronicle/delete", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ timestamp, executive_summary: summary }),
      });
      const data = await response.json();
      if (data.success) {
        setTimeline((prev) =>
          prev.filter((item) => !(item.timestamp === timestamp && item.executive_summary === summary))
        );
        showToast("Milestone pruned from collection successfully.");
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error(err);
      showToast(`Pruning milestone failed: ${err.message}`);
    }
  };

  // Clear system streams and reseed baseline default achievements
  const handleResetDatabase = async () => {
    const token = getAuthTokenOrAlert();
    if (!token) return;

    const confirmReset = window.confirm("Are you sure you want to restore the chronicle portfolio stream back to the baseline seed achievements? This will drop custom additions.");
    if (!confirmReset) return;

    setLoading(true);
    try {
      const response = await fetch("/api/chronicle/reset", { 
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setTelemetry(data.state.system_state);
        setTimeline(data.state.chronicle_stream);
        showToast("Successfully reseeded baseline portfolio metrics.");
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error(err);
      showToast(`Reset error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-cosmic-bg selection:bg-blue-500/30 selection:text-white flex flex-col justify-between">
      
      <div>
        {/* Header Badges Navigation */}
        <Header
          status={status}
          loading={loading}
          currentUser={currentUser}
          onRefresh={() => fetchAllData()}
          onResetDatabase={handleResetDatabase}
        />

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="max-w-7xl mx-auto px-6 mt-4">
            <div className="bg-red-950/40 border border-red-900 text-red-400 p-4 rounded-xl flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button
                onClick={() => fetchAllData()}
                className="px-3 py-1 bg-red-900 text-white hover:bg-red-800 rounded font-bold cursor-pointer transition-all"
              >
                Reconnect
              </button>
            </div>
          </div>
        )}

        {/* Primary Dashboard Grid */}
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          
          {/* 1. Permanent System Metrics Station Cockpit */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-xl border border-cosmic-border bg-cosmic-surface relative overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="font-mono space-y-1">
              <div className="text-[10px] uppercase text-zinc-500 font-bold flex items-center gap-1.5">
                <History className="h-3 w-3 text-emerald-400" />
                <span>Achievements Streamed</span>
              </div>
              <p className="text-xl font-bold text-emerald-400">
                {timeline.length} <span className="text-xs text-zinc-500 font-normal">items</span>
              </p>
            </div>

            <div className="font-mono space-y-1 border-l border-zinc-900 pl-4">
              <div className="text-[10px] uppercase text-zinc-500 font-bold flex items-center gap-1.5">
                <Cpu className="h-3 w-3 text-blue-400" />
                <span>Active Coordinator</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-zinc-200 truncate" title={telemetry?.node_id || "OFF-CORE-XX"}>
                {telemetry?.node_id || "EMERGE-COORDINATOR-XX"}
              </p>
            </div>

            <div className="font-mono space-y-1 border-l border-zinc-900 pl-4">
              <div className="text-[10px] uppercase text-zinc-500 font-bold flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-purple-400" />
                <span>Signal Frequency</span>
              </div>
              <p className="text-xl font-bold text-zinc-200">
                {telemetry?.frequency_hz || 0} <span className="text-[10px] text-purple-400 font-bold uppercase">Hz</span>
              </p>
            </div>

            <div className="font-mono space-y-1 border-l border-zinc-900 pl-4">
              <div className="text-[10px] uppercase text-zinc-500 font-bold flex items-center gap-1.5">
                <Layers className="h-3 w-3 text-amber-500" />
                <span>Vessels Registered</span>
              </div>
              <p className="text-xl font-bold text-zinc-200">
                {telemetry?.active_vessels || 0} <span className="text-xs text-zinc-500 font-normal">nodes</span>
              </p>
            </div>
          </div>

                  {/* 2. Interactive Navigation Pages Tab Selector */}
          <div className="border-b border-zinc-900 flex flex-nowrap overflow-x-auto scrollbar-none gap-2 pb-1">
            <button
              onClick={() => setActiveTab("stream")}
              className={`flex items-center gap-2 py-3 px-4 rounded-t-lg font-mono text-xs transition-all relative shrink-0 cursor-pointer ${
                activeTab === "stream" ? "text-blue-400 border-b-2 border-blue-500 font-bold bg-zinc-900/30" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/10"
              }`}
            >
              <History className="h-4 w-4" />
              <span>Timeline Stream</span>
            </button>
            
            <button
              onClick={() => setActiveTab("terminal")}
              className={`flex items-center gap-2 py-3 px-4 rounded-t-lg font-mono text-xs transition-all relative shrink-0 cursor-pointer ${
                activeTab === "terminal" ? "text-blue-400 border-b-2 border-blue-500 font-bold bg-zinc-900/30" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/10"
              }`}
            >
              <Cpu className="h-4 w-4" />
              <span>Node Terminal</span>
            </button>

            <button
              onClick={() => setActiveTab("chronicler")}
              className={`flex items-center gap-2 py-3 px-4 rounded-t-lg font-mono text-xs transition-all relative shrink-0 cursor-pointer ${
                activeTab === "chronicler" ? "text-blue-400 border-b-2 border-blue-500 font-bold bg-zinc-900/30" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/10"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Chronicler AI</span>
            </button>

            <button
              onClick={() => setActiveTab("vault")}
              className={`flex items-center gap-2 py-3 px-4 rounded-t-lg font-mono text-xs transition-all relative shrink-0 cursor-pointer ${
                activeTab === "vault" ? "text-blue-400 border-b-2 border-blue-500 font-bold bg-zinc-900/30" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/10"
              }`}
            >
              <CloudLightning className="h-4 w-4" />
              <span>Storage Vault</span>
            </button>

            <button
              onClick={() => setActiveTab("daemons")}
              className={`flex items-center gap-2 py-3 px-4 rounded-t-lg font-mono text-xs transition-all relative shrink-0 cursor-pointer ${
                activeTab === "daemons" ? "text-blue-400 border-b-2 border-blue-500 font-bold bg-zinc-900/30" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/10"
              }`}
            >
              <FileCode className="h-4 w-4" />
              <span>Daemons Blueprint</span>
            </button>

            <button
              onClick={() => setActiveTab("security")}
              className={`flex items-center gap-2 py-3 px-4 rounded-t-lg font-mono text-xs transition-all relative shrink-0 cursor-pointer ${
                activeTab === "security" ? "text-blue-400 border-b-2 border-blue-500 font-bold bg-zinc-900/30" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/10"
              }`}
            >
              <Shield className={`h-4 w-4 ${currentUser ? "text-indigo-400" : ""}`} />
              <span>Identity Shield</span>
              {currentUser && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
          </div>

          {/* 3. Page Container with Framer Motion transitions */}
          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.15 }}
                className="space-y-8"
              >
                {activeTab === "stream" && (
                  <ChronicleStream
                    timeline={timeline}
                    onDelete={handleDeleteMilestone}
                    loading={loading}
                  />
                )}

                {activeTab === "terminal" && (
                  <TelemetryPanel
                    telemetry={telemetry}
                    onUpdateState={handleUpdateTelemetry}
                    onTriggerTranslationalAchievement={handleTranslateAndArchiveHardware}
                  />
                )}

                {activeTab === "chronicler" && (
                  <ChroniclerTranslator
                    onTranslate={async (source, payload) => {
                      // Internal execution flow will manage translates, this is an optional interface
                      return "";
                    }}
                    onPublish={handlePublishMilestone}
                  />
                )}

                {activeTab === "vault" && (
                  <GoogleDriveManager
                    telemetry={telemetry}
                    timeline={timeline}
                    onShowMessage={showToast}
                  />
                )}

                {activeTab === "daemons" && (
                  <ArchitecturalInstructions />
                )}

                {activeTab === "security" && (
                  <SecurityAuthConsole
                    currentUser={currentUser}
                    onLoginSuccess={(user, token) => {
                      setCurrentUser(user);
                      localStorage.setItem("aether_token", token);
                    }}
                    onLogoutSuccess={() => {
                      setCurrentUser(null);
                      localStorage.removeItem("aether_token");
                    }}
                    onShowMessage={showToast}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

        </main>
      </div>

      {/* Footer Branded Layout */}
      <footer className="border-t border-zinc-900 bg-zinc-950/40 py-8 px-6 mt-12 text-center text-xs font-mono text-zinc-600">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img 
              src="https://www.google.com/images/branding/googlelogo/1x/googlelogo_light_color_272x92dp.png" 
              alt="Google"
              className="h-4 opacity-40 filter grayscale brightness-200"
              referrerPolicy="no-referrer"
            />
            <span>AI Studio Full-Stack Architectural Portfolio</span>
          </div>
          <div>
            <span>SYSTEM CHRONICLER EMBEDDED ENGINE // {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>

      {/* Shared Toast Notification popup */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg shadow-2xl p-3 px-4 text-xs font-mono max-w-sm flex items-center gap-2.5 backdrop-blur-md animate-fade-in animate-slide-up">
          <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
