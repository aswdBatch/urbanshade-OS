/// <reference types="vite/client" />

interface NaviSecurityGlobals {
  reportViolation: (reason: string) => void;
  triggerLockout: (reason: string) => void;
  clearLockout: () => void;
  getStatus: () => { violations: number; warningLevel: string; isLockedOut: boolean };
}

interface UrbanShadeGlobals {
  adminPanel?: () => void;
  maintenanceMode?: () => void;
  normalMode?: () => void;
  devMode?: () => void;
  naviSecurity?: NaviSecurityGlobals;
  systemBus?: any;
}

declare global {
  interface Window extends UrbanShadeGlobals {}
}

export {};
