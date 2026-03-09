/// <reference types="vite/client" />

// NAVI security global interface - matches useNaviSecurity hook
interface NaviSecurityGlobals {
  reportViolation: (type: string, target: string, severity?: string) => void;
  triggerLockout: (reason: string) => void;
  clearLockout: () => void;
  getStatus: () => { violations: number; warningLevel: number; isLockedOut: boolean };
}

// Extend Window interface for UrbanShade globals
interface Window {
  adminPanel?: () => void;
  maintenanceMode?: () => void;
  normalMode?: () => void;
  devMode?: () => void;
  naviSecurity?: NaviSecurityGlobals;
  systemBus?: import("@/lib/systemBus").SystemBus;
  devStorage?: typeof import("@/lib/devStorage").devStorage;
  webkitAudioContext?: typeof AudioContext;

  // UrbanShade feature flags (set in Settings)
  __URBANSHADE_VERBOSE__?: boolean;
  __URBANSHADE_WIFI_DISABLED__?: boolean;
  __URBANSHADE_OFFLINE_MODE__?: boolean;
  __URBANSHADE_TELEMETRY__?: boolean;
  __URBANSHADE_AUTO_UPDATES__?: boolean;
}
