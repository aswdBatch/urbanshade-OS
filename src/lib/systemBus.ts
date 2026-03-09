// System Bus for cross-component communication
// Allows admin panel and other components to trigger system events without new windows

import { CrashType } from "@/components/CrashScreen";
import { actionDispatcher } from "./actionDispatcher";

export type SystemEventType = 
  | "TRIGGER_CRASH"
  | "TRIGGER_BUGCHECK"
  | "TRIGGER_LOCKDOWN"
  | "ENTER_RECOVERY"
  | "TRIGGER_REBOOT"
  | "TRIGGER_SHUTDOWN"
  | "OPEN_DEV_MODE"
  | "CLOSE_ADMIN_PANEL"
  | "CUSTOM_COMMAND";

export interface SystemEvent {
  type: SystemEventType;
  payload?: any;
  timestamp: Date;
}

type EventCallback = (event: SystemEvent) => void;

class SystemBus {
  private listeners: Map<SystemEventType, Set<EventCallback>> = new Map();
  private globalListeners: Set<EventCallback> = new Set();

  // Subscribe to specific event type
  on(type: SystemEventType, callback: EventCallback): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
    
    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }

  // Subscribe to all events
  onAny(callback: EventCallback): () => void {
    this.globalListeners.add(callback);
    return () => this.globalListeners.delete(callback);
  }

  // Emit an event
  emit(type: SystemEventType, payload?: any) {
    const event: SystemEvent = {
      type,
      payload,
      timestamp: new Date()
    };

    // Log to action dispatcher
    actionDispatcher.system(`SystemBus: ${type}`, { payload });

    // Notify specific listeners
    this.listeners.get(type)?.forEach(cb => {
      try {
        cb(event);
      } catch (e) {
        console.error(`SystemBus listener error for ${type}:`, e);
      }
    });

    // Notify global listeners
    this.globalListeners.forEach(cb => {
      try {
        cb(event);
      } catch (e) {
        console.error("SystemBus global listener error:", e);
      }
    });

    // Also dispatch as DOM event for components that prefer that pattern
    window.dispatchEvent(new CustomEvent('systembus-event', { detail: event }));
  }

  // Convenience methods
  triggerCrash(crashType: CrashType, process?: string) {
    this.emit("TRIGGER_CRASH", { crashType, process });
  }

  triggerBugcheck(code: string, description: string) {
    this.emit("TRIGGER_BUGCHECK", { code, description });
  }

  triggerLockdown(protocol: string) {
    this.emit("TRIGGER_LOCKDOWN", { protocol });
  }

  enterRecovery() {
    this.emit("ENTER_RECOVERY");
  }

  triggerReboot() {
    this.emit("TRIGGER_REBOOT");
  }

  triggerShutdown() {
    this.emit("TRIGGER_SHUTDOWN");
  }

  openDevMode() {
    this.emit("OPEN_DEV_MODE");
  }

  closeAdminPanel() {
    this.emit("CLOSE_ADMIN_PANEL");
  }
}

// Singleton instance
export const systemBus = new SystemBus();

// Make available globally for debugging (typed via vite-env.d.ts)
(window as Window).systemBus = systemBus;