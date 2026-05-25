import React from "react";
import { Terminal, Copy, Check, FileCode, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

export default function ArchitecturalInstructions() {
  const [openSection, setOpenSection] = React.useState<"watcher" | "gh-action" | null>(null);
  const [copiedSection, setCopiedSection] = React.useState<string | null>(null);

  const toggleSection = (sec: "watcher" | "gh-action") => {
    if (openSection === sec) {
      setOpenSection(null);
    } else {
      setOpenSection(sec);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const watcherCode = `import os
import time
import google.generativeai as genai
from pymongo import MongoClient
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# --- CONFIGURATION (Load from environment or set directly) ---
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://<user>:<password>@cluster.mongodb.net/")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "your_google_ai_studio_api_key")
WATCH_DIRECTORY = "./project_emergence_canon"  # Folder containing .md drafts

# --- SYSTEM INITIALIZATION ---
genai.configure(api_key=GEMINI_API_KEY)
mongo_client = MongoClient(MONGO_URI)
db = mongo_client["portfolio"]

class MarkdownFileHandler(FileSystemEventHandler):
    def on_modified(self, event):
        if event.is_directory or not (event.src_path.endswith('.md') or event.src_path.endswith('.txt')):
            return
            
        filename = os.path.basename(event.src_path)
        print(f"[*] Change detected in: {filename}. Intercepting file save...")
        time.sleep(1) # Allow file write buffer to settle
        
        try:
            with open(event.src_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            word_count = len(content.split())
            preview_snippet = content[:800] # Use first 800 chars as context
            
            # Direct Call to Google AI Studio Gemini API
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = f"Identify as the Chronicler Vessel. Translate this raw writing update into a polished professional milestone. Source: narrative | File: {filename} | Word Count: {word_count} | Snippet: {preview_snippet}"
            
            response = model.generate_content(prompt)
            executive_summary = response.text.strip()
            
            # Package and Push straight to MongoDB Atlas
            chronicle_entry = {
                "timestamp": int(time.time()),
                "source": "narrative",
                "event_type": "file_save",
                "raw_payload": {
                    "filename": filename,
                    "word_count": word_count
                },
                "executive_summary": executive_summary
            }
            db["chronicle_stream"].insert_one(chronicle_entry)
            print(f"[+] Synced to MongoDB. Summary: '{executive_summary}'\\n")
        except Exception as e:
            print(f"[X] Execution failed: {str(e)}")

# Observer Loop Setup
if __name__ == "__main__":
    event_handler = MarkdownFileHandler()
    observer = Observer()
    observer.schedule(event_handler, path=WATCH_DIRECTORY, recursive=True)
    print(f"[▶] Ingestion engine monitoring: {WATCH_DIRECTORY}")
    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()`;

  const githubActionCode = `name: Autogenous Portfolio Sync (Code Commits)

on:
  push:
    branches:
      - main

jobs:
  sync-chronicle:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Codebase
        uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Setup Python Runtime
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install Dependencies
        run: |
          pip install google-generativeai pymongo

      - name: Run Chronicler Compilation
        env:
          GEMINI_API_KEY: \${{ secrets.GEMINI_API_KEY }}
          MONGO_URI: \${{ secrets.MONGO_URI }}
        run: |
          python - <<EOF
          import os
          import sys
          import subprocess
          import time
          import google.generativeai as genai
          from pymongo import MongoClient

          try:
              commit_msg = subprocess.check_output(["git", "log", "-1", "--pretty=%B"]).decode("utf-8").strip()
              diff_summary = subprocess.check_output(["git", "diff", "--stat", "HEAD~1", "HEAD"]).decode("utf-8").strip()
          except Exception as e:
              print(f"Error fetching Git metadata: {e}")
              sys.exit(0)

          if "[nosync]" in commit_msg:
              print("Bypassing sync via keyword request.")
              sys.exit(0)

          genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
          mongo_client = MongoClient(os.getenv("MONGO_URI"))
          db = mongo_client["portfolio"]

          model = genai.GenerativeModel('gemini-1.5-flash')
          prompt = f"Identify as the Chronicler Vessel. Translate this codebase update into a professional engineering accomplishment. Source: git | Commit Message: {commit_msg} | File changes: {diff_summary}"
          
          try:
              response = model.generate_content(prompt)
              summary = response.text.strip()

              db["chronicle_stream"].insert_one({
                  "timestamp": int(time.time()),
                  "source": "git",
                  "event_type": "push",
                  "raw_payload": {
                      "commit_message": commit_msg,
                      "file_stats": diff_summary
                  },
                  "executive_summary": summary
              })
              print(f"Successfully posted update: {summary}")
          except Exception as e:
              print(f"API pipeline bottleneck: {e}")
          EOF`;

  return (
    <div className="bg-cosmic-surface border border-cosmic-border rounded-xl p-6 relative">
      <div className="flex items-center gap-2 mb-4">
        <Terminal className="h-5 w-5 text-indigo-400" />
        <h3 className="font-semibold text-zinc-100 font-mono text-sm uppercase tracking-wider">
          External Pipeline Configuration Daemon Blueprint
        </h3>
      </div>
      
      <p className="text-xs text-zinc-400 font-sans leading-relaxed mb-4">
        Deploy these automated agents on your local dev workspace or within your remote GitHub repositories. They capture raw events, translate them through the Chronicler model thread, and write straight to your live database portfolio.
      </p>

      <div className="space-y-3">
        {/* Watcher.py Segment */}
        <div className="border border-zinc-900 rounded-lg overflow-hidden bg-black/40">
          <button
            onClick={() => toggleSection("watcher")}
            className="w-full px-4 py-3 bg-zinc-950 flex items-center justify-between text-xs font-mono text-zinc-300 hover:text-white transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-blue-500" />
              <span>1. LOCAL FILE DEAMON: watcher.py (Python)</span>
            </div>
            {openSection === "watcher" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {openSection === "watcher" && (
            <div className="p-4 border-t border-zinc-900 bg-zinc-950/80">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-zinc-500 font-mono">MONITORS LOCAL DIRECTORY & CALLS API</span>
                <button
                  type="button"
                  onClick={() => handleCopy(watcherCode, "watcher")}
                  className="px-2 py-1 flex items-center gap-1.5 rounded bg-zinc-900 text-[10px] font-mono hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  {copiedSection === "watcher" ? (
                    <>
                      <Check className="h-3 w-3 text-green-400" />
                      Copied Script!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy Code
                    </>
                  )}
                </button>
              </div>
              <pre className="text-[11px] font-mono text-zinc-400 overflow-auto max-h-80 bg-black/90 p-3 rounded border border-zinc-900 block leading-relaxed scrollbar-thin">
                {watcherCode}
              </pre>
            </div>
          )}
        </div>

        {/* GitHub Workflows Segment */}
        <div className="border border-zinc-900 rounded-lg overflow-hidden bg-black/40">
          <button
            onClick={() => toggleSection("gh-action")}
            className="w-full px-4 py-3 bg-zinc-950 flex items-center justify-between text-xs font-mono text-zinc-300 hover:text-white transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-purple-500" />
              <span>2. GITHUB ACTION: chronicle-push.yml (YAML)</span>
            </div>
            {openSection === "gh-action" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {openSection === "gh-action" && (
            <div className="p-4 border-t border-zinc-900 bg-zinc-950/80">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-zinc-500 font-mono">AUTOMATED WORKFLOW TRIGGER ON PUSH BRANCH</span>
                <button
                  type="button"
                  onClick={() => handleCopy(githubActionCode, "gh")}
                  className="px-2 py-1 flex items-center gap-1.5 rounded bg-zinc-900 text-[10px] font-mono hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  {copiedSection === "gh" ? (
                    <>
                      <Check className="h-3 w-3 text-green-400" />
                      Copied YAML!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy Code
                    </>
                  )}
                </button>
              </div>
              <pre className="text-[11px] font-mono text-zinc-400 overflow-auto max-h-80 bg-black/90 p-3 rounded border border-zinc-900 block leading-relaxed scrollbar-thin">
                {githubActionCode}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
