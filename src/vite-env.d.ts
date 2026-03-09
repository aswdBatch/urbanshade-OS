/// <reference types="vite/client" />

// NAVI security global interface
interface NaviSecurityGlobals {
  reportViolation: (reason: string) => void;
  triggerLockout: (reason: string) => void;
  clearLockout: () => void;
  getStatus: () => { violations: number; warningLevel: string; isLockedOut: boolean };
}

// Extend Window interface for UrbanShade globals
interface Window {
  adminPanel?: () => void;
  maintenanceMode?: () => void;
  normalMode?: () => void;
  devMode?: () => void;
  naviSecurity?: NaviSecurityGlobals;
  systemBus?: any;
}
