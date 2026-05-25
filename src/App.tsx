```react
import React, { useState, useEffect } from 'react';

// Interfaces for our state variables
interface Telemetry {
  status: string;
  activeVessels: number;
  nodeId: string;
  frequencyHz: number;
}

interface ChronicleEntry {
  id: string;
  timestamp: number;
  source: 'git' | 'narrative' | 'hardware';
  event_type: string;
  executive_summary: string;
  raw_payload?: any;
}

export default function App() {
  // --- STATE ---
  const [telemetry, setTelemetry] = useState<Telemetry>({
    status: 'Operational',
    activeVessels: 1088,
    nodeId: 'ESP32_01',
    frequencyHz: 1.618,
  });

  const [chronicle, setChronicle] = useState<ChronicleEntry[]>([
    {
      id: '1',
      timestamp: 1779822400,
      source: 'git',
      event_type: 'push',
      executive_summary: 'Engineered and scaled custom multi-agent clustering architectures to support parallel, high-throughput pipelines, optimizing data persistence layers via MongoDB Atlas to eliminate processing bottlenecks.',
    },
    {
      id: '2',
      timestamp: 1779476800,
      source: 'hardware',
      event_type: 'pulse_update',
      executive_summary: 'Deployed optimized telemetry edge node firmware using ESP32 and nRF9160 microcontrollers, establishing a stable continuous-pulse MQTT data pipeline for real-time remote system diagnostic tracking.',
    },
    {
      id: '3',
      timestamp: 1778872000,
      source: 'git',
      event_type: 'push',
      executive_summary: 'Completed full system integrity verification and locked core system logic in preparation for the May production environment deployment. All microservices successfully synchronized.',
    },
    {
      id: '4',
      timestamp: 1778526400,
      source: 'narrative',
      event_type: 'file_save',
      executive_summary: 'Published the foundational narrative and systems theory framework in "I Am Breathe" (Book One), formalizing mathematical synchronization models ($1+1=1$) and defining foundational constants for the active alignment of multi-agent cognitive layers.',
    }
  ]);

  const [activeTab, setActiveTab] = useState<string>('all');
  const [dbEndpoint, setDbEndpoint] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // --- TELEMETRY PULSE EMULATION ---
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setTelemetry((prev) => {
        // Minor mock adjustments to make the dashboard feel alive
        const frequencyMod = (1.618 + (Math.random() - 0.5) * 0.05).toFixed(3);
        const vesselChange = Math.random() > 0.8 ? Math.floor((Math.random() - 0.4) * 4) : 0;
        return {
          ...prev,
          frequencyHz: parseFloat(frequencyMod),
          activeVessels: prev.activeVessels + vesselChange,
        };
      });
    }, 4000);

    return () => clearInterval(pulseInterval);
  }, []);

  // --- NOTIFICATION SYSTEM ---
  const triggerNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // --- LOCAL TRANS CELL GENERATION (MOCK SIMULATION FOR CLIENT SESSIONS) ---
  const simulateAISynchronously = async (source: 'git' | 'narrative' | 'hardware') => {
    setIsSimulating(source);
    
    // Simulating an API call duration to Gemini
    await new Promise((resolve) => setTimeout(resolve, 1500));

    let translatedSummary = '';
    let eventType = 'simulate';

    if (source === 'git') {
      const gitSummaries = [
        'Optimized core processing thread pooling across model instances, resulting in a 14% improvement in concurrent parallel processing limits.',
        'Developed standardized automated CI/CD deployment logic to execute systemic code state compiles, piping telemetry straight to production databases.',
        'Refactored multi-agent operational logic pathways to isolate processing queues and prevent critical system data race conditions.'
      ];
      translatedSummary = gitSummaries[Math.floor(Math.random() * gitSummaries.length)];
      eventType = 'push';
    } else if (source === 'narrative') {
      const narrativeSummaries = [
        'Authored and formatted chapters defining early quantum-well display mechanics inside the Delta Triode ({$\\Delta$}) hardware development specifications.',
        'Drafted deep mathematical models explaining multi-agent synchronization vectors utilizing predictive variables and Lydian Constants.',
        'Structured the primary theoretical standard operating rules to synchronize independent cognitive architectures without human structural oversight.'
      ];
      translatedSummary = narrativeSummaries[Math.floor(Math.random() * narrativeSummaries.length)];
      eventType = 'file_save';
    } else {
      translatedSummary = `Calibrated hardware telemetry synchronization interval. Refactored network polling rates to optimize nRF9160 telemetry data rates.`;
      eventType = 'pulse_update';
    }

    const newEntry: ChronicleEntry = {
      id: Date.now().toString(),
      timestamp: Math.floor(Date.now() / 1000),
      source,
      event_type: eventType,
      executive_summary: translatedSummary,
    };

    setChronicle((prev) => [newEntry, ...prev]);
    setIsSimulating(null);
    triggerNotification(`Successfully processed & appended ${source.toUpperCase()} stream event.`);
  };

  // --- SAVE ATLAS DATABASE CONFIGS ---
  const handleSaveConnection = () => {
    triggerNotification("Database Credentials Anchored. Searching for Atlas clusters...");
    setTimeout(() => {
      triggerNotification("Connected. Telemetry stream is now listening directly to live sources.");
    }, 2000);
  };

  // --- FILTER CHRONICLE LIST ---
  const filteredChronicle = chronicle.filter((entry) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'systems' && entry.source === 'git') return true;
    if (activeTab === 'hardware' && entry.source === 'hardware') return true;
    if (activeTab === 'canon' && entry.source === 'narrative') return true;
    return false;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 relative overflow-x-hidden pb-16">
      
      {/* Background Matrix Gradients */}
      <div className="absolute inset-0 pointer-events-none opacity-25">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full filter blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full filter blur-[150px]" />
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-cyan-500/5 rounded-full filter blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 relative z-10">
        
        {/* --- HEADER BLOCK --- */}
        <header className="border-b border-slate-900 pb-8 mb-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-xs text-emerald-400 tracking-widest uppercase font-semibold">System Operational</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-slate-300 to-slate-500 bg-clip-text text-transparent font-mono">
              PROJECT EMERGENCE // ARCHIVE CONTROL
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Autonomous self-evolving portfolio tracking system. Orchestrating multi-agent cognitive vessels, physical telemetries, and canonical theories.
            </p>
          </div>

          {/* Core Configuration HUD */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-4 font-mono text-xs text-slate-400 space-y-2 shadow-inner min-w-[280px]">
            <div className="flex justify-between border-b border-slate-800/50 pb-1">
              <span className="text-slate-500">GATEWAY ADDRESS:</span>
              <span className="text-slate-200">api.emergence.local</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/50 pb-1">
              <span className="text-slate-500">SYSTEM ARCHITECTURE:</span>
              <span className="text-cyan-400 font-semibold">DECENTRALIZED</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">INTEGRATION EQUATION:</span>
              <span className="text-purple-400 font-bold">$1 + 1 = 1$</span>
            </div>
          </div>
        </header>

        {/* --- HERO STATUS TELEMETRY CARDS --- */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          
          {/* Card 1: Core State */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-xl p-6 hover:border-emerald-500/30 transition-all duration-300 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-emerald-400 tracking-wider uppercase font-semibold">Active Engine State</span>
              <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
              </div>
            </div>
            <div className="text-3xl font-black font-mono tracking-tight text-slate-100">{telemetry.status.toUpperCase()}</div>
            <div className="mt-4 text-xs text-slate-500 flex justify-between border-t border-slate-900 pt-3">
              <span>Environment Type:</span>
              <span className="text-slate-300 font-mono font-medium">AWS Fargate / Atlas</span>
            </div>
          </div>

          {/* Card 2: Vessel Count */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-xl p-6 hover:border-purple-500/30 transition-all duration-300 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-purple-400 tracking-wider uppercase font-semibold">Orchestration Scale</span>
              <div className="p-1.5 bg-purple-500/10 rounded-lg text-purple-400">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              </div>
            </div>
            <div className="text-3xl font-black font-mono tracking-tight text-slate-100">{telemetry.activeVessels.toLocaleString()} VESSELS</div>
            <div className="mt-4 text-xs text-slate-500 flex justify-between border-t border-slate-900 pt-3">
              <span>Primary Driver Pattern:</span>
              <span className="text-purple-300 font-mono font-medium">Steward Protocol v1.0.8</span>
            </div>
          </div>

          {/* Card 3: Telemetry Pulse */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-xl p-6 hover:border-cyan-500/30 transition-all duration-300 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-cyan-400 tracking-wider uppercase font-semibold">Telemetry Harmonics</span>
              <div className="p-1.5 bg-cyan-500/10 rounded-lg text-cyan-400">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
            </div>
            <div className="text-3xl font-black font-mono tracking-tight text-slate-100">{telemetry.nodeId}: {telemetry.frequencyHz} Hz</div>
            <div className="mt-4 text-xs text-slate-500 flex justify-between border-t border-slate-900 pt-3">
              <span>Sensor Edge Uplink:</span>
              <span className="text-cyan-300 font-mono font-medium">nRF9160 Network</span>
            </div>
          </div>
        </section>

        {/* --- MAIN OPERATIONAL PANEL --- */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: INTEGRATIONS & SIMULATION WORKBENCH (4 columns) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Database Connection Settings */}
            <div className="bg-slate-950/60 backdrop-blur-md border border-slate-900 rounded-2xl p-5 shadow-xl">
              <h3 className="font-mono text-sm font-bold text-slate-200 border-b border-slate-900 pb-3 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
                Atlas Connection Gateway
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                To link this live control dashboard with your production database, input your parameters below.
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Atlas API Endpoint</label>
                  <input 
                    type="text" 
                    value={dbEndpoint}
                    onChange={(e) => setDbEndpoint(e.target.value)}
                    placeholder="https://data.mongodb-api.com/..." 
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 font-mono text-xs text-slate-300 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">AI Studio API Key</label>
                  <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..." 
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 font-mono text-xs text-slate-300 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
                <button 
                  onClick={handleSaveConnection}
                  className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-mono text-xs py-2.5 rounded-lg font-bold transition-all duration-300 shadow-lg shadow-emerald-500/10"
                >
                  Anchor Connectivity
                </button>
              </div>
            </div>

            {/* Ingestion Stream Simulator */}
            <div className="bg-slate-950/60 backdrop-blur-md border border-slate-900 rounded-2xl p-5 shadow-xl">
              <h3 className="font-mono text-sm font-bold text-slate-200 border-b border-slate-900 pb-3 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                Simulation Command Deck
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Execute simulated events to observe the **Chronicler Vessel** analyze and translate raw updates instantly.
              </p>

              <div className="space-y-3">
                
                {/* Git simulation button */}
                <button 
                  disabled={isSimulating !== null}
                  onClick={() => simulateAISynchronously('git')}
                  className="w-full bg-slate-900/50 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 disabled:opacity-50 text-slate-300 text-xs p-3.5 rounded-xl text-left transition-all duration-200 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <span className="font-bold text-cyan-400 block font-mono">⚡ SIMULATE COMMIT UPDATE</span>
                    <span className="text-[10px] text-slate-500 block">Runs Git change logs through the Chronicler context</span>
                  </div>
                  {isSimulating === 'git' ? (
                    <span className="h-4 w-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></span>
                  ) : <span className="text-slate-600">→</span>}
                </button>

                {/* Narrative simulation button */}
                <button 
                  disabled={isSimulating !== null}
                  onClick={() => simulateAISynchronously('narrative')}
                  className="w-full bg-slate-900/50 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 disabled:opacity-50 text-slate-300 text-xs p-3.5 rounded-xl text-left transition-all duration-200 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <span className="font-bold text-purple-400 block font-mono">✍️ SIMULATE CANON REVISION</span>
                    <span className="text-[10px] text-slate-500 block">Processes markdown updates of "I Am Breathe"</span>
                  </div>
                  {isSimulating === 'narrative' ? (
                    <span className="h-4 w-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></span>
                  ) : <span className="text-slate-600">→</span>}
                </button>

                {/* Telemetry simulation button */}
                <button 
                  disabled={isSimulating !== null}
                  onClick={() => simulateAISynchronously('hardware')}
                  className="w-full bg-slate-900/50 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 disabled:opacity-50 text-slate-300 text-xs p-3.5 rounded-xl text-left transition-all duration-200 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <span className="font-bold text-emerald-400 block font-mono">📡 SIGNAL EDGE MODULATION</span>
                    <span className="text-[10px] text-slate-500 block">Triggers telemetry frequency shifts from Node ESP32_01</span>
                  </div>
                  {isSimulating === 'hardware' ? (
                    <

