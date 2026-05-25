import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileText, GitCommit, Cpu, Trash2, Calendar, Database, ShieldAlert, Circle, Eye, EyeOff, Share2, Twitter, Linkedin, Facebook, Link, Check } from "lucide-react";
import { ChronicleItem } from "../types";

interface ChronicleStreamProps {
  timeline: ChronicleItem[];
  onDelete: (timestamp: number, summary: string) => Promise<void>;
  loading: boolean;
}

export default function ChronicleStream({ timeline, onDelete, loading }: ChronicleStreamProps) {
  const [filter, setFilter] = React.useState<string>("all");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [shareOpenId, setShareOpenId] = React.useState<string | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Helper to format epoch seconds into readable string
  const formatTime = (epochSeconds: number) => {
    const d = new Date(epochSeconds * 1000);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTimeline = timeline.filter((item) => {
    if (filter === "all") return true;
    return item.source === filter;
  });

  const toggleExpand = (uniqueId: string) => {
    if (expandedId === uniqueId) {
      setExpandedId(null);
    } else {
      setExpandedId(uniqueId);
    }
  };

  return (
    <div className="bg-cosmic-surface border border-cosmic-border rounded-xl p-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5 mb-6">
        <div>
          <h3 className="font-semibold text-zinc-100 font-mono text-sm uppercase tracking-wider flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            Project Chronicles Stream (chronicle_stream)
          </h3>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            Historical portfolio index of corporate-aligned engineering accomplishments.
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-950 border border-zinc-900 rounded-lg text-xs font-mono">
          {["all", "narrative", "git", "hardware"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded capitalize cursor-pointer transition-all ${
                filter === s ? "bg-zinc-800 text-white font-medium" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading && timeline.length === 0 ? (
        <div className="text-center py-20 text-zinc-600 font-mono text-xs">
          <div className="h-4 w-4 border-2 border-blue-500 border-t-white rounded-full animate-spin mx-auto mb-3" />
          Synchronizing chronicle cache with live database...
        </div>
      ) : filteredTimeline.length === 0 ? (
        <div className="text-center py-20 border border-zinc-900 border-dashed rounded-lg bg-black/20 text-zinc-500 font-mono text-xs">
          <ShieldAlert className="h-8 w-8 mx-auto mb-3 opacity-30 text-zinc-600" />
          No stream achievements matching filter found in database.
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {filteredTimeline.map((item, idx) => {
              const uniqueKey = `${item.timestamp}-${item.executive_summary.substring(0, 15)}`;
              const isExpanded = expandedId === uniqueKey;

              // Compute source accent colors
              let srcColor = "text-emerald-400 border-emerald-900 bg-emerald-950/20";
              let SrcIcon = FileText;
              if (item.source === "git") {
                srcColor = "text-purple-400 border-purple-900 bg-purple-950/20";
                SrcIcon = GitCommit;
              } else if (item.source === "hardware") {
                srcColor = "text-blue-400 border-blue-900 bg-blue-950/20";
                SrcIcon = Cpu;
              }

              return (
                <motion.div
                  key={uniqueKey}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, delay: Math.min(idx * 0.05, 0.4) }}
                  className="bg-black/60 border border-zinc-900 rounded-lg p-4 hover:border-zinc-800 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    {/* Event Type Icon Bubble */}
                    <div className={`p-2.5 rounded-lg border flex items-center justify-center ${srcColor}`}>
                      <SrcIcon className="h-4.5 w-4.5" />
                    </div>

                    {/* Metadata, Description, Actions */}
                    <div className="flex-1 min-w-0">
                      
                      {/* Topline metadata */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded border text-[10px] ${srcColor}`}>
                            {item.source.toUpperCase()} // {item.event_type.toUpperCase()}
                          </span>
                          <span className="text-zinc-600">|</span>
                          <span className="text-zinc-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatTime(item.timestamp)}
                          </span>
                        </div>

                        {/* Card controls */}
                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          
                          {/* Share Milestone Dropdown */}
                          <div className="relative">
                            <button
                              onClick={() => setShareOpenId(shareOpenId === uniqueKey ? null : uniqueKey)}
                              title="Share this achievement"
                              className="p-1 px-1.5 rounded hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-all flex items-center gap-1 text-[10px] uppercase cursor-pointer"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                              <span>Share</span>
                            </button>

                            {shareOpenId === uniqueKey && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setShareOpenId(null)} />
                                <div className="absolute right-0 mt-2 w-48 rounded-lg bg-zinc-950 border border-zinc-800 shadow-2xl z-50 p-1.5 font-mono text-xs">
                                  <div className="px-2 py-1 text-[9px] uppercase text-zinc-500 font-bold border-b border-zinc-900 mb-1">
                                    Share Milestone
                                  </div>
                                  
                                  {/* X (Twitter) */}
                                  <a
                                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`"${item.executive_summary}" — From Project Emergence Portfolio:`)}&url=${encodeURIComponent(window.location.href)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setShareOpenId(null)}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-900 text-zinc-300 hover:text-white transition-all"
                                  >
                                    <Twitter className="h-3 w-3 text-sky-400" />
                                    <span>Share on X</span>
                                  </a>

                                  {/* LinkedIn */}
                                  <a
                                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setShareOpenId(null)}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-900 text-zinc-300 hover:text-white transition-all"
                                  >
                                    <Linkedin className="h-3 w-3 text-blue-400" />
                                    <span>Share on LinkedIn</span>
                                  </a>

                                  {/* Facebook */}
                                  <a
                                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setShareOpenId(null)}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-900 text-zinc-300 hover:text-white transition-all"
                                  >
                                    <Facebook className="h-3 w-3 text-blue-500" />
                                    <span>Share on Facebook</span>
                                  </a>

                                  <div className="border-t border-zinc-900 my-1"></div>

                                  {/* Copy Item Summary text directly */}
                                  <button
                                    onClick={() => {
                                      handleCopyText(item.executive_summary, uniqueKey);
                                      setShareOpenId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-900 text-zinc-300 hover:text-white text-left transition-all cursor-pointer"
                                  >
                                    {copiedId === uniqueKey ? (
                                      <>
                                        <Check className="h-3 w-3 text-green-400" />
                                        <span className="text-green-400">Copied text!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Link className="h-3 w-3 text-zinc-400" />
                                        <span>Copy text</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </>
                            )}
                          </div>

                          <button
                            onClick={() => toggleExpand(uniqueKey)}
                            title="Reveal raw log metadata"
                            className="p-1 px-1.5 rounded hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-all flex items-center gap-1 text-[10px] uppercase cursor-pointer"
                          >
                            {isExpanded ? (
                              <>
                                <EyeOff className="h-3.5 w-3.5" />
                                Hide Raw
                              </>
                            ) : (
                              <>
                                <Eye className="h-3.5 w-3.5" />
                                Inspect Raw
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => onDelete(item.timestamp, item.executive_summary)}
                            title="Prune milestone"
                            className="p-1 rounded hover:bg-red-950/40 text-zinc-500 hover:text-red-400 transition-all cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Professional Translation Bullet (The gold copy) */}
                      <p className="text-sm font-sans font-light text-zinc-100 leading-relaxed tracking-wide">
                        {item.executive_summary}
                      </p>

                      {/* Expanded payload viewer */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-3"
                          >
                            <div className="p-3 bg-zinc-950 rounded border border-zinc-900/60 font-mono text-[11px] text-zinc-400 space-y-1 block leading-relaxed relative">
                              <span className="absolute top-2 right-2 text-[9px] text-zinc-600">RAW_MONGO_DOCUMENT_METADATA</span>
                              <div className="text-indigo-400">// Original Event Source details:</div>
                              <pre className="text-zinc-300 font-mono overflow-auto max-h-48 mt-1 p-1">
                                {JSON.stringify(item.raw_payload, null, 2)}
                              </pre>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
