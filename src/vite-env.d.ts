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
  systemBus?: any;
}
