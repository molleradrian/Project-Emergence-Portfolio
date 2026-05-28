/**
 * Internal API Route Configuration
 * Centralizes all API endpoint routing for the Chronicle system
 */

export const API_BASE_URL = typeof window === 'undefined' 
  ? 'http://localhost:3000' 
  : '';

export const chronicleRoutes = {
  // Health & Status
  health: {
    path: '/api/health',
    method: 'GET' as const,
    url: () => `${API_BASE_URL}/api/health`,
  },

  // System State (Live Matrix)
  state: {
    path: '/api/state',
    method: 'GET' as const,
    url: () => `${API_BASE_URL}/api/state`,
  },

  statePulse: {
    path: '/api/state/pulse',
    method: 'POST' as const,
    url: () => `${API_BASE_URL}/api/state/pulse`,
  },

  // Chronicle Stream
  chronicle: {
    path: '/api/chronicle',
    method: 'GET' as const,
    url: () => `${API_BASE_URL}/api/chronicle`,
  },

  chroniclePublish: {
    path: '/api/chronicle/publish',
    method: 'POST' as const,
    url: () => `${API_BASE_URL}/api/chronicle/publish`,
  },

  chronicleDelete: {
    path: '/api/chronicle/delete',
    method: 'POST' as const,
    url: () => `${API_BASE_URL}/api/chronicle/delete`,
  },

  chronicleReset: {
    path: '/api/chronicle/reset',
    method: 'POST' as const,
    url: () => `${API_BASE_URL}/api/chronicle/reset`,
  },

  chronicleTranslate: {
    path: '/api/chronicle/translate',
    method: 'POST' as const,
    url: () => `${API_BASE_URL}/api/chronicle/translate`,
  },
} as const;

// Type exports for route definitions
export type ChronicleRoute = keyof typeof chronicleRoutes;
export type RouteConfig = typeof chronicleRoutes[ChronicleRoute];
