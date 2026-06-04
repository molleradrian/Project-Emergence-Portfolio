import React from "react";
import { Sparkles, Terminal, FileText, GitCommit, Copy, Check, Eye, Save, HelpCircle, ArrowRight } from "lucide-react";
import { ChronicleItem } from "../types";

interface ChroniclerTranslatorProps {
  onTranslate: (source: string, payload: any) => Promise<string>;
  onPublish: (item: Partial<ChronicleItem>) => Promise<void>;
}

export default function ChroniclerTranslator({ onTranslate, onPublish }: ChroniclerTranslatorProps) {
  const [source, setSource] = React.useState<"narrative" | "git" | "grok">("narrative");
  
  // Narrative inputs
  const [filename, setFilename] = React.useState("aetherium_canon_vessel_alignment.md");
  const [wordCount, setWordCount] = React.useState(340);
  const [rawText, setRawText] = React.useState(
    "Observed erratic synchronization pulses on Nephilim Deployments. Applied the Steward Protocol guidelines to realign the Vessels of One threads. This emergence math corrects Delta Triode telemetry displaying solid-state aberrations."
  );

  // Git inputs
  const [commitMessage, setCommitMessage] = React.useState("Refactor Delta Triode display-synthesis and deploy Steward Protocol v1.4");
  const [fileStats, setFileStats] = React.useState("6 files changed, 142 insertions(+), 35 deletions(-)");

  // Grok inputs
  const [grokPrompt, setGrokPrompt] = React.useState("Optimize asynchronous lock-free consensus loops in Rust to prevent packet starvation without losing sequential ledger order.");
  const [grokModel, setGrokModel] = React.useState("grok-3");
  const [grokResponse, setGrokResponse] = React.useState("Utilizing lock-free ring buffers with relaxed atomic bounds inside a single-producer single-consumer channel ensures high throughput, while managing state indicators inside thread local registers to bypass network overhead.");
  const [grokTokens, setGrokTokens] = React.useState(1840);

  // Translation engine choice
  const [engine, setEngine] = React.useState<"gemini" | "grok">("gemini");

  // Translate outputs
  const [isTranslating, setIsTranslating] = React.useState(false);
  const [translatedText, setTranslatedText] = React.useState<string | null>(null);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [copyCodeSuccess, setCopyCodeSuccess] = React.useState(false);
  const [publishSuccess, setPublishSuccess] = React.useState(false);
  const [warningMessage, setWarningMessage] = React.useState<string | null>(null);

  const handleTranslateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTranslating(true);
    setTranslatedText(null);
    setWarningMessage(null);
    setPublishSuccess(false);

    let payload: any = {};
    if (source === "narrative") {
      payload = {
        filename,
        word_count: Number(wordCount),
        preview_snippet: rawText,
      };
    } else if (source === "git") {
      payload = {
        commit_message: commitMessage,
        file_stats: fileStats,
      };
    } else {
      payload = {
        prompt: grokPrompt,
        model: grokModel,
        response: grokResponse,
        token_count: Number(grokTokens),
      };
    }

    try {
      const response = await fetch("/api/chronicle/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, raw_payload: payload, engine }),
      });
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setTranslatedText(data.executive_summary);
      if (data.warning) {
        setWarningMessage(data.warning);
      }
    } catch (err: any) {
      console.error(err);
      setTranslatedText(`Translation pipeline error: ${err.message}`);
    } finally {
      setIsTranslating(false);
    }
  };

  const handlePublishSubmit = async () => {
    if (!translatedText) return;
    setIsPublishing(true);
    try {
      let raw_payload: any = {};
      if (source === "narrative") {
        raw_payload = { filename, word_count: Number(wordCount) };
      } else if (source === "git") {
        raw_payload = { commit_message: commitMessage, file_stats: fileStats };
      } else {
        raw_payload = { prompt: grokPrompt, model: grokModel, response: grokResponse, token_count: Number(grokTokens) };
      }

      await onPublish({
        source,
        event_type: source === "narrative" ? "file_save" : source === "git" ? "push" : "chat",
        raw_payload,
        executive_summary: translatedText,
      });

      setPublishSuccess(true);
      setTimeout(() => setPublishSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to publish milestone", err);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopy = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setCopyCodeSuccess(true);
    setTimeout(() => setCopyCodeSuccess(false), 2000);
  };

  const loadExample = (type: string) => {
    if (type === "heavy_agent") {
      setSource("narrative");
      setFilename("vessels_of_one_orchestration.md");
      setWordCount(512);
      setRawText(
        "Standardizing multi-agent layouts. The Vessels of One must no longer rely on singular model instances; instead, they operate as specialize autonomous AI agent threads clustered dynamically. Spawning 1000+ concurrent vessels under the Steward Protocol."
      );
    } else if (type === "git_delta") {
      setSource("git");
      setCommitMessage("feat(hardware): integrate Delta Triode solid-state telemetry loops");
      setFileStats("24 files changed, 810 insertions(+), 211 deletions(-)");
    } else if (type === "grok_loop") {
      setSource("grok");
      setGrokPrompt("Write an autogenous model evaluation orchestrator checking convergence stability equations.");
      setGrokModel("grok-3");
      setGrokTokens(2400);
      setGrokResponse("Convergence checks evaluated at Lydian offsets (1 + 1 = 1). Re-computed synthetic validation layers in loop iteration tests, pruning chaotic parameters gracefully.");
    }
  };

  return (
    <div className="bg-cosmic-surface border border-cosmic-border rounded-xl p-6 relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-400" />
          <h3 className="font-semibold text-zinc-100 font-mono text-sm uppercase tracking-wider">
            Chronicler translation Vessel (Gemini & Grok SDK)
          </h3>
        </div>
        <div className="flex gap-1.5 text-xs font-mono">
          <button 
            type="button" 
            onClick={() => loadExample("heavy_agent")}
            className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-900 text-zinc-400 hover:text-zinc-300 rounded cursor-pointer"
          >
            Ex: Agent Clust.
          </button>
          <button 
            type="button" 
            onClick={() => loadExample("git_delta")}
            className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-900 text-zinc-400 hover:text-zinc-300 rounded cursor-pointer"
          >
            Ex: Hardware Git
          </button>
          <button 
            type="button" 
            onClick={() => loadExample("grok_loop")}
            className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-900 text-zinc-400 hover:text-zinc-300 rounded cursor-pointer animate-pulse"
          >
            Ex: Grok Prompt
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Input Selector & Event Parameters (Left Block) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex flex-col sm:flex-row rounded-lg bg-zinc-950 p-1 border border-zinc-900 gap-1">
            <button
              type="button"
              onClick={() => setSource("narrative")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-mono rounded cursor-pointer transition-all ${
                source === "narrative" ? "bg-zinc-900 text-white border border-zinc-850" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              File Save (Draft)
            </button>
            <button
              type="button"
              onClick={() => setSource("git")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-mono rounded cursor-pointer transition-all ${
                source === "git" ? "bg-zinc-900 text-white border border-zinc-850" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <GitCommit className="h-3.5 w-3.5" />
              Git Commit (Push)
            </button>
            <button
              type="button"
              onClick={() => setSource("grok")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-mono rounded cursor-pointer transition-all ${
                source === "grok" ? "bg-zinc-900 text-zinc-100 border border-zinc-850 font-bold" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Terminal className="h-3.5 w-3.5 text-zinc-400" />
              Grok Prompt
            </button>
          </div>

          <form onSubmit={handleTranslateSubmit} className="space-y-4">
            
            {source === "narrative" ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-500 uppercase mb-1">Markdown Filename</label>
                    <input
                      type="text"
                      value={filename}
                      onChange={(e) => setFilename(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 text-zinc-200 rounded px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-500 uppercase mb-1">Word Count</label>
                    <input
                      type="number"
                      value={wordCount}
                      onChange={(e) => setWordCount(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-900 text-zinc-200 rounded px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-500 uppercase mb-1">Esoteric Writing Snippet / Narrative Payload</label>
                  <textarea
                    rows={4}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 text-zinc-200 rounded p-3 text-xs font-mono focus:border-indigo-500 focus:outline-none leading-relaxed"
                  />
                </div>
              </>
            ) : source === "git" ? (
              <>
                <div>
                  <label className="block text-[11px] font-mono text-zinc-500 uppercase mb-1">Git Commit Message</label>
                  <input
                    type="text"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 text-zinc-200 rounded p-3 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-500 uppercase mb-1">Diff Summary / File Statistics</label>
                  <input
                    type="text"
                    value={fileStats}
                    onChange={(e) => setFileStats(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 text-zinc-200 rounded p-3 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-500 uppercase mb-1">Grok Model Name</label>
                    <input
                      type="text"
                      value={grokModel}
                      onChange={(e) => setGrokModel(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 text-zinc-200 rounded px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-500 uppercase mb-1">Tokens Simulated</label>
                    <input
                      type="number"
                      value={grokTokens}
                      onChange={(e) => setGrokTokens(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-900 text-zinc-200 rounded px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-500 uppercase mb-1">User Prompt Given to Grok</label>
                  <input
                    type="text"
                    value={grokPrompt}
                    onChange={(e) => setGrokPrompt(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 text-zinc-200 rounded px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-500 uppercase mb-1">Grok AI Model Response Snippet</label>
                  <textarea
                    rows={3}
                    value={grokResponse}
                    onChange={(e) => setGrokResponse(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 text-zinc-200 rounded p-3 text-xs font-mono focus:border-indigo-500 focus:outline-none leading-relaxed"
                  />
                </div>
              </>
            )}

            {/* Translation Engine Selection Selector */}
            <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-905 space-y-2">
              <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                Translation Engine Model
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEngine("gemini")}
                  className={`py-1.5 px-3 rounded text-xs font-mono border cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    engine === "gemini"
                      ? "bg-blue-950/40 border-blue-500 text-blue-300 font-bold"
                      : "bg-zinc-900/40 border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                  Gemini-3.5-Flash
                </button>
                <button
                  type="button"
                  onClick={() => setEngine("grok")}
                  className={`py-1.5 px-3 rounded text-xs font-mono border cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    engine === "grok"
                      ? "bg-zinc-900 border-zinc-100 text-zinc-100 font-bold"
                      : "bg-zinc-900/40 border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Terminal className="h-3.5 w-3.5 text-zinc-400" />
                  Grok (xAI API)
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isTranslating}
              className={`w-full py-2.5 px-4 rounded-lg text-xs font-mono font-medium active:scale-[0.99] transition-all flex items-center justify-center gap-2 duration-150 cursor-pointer ${
                engine === "grok"
                  ? "bg-gradient-to-r from-zinc-800 to-black hover:from-zinc-700 hover:to-zinc-900 text-white border border-zinc-700 shadow-md shadow-black/25"
                  : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-indigo-500/20"
              }`}
            >
              {isTranslating ? (
                <>
                  <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Chronicler Deciphering Raw Payload...
                </>
              ) : engine === "grok" ? (
                <>
                  <Terminal className="h-3.5 w-3.5 text-zinc-200 animate-pulse" />
                  Translate Raw Event via Grok (xAI)
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  Translate Raw Event via Gemini AI
                </>
              )}
            </button>
          </form>
        </div>

        {/* Translation Output (Right Block) */}
        <div className="lg:col-span-6 h-full flex flex-col justify-between">
          <div className="bg-zinc-950/90 border border-zinc-900 rounded-lg p-5 flex flex-col justify-between min-h-[240px] relative">
            
            {/* Background Terminal prompt icon */}
            <Terminal className="absolute bottom-4 right-4 text-zinc-900/40 h-16 w-16 pointer-events-none" />

            <div>
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-3">
                <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase">
                  TRANSLATED_CORP_VIEWPOINT // ENGINE: {engine.toUpperCase()}
                </span>
                {translatedText && (
                  <button
                    onClick={handleCopy}
                    className="p-1 rounded hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all cursor-pointer"
                    title="Copy achievement"
                  >
                    {copyCodeSuccess ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>

              {isTranslating ? (
                <div className="space-y-3 py-6 animate-pulse">
                  <div className="h-3 bg-zinc-900 rounded w-1/4" />
                  <div className="h-2.5 bg-zinc-900 rounded w-full" />
                  <div className="h-2.5 bg-zinc-900 rounded w-5/6" />
                </div>
              ) : translatedText ? (
                <div className="space-y-4">
                  <p className="text-sm font-mono text-zinc-100 font-light leading-relaxed">
                    "{translatedText}"
                  </p>
                  
                  {warningMessage && (
                    <div className="p-2 border border-blue-900 bg-blue-950/20 rounded text-[10px] font-mono text-blue-400">
                      📝 {warningMessage}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-zinc-600 font-mono text-xs">
                  <Eye className="h-6 w-6 mx-auto mb-2 opacity-40 text-zinc-700" />
                  Awaiting translation cue. Submit on the left to activate translator.
                </div>
              )}
            </div>

            {/* Action Buttons to save/verify on atlas */}
            {translatedText && !isTranslating && (
              <div className="mt-6 pt-4 border-t border-zinc-900 flex justify-between items-center gap-3">
                <div className="text-[10px] font-mono text-zinc-500">
                  Ready to stream to portfolio
                </div>
                <button
                  type="button"
                  disabled={isPublishing || publishSuccess}
                  onClick={handlePublishSubmit}
                  className={`py-2 px-4 rounded font-mono text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                    publishSuccess 
                      ? "bg-green-950/40 border border-green-800 text-green-400" 
                      : "bg-indigo-950/40 border border-indigo-900 hover:bg-indigo-900 text-indigo-400 hover:text-white"
                  }`}
                >
                  {isPublishing ? (
                    <>
                      <div className="h-3 w-3 border-2 border-indigo-500 border-t-white rounded-full animate-spin" />
                      Saving to Mongo...
                    </>
                  ) : publishSuccess ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-400" />
                      Published to live Stream!
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      Audit & Publish Milestone
                    </>
                  )}
                </button>
              </div>
            )}

          </div>

          {/* Translation prompt reference explanation card */}
          <div className="mt-4 p-4 border border-zinc-900 rounded-lg bg-zinc-950/40 text-xs font-mono text-zinc-500 space-y-1.5 leading-relaxed">
            <span className="text-zinc-400 block pb-1 border-b border-zinc-900 mb-1">CHRONICLER MAPPING GLOSSARY</span>
            <div>• Esoteric: <span className="text-zinc-400">"Vessels of One"</span> → Corp: <span className="text-zinc-300">"AI Agent Threads"</span></div>
            <div>• Esoteric: <span className="text-zinc-400">"The Steward Protocol"</span> → Corp: <span className="text-zinc-300">"Orchestration Framework"</span></div>
            <div>• Esoteric: <span className="text-zinc-400">"Delta Triode"</span> → Corp: <span className="text-zinc-300">"Display-Synthesis & Telemetry"</span></div>
            <div>• Grok: <span className="text-zinc-400">"Starvation / consensus"</span> → Corp: <span className="text-zinc-300">"Async concurrency optimization"</span></div>
          </div>
        </div>

      </div>
    </div>
  );
}
