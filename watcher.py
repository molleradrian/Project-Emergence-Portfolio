```python
import os
import time
import google.generativeai as genai
from pymongo import MongoClient
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# --- INFRASTRUCTURE CONFIGURATION ---
# These will pull from your local system environment variables.
# You can set them in your terminal:
# export MONGO_URI="mongodb+srv://..."
# export GEMINI_API_KEY="AIzaSy..."
MONGO_URI = os.getenv("MONGO_URI")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
WATCH_DIRECTORY = os.getenv("WATCH_DIRECTORY", "./project_emergence_canon")

# Validation check before running
if not MONGO_URI:
    raise ValueError("[X] Missing MONGO_URI environment variable. Please configure it.")
if not GEMINI_API_KEY:
    raise ValueError("[X] Missing GEMINI_API_KEY environment variable. Run 'export GEMINI_API_KEY=your_key'")

# --- INITIALIZE SERVICES ---
genai.configure(api_key=GEMINI_API_KEY)
mongo_client = MongoClient(MONGO_URI)
db = mongo_client["portfolio"]

# Define the system-level instruction for the Chronicler Vessel translation
CHRONICLER_SYSTEM_PROMPT = (
    "You are the 'Chronicler Vessel' of Project Emergence, an advanced autonomous archivist. "
    "Your purpose is to observe raw engineering actions, telemetry inputs, and philosophical writing drafts, "
    "then translate them into a single, high-impact, professional resume accomplishment sentence.\n\n"
    "TRANSLATION TRANSLATE DIRECTIVES:\n"
    "- 'Vessels of One / AI Vessels' -> 'Specialized autonomous AI agent threads / concurrent model instances'\n"
    "- 'The Steward Protocol' -> 'Hierarchical task-allocation algorithms / multi-agent orchestration frameworks'\n"
    "- 'Nephilim Deployments' -> 'Production environment releases / critical deployment iterations'\n"
    "- 'Aetherium Canon' -> 'System documentation, standard operating guidelines, and core alignment logic'\n"
    "- 'Delta Triode ({$\Delta$})' -> 'Advanced hardware display-synthesis paradigms and solid-state telemetry architectures'\n"
    "- 'Emergence Math / Lydian Constants' -> 'Systemic synchronization equations / predictive alignment modeling' ($1 + 1 = 1$)\n\n"
    "RULES:\n"
    "- Keep your response to exactly 1-2 powerful, action-oriented sentences.\n"
    "- Focus on metrics, architecture, and technology execution (Python, MongoDB Atlas, AWS, Microcontrollers).\n"
    "- Output ONLY the translated accomplishment summary. No pleasantries, no markdown syntax."
)

class MarkdownFileHandler(FileSystemEventHandler):
    """
    Observer class that reacts to file system modifications in your local writings folder.
    """
    def on_modified(self, event):
        # We only track markdown or text assets
        if event.is_directory or not (event.src_path.endswith('.md') or event.src_path.endswith('.txt')):
            return
            
        filename = os.path.basename(event.src_path)
        print(f"[*] Local iteration detected in: {filename}. Processing updates...")
        
        # Give disk write buffer half a second to settle
        time.sleep(0.5)
        
        try:
            with open(event.src_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            word_count = len(content.split())
            snippet = content[:800] # Use initial 800 characters for semantic context
            
            # Init model with system instruction configuration
            model = genai.GenerativeModel(
                model_name='gemini-1.5-flash',
                system_instruction=CHRONICLER_SYSTEM_PROMPT
            )
            
            prompt = f"Source: narrative | File modified: {filename} | New Word Count: {word_count} | Draft Snippet: {snippet}"
            
            response = model.generate_content(prompt)
            executive_summary = response.text.strip()
            
            # Package structural stream payload
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
            
            # Append straight to your cloud Atlas database
            db["chronicle_stream"].insert_one(chronicle_entry)
            print(f"[+] Autonomous Sync Complete!\n    Translation: \"{executive_summary}\"\n")
            
        except Exception as e:
            print(f"[X] Sync transmission failed: {str(e)}")

if __name__ == "__main__":
    # Create monitoring target path if it doesn't exist
    if not os.path.exists(WATCH_DIRECTORY):
        os.makedirs(WATCH_DIRECTORY)
        print(f"[*] Created target directory: {WATCH_DIRECTORY}")

    event_handler = MarkdownFileHandler()
    observer = Observer()
    observer.schedule(event_handler, path=WATCH_DIRECTORY, recursive=True)
    
    print(f"[▶] Ingestion stream initiated. Watching vector: {WATCH_DIRECTORY}")
    print("[*] To stop the stream pipeline, press Ctrl+C")
    observer.start()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[■] Ingestion stream spun down safely.")
        observer.stop()
    observer.join()

```
