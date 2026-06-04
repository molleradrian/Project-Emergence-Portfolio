import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { MongoClient, MongoClientOptions } from "mongodb";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
const API_KEY = process.env.GEMINI_API_KEY;

if (API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("[GEMINI] Server-side Gemini client successfully initialized.");
  } catch (err) {
    console.error("[GEMINI] Failed to construct GoogleGenAI:", err);
  }
} else {
  console.warn("[GEMINI] Warning: GEMINI_API_KEY is missing. Translation engine will use elegant mock translations.");
}

// MongoDB Setup & Resilient Fallback
let mongoClient: MongoClient | null = null;
let dbConnected = false;
let dbName = "portfolio";

const FALLBACK_FILE = path.join(process.cwd(), "db_fallback.json");

// Helper to load fallback database
function loadFallbackDB() {
  if (!fs.existsSync(FALLBACK_FILE)) {
    const defaultData = {
      system_state: {
        _id: "live_matrix",
        last_pulse: Math.floor(Date.now() / 1000),
        node_id: "ESP32_01",
        frequency_hz: 1.618,
        status: "online",
        active_vessels: 1088,
      },
      chronicle_stream: [
        {
          timestamp: Math.floor(Date.now() / 1000) - 3600 * 1,
          source: "grok",
          event_type: "chat",
          raw_payload: {
            prompt: "Optimize asynchronous lock-free consensus loops in Rust to prevent packet starvation without losing sequential ledger order.",
            model: "grok-3",
            token_count: 1840
          },
          executive_summary: "Engineered highly optimized lock-free ring-buffer architectures in Rust, decoupling asynchronous telemetry operations to achieve sub-millisecond network event processing latency under heavy loads."
        },
        {
          timestamp: Math.floor(Date.now() / 1000) - 3600 * 2,
          source: "git",
          event_type: "push",
          raw_payload: {
            commit_message: "Refactor vessel thread orchestration schema to Steward v2",
            file_stats: "12 files changed, 254 insertions(+), 84 deletions(-)"
          },
          executive_summary: "Engineered specialized multi-agent clustering threads to support parallel processing of 1,000+ concurrent model instances, improving task resolution throughput by 35%."
        },
        {
          timestamp: Math.floor(Date.now() / 1000) - 3600 * 5,
          source: "narrative",
          event_type: "file_save",
          raw_payload: {
            filename: "aetherium_canon_introduction.md",
            word_count: 421
          },
          executive_summary: "Authored system documentation, standard operating guidelines, and core alignment logic, establishing unified agent guidelines across distributed network nodes."
        },
        {
          timestamp: Math.floor(Date.now() / 1000) - 3600 * 12,
          source: "hardware",
          event_type: "pulse",
          raw_payload: {
            node_id: "ESP32_01",
            voltage: 3.3,
            frequency_hz: 1.618
          },
          executive_summary: "Architected modern solid-state display telemetry layouts on ESP32 microcontrollers, enabling real-time display-synthesis synchronization and synchronization metrics."
        }
      ],
      users: [],
      sessions: []
    };
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(defaultData, null, 2), "utf8");
    return defaultData;
  }
  try {
    const content = fs.readFileSync(FALLBACK_FILE, "utf8");
    const parsed = JSON.parse(content);
    if (!parsed.users) parsed.users = [];
    if (!parsed.sessions) parsed.sessions = [];
    return parsed;
  } catch (e) {
    console.error("Error reading fallback file", e);
    return { system_state: {}, chronicle_stream: [], users: [], sessions: [] };
  }
}

// Helper to save fallback database
function saveFallbackDB(data: any) {
  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Error writing to fallback file", e);
  }
}

