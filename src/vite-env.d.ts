/// <reference types="vite/client" />

interface UrbanShadeGlobals {
  adminPanel: () => void;
  maintenanceMode: () => void;
  normalMode: () => void;
  devMode: () => void;
  naviSecurity: {
    reportViolation: (reason: string) => void;
    triggerLockout: (reason: string) => void;
    clearLockout: () => void;
    getStatus: () => { violations: number; warningLevel: string; isLockedOut: boolean };
  };
  systemBus: any;
}

declare global {
  interface Window extends Partial<UrbanShadeGlobals> {}
}
