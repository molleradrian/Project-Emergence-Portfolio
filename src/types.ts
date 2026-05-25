export interface SystemState {
  _id?: string;
  last_pulse: number;
  node_id: string;
  frequency_hz: number;
  status: "online" | "offline" | "maintenance" | string;
  active_vessels: number;
}

export interface ChronicleItem {
  _id?: string;
  timestamp: number;
  source: "narrative" | "git" | "hardware" | string;
  event_type: "file_save" | "push" | "pulse" | string;
  raw_payload: {
    filename?: string;
    word_count?: number;
    preview_snippet?: string;
    commit_message?: string;
    file_stats?: string;
    node_id?: string;
    voltage?: number;
    frequency_hz?: number;
    active_vessels?: number;
    [key: string]: any;
  };
  executive_summary: string;
}

export interface BackendStatus {
  status: string;
  mode: "mongodb-atlas" | "local-fallback";
  database_configured: boolean;
  database_connected: boolean;
  gemini_key_configured: boolean;
  current_time: string;
}
