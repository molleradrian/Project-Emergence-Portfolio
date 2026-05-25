import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Cloud,
  CloudLightning,
  User,
  LogOut,
  FolderOpen,
  FileJson,
  FileText,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Loader2,
  Lock,
  History
} from "lucide-react";
import { googleSignIn, logout, initAuth } from "../lib/firebase";
import {
  listDriveBackups,
  createDriveBackup,
  deleteDriveFile,
  getDriveFileContent,
  GoogleDriveFile
} from "../lib/driveService";
import { SystemState, ChronicleItem } from "../types";

interface GoogleDriveManagerProps {
  telemetry: SystemState | null;
  timeline: ChronicleItem[];
  onShowMessage: (msg: string) => void;
}

export default function GoogleDriveManager({
  telemetry,
  timeline,
  onShowMessage,
}: GoogleDriveManagerProps) {
  const [user, setUser] = React.useState<any | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [files, setFiles] = React.useState<GoogleDriveFile[]>([]);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);

  // Initialize Auth listeners
  React.useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setLoading(false);
        // Automatically fetch files after connecting
        fetchDriveFiles(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch backups from Google Drive
  const fetchDriveFiles = async (accessToken: string) => {
    setErrorMsg(null);
    try {
      const driveFiles = await listDriveBackups(accessToken);
      setFiles(driveFiles);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to synchronize Drive inventory. Please check scope permission.");
    }
  };

  // Sign interactive handler
  const handleSignIn = async () => {
    setErrorMsg(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        onShowMessage(`Connected. Authenticated as ${result.user.displayName}`);
        await fetchDriveFiles(result.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Connection rejected or cancelled.");
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    const confirmSignout = window.confirm("Are you sure you want to log out from your Google account?");
    if (!confirmSignout) return;

    try {
      await logout();
      setUser(null);
      setToken(null);
      setFiles([]);
      onShowMessage("Google Drive account unlinked successfully.");
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Link disconnection failed.");
    }
  };

  // Format bytes for display
  const formatBytes = (bytesStr?: string) => {
    if (!bytesStr) return "N/A";
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  // Formats backup file names nicely for output
  const cleanFilename = (fullName: string) => {
    return fullName.replace("Project_Emergence_", "");
  };

  // 1. SAVE PORTFOLIO CHRONICLES AS MARKDOWN
  const handleBackupChronicleMarkdown = async () => {
    if (!token) return;
    setActionLoading("chronicle");
    setErrorMsg(null);

    try {
      const timestampString = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `Chronicle_Portfolio_${timestampString}.md`;

      // Assembly representation
      let mdContent = `# Project Emergence — Chronicles & Professional Portfolio\n`;
      mdContent += `*Generated automatically on node coordinate ${telemetry?.node_id || "EMERGE-COORDINATOR-XX"}*\n\n`;
      mdContent += `## Port State Overview\n`;
      mdContent += `- **Coordinator Node ID:** \`${telemetry?.node_id || "Unidentified"}\`\n`;
      mdContent += `- **Channel Frequency:** ${telemetry?.frequency_hz || 0} Hz\n`;
      mdContent += `- **Vessels Registered:** ${telemetry?.active_vessels || 0}\n`;
      mdContent += `- **Registry Integrity:** SECURE // FULL ATLAS STANDBY\n\n`;

      mdContent += `## Chronicles Registry\n\n`;

      if (timeline.length === 0) {
        mdContent += `*No accomplishments logged in the database yet.*\n`;
      } else {
        mdContent += `| Date / Epoch | Channel & Source | Milestone Executive Summary |\n`;
        mdContent += `| --- | --- | --- |\n`;

        timeline.forEach((item) => {
          const dateString = new Date(item.timestamp * 1000).toLocaleString();
          mdContent += `| ${dateString} | **${item.source.toUpperCase()}** (${item.event_type}) | ${item.executive_summary} |\n`;
        });
      }

      await createDriveBackup(token, filename, "text/markdown", mdContent);
      onShowMessage(`Chronicle narrative archived safely to Google Drive as ${filename}!`);
      await fetchDriveFiles(token);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Backup export failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // 2. SAVE STATE AS JSON
  const handleBackupTelemetryJson = async () => {
    if (!token) return;
    setActionLoading("telemetry");
    setErrorMsg(null);

    try {
      const timestampString = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `Telemetry_Stream_${timestampString}.json`;

      const payload = {
        metadata: {
          exporter: "Autogenous Dev Console",
          timestamp_epoch: Math.floor(Date.now() / 1000),
          utc_time: new Date().toUTCString(),
        },
        system_parameters: telemetry || {},
        chronicles_count: timeline.length,
      };

      const jsonString = JSON.stringify(payload, null, 2);

      await createDriveBackup(token, filename, "application/json", jsonString);
      onShowMessage(`Hardware telemetry snapshot stored to Google Drive as ${filename}!`);
      await fetchDriveFiles(token);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`JSON snapshot failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // 3. DELETE BACKUP FILE
  const handleDeleteBackup = async (fileId: string, fileName: string) => {
    if (!token) return;
    
    // Explicit details to follow safety compliance
    const cleanName = cleanFilename(fileName);
    const confirmed = window.confirm(`Permanently delete the backup "${cleanName}" from your Google Drive? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteDriveFile(token, fileId);
      onShowMessage(`Backup "${cleanName}" deleted from Google Drive.`);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`File deletion aborted: ${err.message}`);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // 4. PREVIEW / DOWNLOAD FILE
  const handleDownloadFile = async (fileId: string, fileName: string) => {
    if (!token) return;
    try {
      const content = await getDriveFileContent(token, fileId);
      const cleanName = cleanFilename(fileName);
      
      // Native browser stream trigger
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = cleanName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      onShowMessage(`Downloaded: ${cleanName}`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Failed to retrieve file content: ${err.message}`);
    }
  };

  return (
    <div id="google-drive-panel" className="bg-cosmic-surface border border-cosmic-border rounded-xl p-6 relative overflow-hidden">
      
      {/* Dynamic Background Mesh Grid */}
      <div className="absolute right-0 top-0 h-40 w-40 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-900/50">
            {token ? (
              <CloudLightning className="h-5 w-5 text-indigo-400 animate-pulse" />
            ) : (
              <Cloud className="h-5 w-5 text-zinc-500" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 font-mono tracking-wider uppercase flex items-center gap-2">
              Autogenous Storage Interface Node <span className="text-[10px] bg-indigo-950 text-indigo-400 font-bold px-1.5 py-0.5 rounded border border-indigo-900/60 uppercase">Cloud Sync</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Preserve development coordinate logs & achievements off-node within your Google Drive block storage
            </p>
          </div>
        </div>

        {/* User Account Controls */}
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span>Checking network node...</span>
            </div>
          ) : token && user ? (
            <div className="flex items-center gap-3 bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-1.5 pl-3">
              <div className="flex items-center gap-2 text-xs">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="profile"
                    className="w-5 h-5 rounded-full border border-zinc-700 pointer-events-none"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-5 h-5 text-zinc-400 bg-zinc-800 rounded-full p-0.5" />
                )}
                <div className="font-mono text-left max-w-28 sm:max-w-40">
                  <p className="text-[11px] font-bold text-zinc-200 truncate leading-none mb-0.5">
                    {user.displayName || "Linked Node"}
                  </p>
                  <p className="text-[9px] text-indigo-400 truncate leading-none">
                    {user.email}
                  </p>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                title="Disconnect your Google Drive"
                className="p-1 px-2 rounded-md hover:bg-zinc-800 text-red-400 hover:text-red-300 transition-all text-xs font-mono flex items-center gap-1.5 cursor-pointer min-h-[36px]"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Disconnect</span>
              </button>
            </div>
          ) : (
            /* Sign in Material UI Block */
            <div className="flex items-center">
              <button
                onClick={handleSignIn}
                className="gsi-material-button text-xs transition-all cursor-pointer shadow-lg hover:shadow-indigo-500/10 min-h-[44px] flex items-center"
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper p-2 flex items-center gap-2">
                  <div className="gsi-material-button-icon bg-white p-1 rounded">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-4 w-4 block">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents font-mono text-zinc-300 hover:text-white px-1">Connect Drive</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Warning/Error Notice */}
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-950/30 border border-red-900/60 rounded-lg flex items-start gap-2 text-xs text-red-400 font-mono">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Control Panel */}
      {!token ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 border border-dashed border-zinc-800 rounded-lg text-center bg-zinc-950/20">
          <Lock className="h-8 w-8 text-zinc-650 mb-3 opacity-40" />
          <h4 className="text-xs font-mono font-medium text-zinc-300 uppercase tracking-widest mb-1.5">
            Drive Vault Locked
          </h4>
          <p className="text-xs text-zinc-500 max-w-sm font-sans line-clamp-2 md:line-clamp-none">
            Securely link your Google Drive network credentials using Chrome or Firebase Authentication popups to activate autogenous archives.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Action trigger columns (Left) */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-xs font-mono uppercase text-zinc-400 tracking-wider font-semibold mb-2">Backups Operations</h3>

            <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 hover:border-zinc-800 transition-all flex flex-col justify-between min-h-36">
              <div>
                <h4 className="text-xs font-mono font-bold text-zinc-200 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-blue-400" /> EXPORT CHRONICLES (.MD)
                </h4>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Synthesizes the complete live portfolio timeline entries into a clean Markdown table, ideal for writing platforms, local backup, or code repositories.
                </p>
              </div>
              <button
                onClick={handleBackupChronicleMarkdown}
                disabled={actionLoading !== null}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white font-mono text-xs py-2 rounded-lg font-bold flex items-center justify-center gap-2 cursor-pointer transition-all min-h-[44px]"
              >
                {actionLoading === "chronicle" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Packaging chronicles document...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Archive Chronicles to Drive
                  </>
                )}
              </button>
            </div>

            <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 hover:border-zinc-800 transition-all flex flex-col justify-between min-h-36">
              <div>
                <h4 className="text-xs font-mono font-bold text-zinc-200 flex items-center gap-1.5">
                  <FileJson className="h-3.5 w-3.5 text-amber-500" /> EXPORT TELEMETRY CONFIG (.JSON)
                </h4>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Takes a high-definition JSON registry structured layout of physical node properties (frequency, coordinative limits) of the live system for restore.
                </p>
              </div>
              <button
                onClick={handleBackupTelemetryJson}
                disabled={actionLoading !== null}
                className="mt-4 w-full bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 text-white font-mono text-xs py-2 rounded-lg font-bold flex items-center justify-center gap-2 cursor-pointer transition-all min-h-[44px]"
              >
                {actionLoading === "telemetry" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating telemetry JSON node...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4" />
                    Save Telemetry Snapshot
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Drive file list index columns (Right) */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-mono uppercase text-zinc-400 tracking-wider font-semibold">
                Google Drive Vault Backup Files ({files.length})
              </h3>
              <button
                type="button"
                onClick={() => fetchDriveFiles(token!)}
                className="text-[10px] uppercase font-mono text-indigo-400 hover:text-indigo-300 cursor-pointer min-h-[30px]"
              >
                Refresh Inventory
              </button>
            </div>

            <div className="border border-zinc-900 rounded-xl overflow-hidden bg-black/60 flex-grow min-h-60 max-h-[340px] overflow-y-auto">
              {files.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-600">
                  <History className="h-8 w-8 opacity-30 mb-2" />
                  <p className="text-xs font-mono uppercase">Inventory is Empty</p>
                  <p className="text-[10px] text-zinc-500 max-w-xs mt-1">
                    No Project Emergence backup files identified in your Google Drive account yet.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-900 font-mono">
                  {files.map((file) => {
                    const isJson = file.mimeType.includes("json");
                    return (
                      <div
                        key={file.id}
                        className="group flex items-center justify-between p-3 px-4 hover:bg-zinc-900/40 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {isJson ? (
                            <FileJson className="h-4 w-4 text-amber-500 shrink-0" />
                          ) : (
                            <FileText className="h-4 w-4 text-blue-400 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <h4
                              title={file.name}
                              className="text-xs font-bold text-zinc-200 truncate pr-2 max-w-[180px] sm:max-w-[280px]"
                            >
                              {cleanFilename(file.name)}
                            </h4>
                            <div className="flex items-center gap-2.5 text-[10px] text-zinc-500 mt-1">
                              <span className="flex items-center gap-1 shrink-0">
                                <Clock className="h-3 w-3" />
                                {new Date(file.createdTime).toLocaleString([], {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <span className="text-zinc-700 shrink-0">|</span>
                              <span className="shrink-0">{formatBytes(file.size)}</span>
                            </div>
                          </div>
                        </div>

                        {/* File Action Controls (Supports Touch & Click feedback) */}
                        <div className="flex items-center gap-1 bg-zinc-950/60 sm:opacity-0 group-hover:opacity-100 border border-zinc-900 sm:border-transparent rounded-lg p-0.5 transition-opacity">
                          <button
                            onClick={() => handleDownloadFile(file.id, file.name)}
                            title="Download backup payload"
                            className="p-1 px-2 rounded hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-all text-[10px] font-bold flex items-center gap-1.5 cursor-pointer min-h-[36px]"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteBackup(file.id, file.name)}
                            title="Prune backup node"
                            className="p-1 px-2 rounded hover:bg-red-950/40 text-red-500 hover:text-red-400 font-bold cursor-pointer transition-all min-h-[36px]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
