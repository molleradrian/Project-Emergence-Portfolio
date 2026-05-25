import React from "react";
import { motion } from "motion/react";
import { ShieldAlert, RefreshCw, Layers, Sparkles, CheckCircle, Database } from "lucide-react";

import Header from "./components/Header";
import TelemetryPanel from "./components/TelemetryPanel";
import ChroniclerTranslator from "./components/ChroniclerTranslator";
import ChronicleStream from "./components/ChronicleStream";
import ArchitecturalInstructions from "./components/ArchitecturalInstructions";

import { SystemState, ChronicleItem, BackendStatus } from "./types";

export default function App() {
  const [status, setStatus] = React.useState<BackendStatus | null>(null);
  const [telemetry, setTelemetry] = React.useState<SystemState | null>(null);
  const [timeline, setTimeline] = React.useState<ChronicleItem[]>([]);
  
  const [loading, setLoading] = React.useState<boolean>(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

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

  React.useEffect(() => {
    fetchAllData();

    // Auto-poll metrics every 15 seconds silently to show real-time changes
    const interval = setInterval(() => {
      fetchAllData(true);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Live trigger to update ESP32 coordinates
  const handleUpdateTelemetry = async (updatedData: Partial<SystemState>) => {
    try {
      const response = await fetch("/api/state/pulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    try {
      // 1. Trigger the state pulse first
      await handleUpdateTelemetry({
        node_id: payload.node_id,
        frequency_hz: payload.frequency_hz,
        active_vessels: payload.active_vessels,
      });

      // 2. Call translational pipeline
      const translateRes = await fetch("/api/chronicle/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    try {
      const response = await fetch("/api/chronicle/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    try {
      const response = await fetch("/api/chronicle/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    const confirmReset = window.confirm("Are you sure you want to restore the chronicle portfolio stream back to the baseline seed achievements? This will drop custom additions.");
    if (!confirmReset) return;

    setLoading(true);
    try {
      const response = await fetch("/api/chronicle/reset", { method: "POST" });
      const data = await response.json();
      if (data.success) {
        setTelemetry(data.state.system_state);
        setTimeline(data.state.chronicle_stream);
        showToast("Successfully reseeded baseline portfolio metrics.");
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
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* 1. Hardware Node Telemetric status (system_state) */}
            <TelemetryPanel
              telemetry={telemetry}
              onUpdateState={handleUpdateTelemetry}
              onTriggerTranslationalAchievement={handleTranslateAndArchiveHardware}
            />

            {/* 2. Interactive Chronicler Decipherer (Gemini input translator) */}
            <ChroniclerTranslator
              onTranslate={async (source, payload) => {
                // Translator callback internally managed, but exposed if needed
                return "";
              }}
              onPublish={handlePublishMilestone}
            />

            {/* 3. Stream List Timeline of Executive Achievements */}
            <ChronicleStream
              timeline={timeline}
              onDelete={handleDeleteMilestone}
              loading={loading}
            />

            {/* 4. Configuration Daemons Instructions Code Blocks */}
            <ArchitecturalInstructions />

          </motion.div>

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