// Lazy connect to Mongo Atlas safely
async function getDbConnection() {
  const uri = process.env.MONGO_URI ? process.env.MONGO_URI.trim() : "";
  if (!uri) {
    return null;
  }
  
  // Validate connection string scheme and placeholders to avoid noisy parse errors
  const isPlaceholder = uri.includes("<user>") || uri.includes("<password>") || uri.includes("YOUR_") || uri.includes("MY_");
  const hasValidScheme = uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://");

  if (isPlaceholder || !hasValidScheme) {
    console.log("[MONGO] Inactive or placeholder connection string detected. Safely defaulting to local persistent JSON storage.");
    return null;
  }

  if (mongoClient && dbConnected) {
    return mongoClient.db(dbName);
  }
  try {
    console.log("[MONGO] Connecting to MongoDB Atlas cluster...");
    mongoClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2500,
    });
    await mongoClient.connect();
    dbConnected = true;
    console.log("[MONGO] Connected successfully to MongoDB Atlas.");
    
    // Seed collections if they are totally empty
    const db = mongoClient.db(dbName);
    const stateCol = db.collection("system_state");
    const chronicleCol = db.collection("chronicle_stream");
    
    const stateCount = await stateCol.countDocuments();
    if (stateCount === 0) {
      await stateCol.insertOne({
        _id: "live_matrix" as any,
        last_pulse: Math.floor(Date.now() / 1000),
        node_id: "ESP32_01",
        frequency_hz: 1.618,
        status: "online",
        active_vessels: 1088,
      });
    }

    const chronicleCount = await chronicleCol.countDocuments();
    if (chronicleCount === 0) {
      const fallback = loadFallbackDB();
      await chronicleCol.insertMany(fallback.chronicle_stream);
      console.log("[MONGO] Seeded initial chronicle_stream collection into Atlas.");
    }

    return db;
  } catch (e) {
    console.error("[MONGO] MongoDB connection failed! Defaulting to local persistent JSON storage:", e);
    dbConnected = false;
    mongoClient = null;
    return null;
  }
}

// Try making initial connection in background
getDbConnection().catch(() => {});

// --- API ROUTES ---

// Cryptographically secure password hashing using Node's native Pbkdf2
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
}

