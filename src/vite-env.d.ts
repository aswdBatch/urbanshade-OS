/// <reference types="vite/client" />

import type { SystemBus } from "@/lib/systemBus";

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
  systemBus: SystemBus;
}

declare global {
  interface Window extends Partial<UrbanShadeGlobals> {}
}