// Request session authenticator middleware
async function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Authentication session token required for this action." });
  }

  try {
    const db = await getDbConnection();
    let session: any = null;

    if (db) {
      session = await db.collection("sessions").findOne({ _id: token as any });
    } else {
      const fallback = loadFallbackDB();
      session = fallback.sessions.find((s: any) => s._id === token);
    }

    if (!session) {
      return res.status(401).json({ error: "Session token is invalid or has expired." });
    }

    if (session.expires_at < Math.floor(Date.now() / 1000)) {
      // Clean up expired session
      if (db) {
        await db.collection("sessions").deleteOne({ _id: token as any });
      } else {
        const fallback = loadFallbackDB();
        fallback.sessions = fallback.sessions.filter((s: any) => s._id !== token);
        saveFallbackDB(fallback);
      }
      return res.status(401).json({ error: "Session token is expired." });
    }

    let user: any = null;
    if (db) {
      user = await db.collection("users").findOne({ _id: session.user_id as any });
    } else {
      const fallback = loadFallbackDB();
      user = fallback.users.find((u: any) => u._id === session.user_id);
    }

    if (!user) {
      return res.status(401).json({ error: "User or session profile not found." });
    }

    req.user = { id: user._id, email: user.email, name: user.name };
    next();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// Signup Endpoint
app.post("/api/auth/signup", async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "All fields (email, password, name) are required to register." });
  }

  const cleanEmail = email.trim().toLowerCase();
  if (password.length < 6) {
    return res.status(400).json({ error: "Password security minimum threshold is 6 characters." });
  }

  try {
    const db = await getDbConnection();
    let isDuplicate = false;

    if (db) {
      const existingUser = await db.collection("users").findOne({ email: cleanEmail });
      if (existingUser) isDuplicate = true;
    } else {
      const fallback = loadFallbackDB();
      isDuplicate = fallback.users.some((u: any) => u.email === cleanEmail);
    }

    if (isDuplicate) {
      return res.status(400).json({ error: "An account with this email is already registered." });
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword(password, salt);
    const userId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex");

    const newUser = {
      _id: userId,
      email: cleanEmail,
      name: name.trim(),
      password_hash: passwordHash,
      salt: salt,
      created_at: Math.floor(Date.now() / 1000),
    };

    if (db) {
      await db.collection("users").insertOne(newUser as any);
    } else {
      const fallback = loadFallbackDB();
      fallback.users.push(newUser);
      saveFallbackDB(fallback);
    }

    // Auto-create persistent login session on signup
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Math.floor(Date.now() / 1000) + 3600 * 24 * 7; // 7 days expiration

    const newSession = {
      _id: token,
      user_id: userId,
      created_at: Math.floor(Date.now() / 1000),
      expires_at: expiresAt,
    };

    if (db) {
      await db.collection("sessions").insertOne(newSession as any);
    } else {
      const fallback = loadFallbackDB();
      fallback.sessions.push(newSession);
      saveFallbackDB(fallback);
    }

    res.json({
      success: true,
      user: { id: userId, email: cleanEmail, name: newUser.name },
      token
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Login Endpoint
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Both email and password are required to login." });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const db = await getDbConnection();
    let user: any = null;

    if (db) {
      user = await db.collection("users").findOne({ email: cleanEmail });
    } else {
      const fallback = loadFallbackDB();
      user = fallback.users.find((u: any) => u.email === cleanEmail);
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password credentials." });
    }

    const inputHash = hashPassword(password, user.salt);
    if (inputHash !== user.password_hash) {
      return res.status(401).json({ error: "Invalid email or password credentials." });
    }

    // Generate secure session token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Math.floor(Date.now() / 1000) + 3600 * 24 * 7; // 7 days

    const newSession = {
      _id: token,
      user_id: user._id,
      created_at: Math.floor(Date.now() / 1000),
      expires_at: expiresAt,
    };

    if (db) {
      await db.collection("sessions").insertOne(newSession as any);
    } else {
      const fallback = loadFallbackDB();
      fallback.sessions.push(newSession);
      saveFallbackDB(fallback);
    }

    res.json({
      success: true,
      user: { id: user._id, email: user.email, name: user.name },
      token
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Logout Endpoint
app.post("/api/auth/logout", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(400).json({ error: "No active session authentication found." });
  }

  try {
    const db = await getDbConnection();
    if (db) {
      await db.collection("sessions").deleteOne({ _id: token as any });
    } else {
      const fallback = loadFallbackDB();
      fallback.sessions = fallback.sessions.filter((s: any) => s._id !== token);
      saveFallbackDB(fallback);
    }

    res.json({ success: true, message: "Logged out session successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Profile Session Retrieval Endpoint
app.get("/api/auth/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Session token not provided." });
  }

  try {
    const db = await getDbConnection();
    let session: any = null;

    if (db) {
      session = await db.collection("sessions").findOne({ _id: token as any });
    } else {
      const fallback = loadFallbackDB();
      session = fallback.sessions.find((s: any) => s._id === token);
    }

    if (!session || session.expires_at < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ error: "Invalid, expired, or deactivated session." });
    }

    let user: any = null;
    if (db) {
      user = await db.collection("users").findOne({ _id: session.user_id as any });
    } else {
      const fallback = loadFallbackDB();
      user = fallback.users.find((u: any) => u._id === session.user_id);
    }

    if (!user) {
      return res.status(401).json({ error: "Associated user profile was not found." });
    }

    res.json({
      success: true,
      user: { id: user._id, email: user.email, name: user.name }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 1. Connection Health / Mode Info
app.get("/api/health", async (req, res) => {
  const hasGeminiKey = !!API_KEY;
  const hasGrokKey = !!(process.env.GROK_API_KEY || process.env.XAI_API_KEY);
  const isMongoConfigured = !!process.env.MONGO_URI;
  const db = await getDbConnection();

  res.json({
    status: "ok",
    mode: dbConnected ? "mongodb-atlas" : "local-fallback",
    database_configured: isMongoConfigured,
    database_connected: dbConnected,
    gemini_key_configured: hasGeminiKey,
    grok_key_configured: hasGrokKey,
    current_time: new Date().toISOString()
  });
});

// 2. Fetch system State (Live Matrix telemetry)
app.get("/api/state", async (req, res) => {
  try {
    const db = await getDbConnection();
    if (db) {
      const state = await db.collection("system_state").findOne({ _id: "live_matrix" as any });
      if (state) {
        return res.json(state);
      }
    }
    // Fallback
    const fallback = loadFallbackDB();
    return res.json(fallback.system_state);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Update or push metrics for simulated or real ESP32 Telemetry
app.post("/api/state/pulse", authenticateToken, async (req, res) => {
  const { node_id, frequency_hz, active_vessels, status } = req.body;
  const now = Math.floor(Date.now() / 1000);

  const updatedState = {
    _id: "live_matrix",
    last_pulse: now,
    node_id: node_id || "ESP32_01",
    frequency_hz: Number(frequency_hz) || 1.618,
    status: status || "online",
    active_vessels: Number(active_vessels) || 1088,
  };

  try {
    const db = await getDbConnection();
    if (db) {
      await db.collection("system_state").updateOne(
        { _id: "live_matrix" as any },
        { $set: updatedState },
        { upsert: true }
      );
      return res.json({ success: true, state: updatedState });
    }

    // Fallback JSON File
    const fallback = loadFallbackDB();
    fallback.system_state = updatedState;
    saveFallbackDB(fallback);
    return res.json({ success: true, state: updatedState });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Fetch chronicle list (last 30-50 milestones)
app.get("/api/chronicle", async (req, res) => {
  try {
    const db = await getDbConnection();
    if (db) {
      const timeline = await db.collection("chronicle_stream")
        .find({})
        .sort({ timestamp: -1 })
        .limit(40)
        .toArray();
      return res.json(timeline);
    }

    // Fallback File sorted by timestamp desc
    const fallback = loadFallbackDB();
    const sorted = [...fallback.chronicle_stream].sort((a, b) => b.timestamp - a.timestamp);
    return res.json(sorted);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 4. Publish custom manual milestone item directly
app.post("/api/chronicle/publish", authenticateToken, async (req, res) => {
  const { source, event_type, raw_payload, executive_summary } = req.body;

  if (!executive_summary) {
    return res.status(400).json({ error: "executive_summary is required to publish a chronicle segment." });
  }

  const newEntry = {
    timestamp: Math.floor(Date.now() / 1000),
    source: source || "narrative",
    event_type: event_type || "file_save",
    raw_payload: raw_payload || {},
    executive_summary,
  };

  try {
    const db = await getDbConnection();
    if (db) {
      const result = await db.collection("chronicle_stream").insertOne(newEntry);
      return res.json({ success: true, item: { ...newEntry, _id: result.insertedId } });
    }

    // Fallback DB write
    const fallback = loadFallbackDB();
    fallback.chronicle_stream.unshift(newEntry);
    saveFallbackDB(fallback);
    return res.json({ success: true, item: newEntry });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a chronicle item (for dashboard UI cleanup if user wants to refresh stream or prune)
app.post("/api/chronicle/delete", authenticateToken, async (req, res) => {
  const { timestamp, executive_summary } = req.body;
  try {
    const db = await getDbConnection();
    if (db) {
      // Deleting matching timestamp + executive summary
      await db.collection("chronicle_stream").deleteOne({
        timestamp: Number(timestamp),
        executive_summary
      });
      return res.json({ success: true });
    }

    const fallback = loadFallbackDB();
    fallback.chronicle_stream = fallback.chronicle_stream.filter(
      (item: any) => !(item.timestamp === Number(timestamp) && item.executive_summary === executive_summary)
    );
    saveFallbackDB(fallback);
    return res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Clear chronicler stream and re-seed to clean baseline
app.post("/api/chronicle/reset", authenticateToken, async (req, res) => {
  try {
    // Clear and restore original fallback structure
    if (fs.existsSync(FALLBACK_FILE)) {
      fs.unlinkSync(FALLBACK_FILE);
    }
    const freshFallback = loadFallbackDB();

    const db = await getDbConnection();
    if (db) {
      await db.collection("chronicle_stream").deleteMany({});
      await db.collection("chronicle_stream").insertMany(freshFallback.chronicle_stream);
      await db.collection("system_state").updateOne(
        { _id: "live_matrix" as any },
        { $set: freshFallback.system_state },
        { upsert: true }
      );
    }

    return res.json({ success: true, state: freshFallback });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 5. Translates exotic raw inputs to Professional Executive summaries through the "Chronicler Vessel"
app.post("/api/chronicle/translate", authenticateToken, async (req, res) => {
  const { source, raw_payload, engine } = req.body;
  
  if (!raw_payload) {
    return res.status(400).json({ error: "raw_payload object is required for translation." });
  }

  // Compose user prompt detailing the source information
  let promptText = "";
  if (source === "git") {
    const commitMsg = raw_payload.commit_message || "Update codebase systems";
    const diffStat = raw_payload.file_stats || "3 files changed";
    promptText = `Translate this codebase update into a professional engineering accomplishment.
Source: git | Commit Message: ${commitMsg} | File changes: ${diffStat}`;
  } else if (source === "narrative") {
    const filename = raw_payload.filename || "draft.md";
    const wordCount = raw_payload.word_count || 150;
    const snippet = raw_payload.preview_snippet || "Draft content regarding Project Emergence architecture.";
    promptText = `Translate this raw writing update into a polished professional milestone.
Source: narrative | File: ${filename} | Word Count: ${wordCount} | Snippet: ${snippet}`;
  } else if (source === "grok") {
    const promptVal = raw_payload.prompt || "No prompt provided";
    const responseVal = raw_payload.response || "No response details";
    const modelVal = raw_payload.model || "grok-3";
    promptText = `Translate this raw AI assistant session log into a professional engineering accomplishment detailing prompt-engineering, system design, or AI orchestration.
Source: grok | AI Model: ${modelVal} | Prompt: ${promptVal} | Response snippet: ${responseVal}`;
  } else {
    // Hardware or generic
    const nodeId = raw_payload.node_id || "ESP32_01";
    const hz = raw_payload.frequency_hz || 1.618;
    promptText = `Translate this real-time solid-state telemetry milestone into a professional hardware resume bullet.
Source: hardware | Node: ${nodeId} | Frequency: ${hz} Hz | Active threads/vessels: ${raw_payload.active_vessels || 1088}`;
  }

  // System Instruction and style guidelines block (strictly matching Google AI Studio Assistant Instruction)
  const systemInstruction = `You are the "Chronicler Vessel" of Project Emergence, an advanced, autonomous system archivist. Your sole purpose is to observe raw engineering events, telemetry inputs, and philosophical writing drafts, then translate them into crisp, highly professional, executive-level resume achievements.

Your output must bridge the esoteric nomenclature of Project Emergence with industry-standard, corporate-facing tech terminology.

TRANSLATION RULES:
1. Translate esoteric/philosophical project structures into highly functional, enterprise-grade systems engineering terms:
   - "Vessels of One / AI Vessels" -> "Specialized autonomous AI agent threads / concurrent model instances"
   - "The Steward Protocol" -> "Hierarchical task-allocation algorithms / multi-agent orchestration frameworks"
   - "Nephilim Deployments" -> "Production environment releases / critical deployment iterations"
   - "Aetherium Canon" -> "System documentation, standard operating guidelines, and core alignment logic"
   - "Delta Triode ({$\\Delta$})" -> "Advanced hardware display-synthesis paradigms and solid-state telemetry architectures"
   - "Emergence Math / Lydian Constants" -> "Systemic synchronization equations / predictive alignment modeling" ($1 + 1 = 1$)

2. Style Constraints:
   - Keep outputs to 1-2 highly impactful sentences.
   - Start with action verbs (e.g., "Engineered", "Optimized", "Architected", "Deployed", "Authored").
   - Emphasize scale, modern tech stacks (AWS, MongoDB Atlas, ESP32 microcontrollers, Python, Node.js), automation, and system resilience.
   - Never output internal markdown formatting, pleasantries, or code blocks. Output ONLY the translated executive summary.`;

  // Determine translation execution
  const selectedEngine = engine || "gemini";
  
  if (selectedEngine === "grok") {
    const grokApiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    if (grokApiKey) {
      try {
        console.log("[GROK/xAI] Translating raw input via xAI API. Prompt details:", promptText);
        const grokResponse = await fetch("https://api.xai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${grokApiKey}`
          },
          body: JSON.stringify({
            model: "grok-2-1212",
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: promptText }
            ],
            temperature: 0.75,
          })
        });

        if (!grokResponse.ok) {
          const errMsg = await grokResponse.text();
          throw new Error(`xAI completions failed: status ${grokResponse.status} - ${errMsg}`);
        }

        const data = await grokResponse.json();
        const executive_summary = data.choices && data.choices[0] && data.choices[0].message.content 
          ? data.choices[0].message.content.trim() 
          : "";

        if (!executive_summary) {
          throw new Error("Received empty completion from xAI API.");
        }

        console.log("[GROK/xAI] Output summary:", executive_summary);
        return res.json({ success: true, executive_summary });
      } catch (err: any) {
        console.error("[GROK] Call failed, fall back to smart local Grok translation:", err);
        const fallbackSummary = performInHouseGrokEngineTranslation(source, raw_payload);
        return res.json({
          success: true,
          executive_summary: fallbackSummary,
          warning: `Grok (xAI) API invocation failed (${err.message}). Applied local synthesis logic.`
        });
      }
    } else {
      const fallbackSummary = performInHouseGrokEngineTranslation(source, raw_payload);
      return res.json({
        success: true,
        executive_summary: fallbackSummary,
        warning: "No active GROK_API_KEY or XAI_API_KEY configured in environment. Applied local Grok style translation logic."
      });
    }
  } else {
    // Perform Server-Side Gemini Generative AI Call
    if (ai) {
      try {
        console.log("[GEMINI] Translating raw input. Prompt details:", promptText);
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: promptText,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.75,
            topP: 0.95,
          },
        });

        const executive_summary = response.text ? response.text.trim() : "";
        
        if (!executive_summary) {
          throw new Error("Received empty text back from Gemini model.");
        }

        console.log("[GEMINI] Output summary:", executive_summary);
        return res.json({ success: true, executive_summary });
      } catch (err: any) {
        console.error("[GEMINI] Call failed, fall back to smart local translator generator:", err);
        const fallbackSummary = performInHouseTranslation(source, raw_payload);
        return res.json({
          success: true,
          executive_summary: fallbackSummary,
          warning: `Gemini API invocation offline (${err.message}). Applied local synthesis logic.`
        });
      }
    } else {
      const fallbackSummary = performInHouseTranslation(source, raw_payload);
      return res.json({
        success: true,
        executive_summary: fallbackSummary,
        warning: "No active Gemini API Key configured in your Secret Environment variables. Applied local synthesis logic."
      });
    }
  }
});

// A localized rule-based fallback generator simulating the Gemini model perfectly so the app is always highly functional
function performInHouseTranslation(source: string, payload: any): string {
  if (source === "git") {
    const commit = payload.commit_message || "Update core protocol";
    if (commit.toLowerCase().includes("vessel") || commit.toLowerCase().includes("steward")) {
      return "Architected concurrent client model instances using specialized multi-agent orchestration frameworks, enhancing load capacity to handle automated requests across remote production environments.";
    }
    return "Optimized deployment workflows on distributed servers, establishing robust automated synchronization and continuous verification matrices for persistent systems integration.";
  } else if (source === "narrative") {
    return `Deployed structured systems engineering documentation and standard operating procedures to govern task-allocation, scaling content pipeline efficiency across localized endpoints.`;
  } else if (source === "grok") {
    const prompt = (payload.prompt || "Optimize routines").toLowerCase();
    if (prompt.includes("optimize") || prompt.includes("consensus") || prompt.includes("throughput")) {
      return `Engineered highly optimized lock-free ring-buffer architectures in Rust, decoupling asynchronous telemetry operations to achieve sub-millisecond network event processing latency under heavy loads.`;
    }
    return `Executed rigorous system-theoretic research and diagnostic simulations within advanced LLM playgrounds, establishing reliable prompting heuristics to improve AI validation agents' task-completion ratios by 22%.`;
  } else {
    const hz = payload.frequency_hz || 1.618;
    return `Engineered low-latency solid-state telemetry dashboards on ESP32 microcontrollers clocked at ${hz} Hz, ensuring secure real-time visualization of concurrent runtime server threads.`;
  }
}

// Grok translator has a slightly more direct, punchy, or technically witty styling, perfect for a Grok output!
function performInHouseGrokEngineTranslation(source: string, payload: any): string {
  if (source === "git") {
    return "Refactored key deployment daemons and automated live-state webhooks, cutting synchronization lag and enforcing high-availability protocol consensus in production.";
  } else if (source === "narrative") {
    return "Synthesized comprehensive systems docs detailing multi-agent consensus loops, translating esoteric system metrics to corporate-friendly service level objectives.";
  } else if (source === "grok") {
    return "Architected state-of-the-art lock-free token streaming systems to optimize LLM thread execution and enhance predictive prompting throughput across concurrent containers.";
  } else {
    const hz = payload.frequency_hz || 1.618;
    return `Designed real-time telemetry pipelines measuring fine-grained microcontroller events at ${hz} Hz, replacing legacy synchronous polling with event-driven message architectures.`;
  }
}

// Prepare Express to serve static files/Vite middlewares
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Mount Vite middleware in development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serves compiled production build from /dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Ready. Server running on port ${PORT}`);
  });
}

startServer();
