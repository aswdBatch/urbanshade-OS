import { useEffect } from "react";
import { toast } from "sonner";
import { CrashType, triggerCrash } from "@/components/CrashScreen";
import { BugcheckData, createBugcheck } from "@/components/BugcheckScreen";
import { actionDispatcher } from "@/lib/actionDispatcher";
import { systemBus } from "@/lib/systemBus";
import { commandQueue, QueuedCommand } from "@/lib/commandQueue";

import type { FakeBanData, FakeTempBanData, FakeWarnData } from "./useModerationGates";

interface UseCommandQueueHandlerProps {
  crashed: boolean;
  lockdownMode: boolean;
  loggedIn: boolean;
  setCrashData: (d: any) => void;
  setCrashed: (v: boolean) => void;
  setBugcheckData: (d: BugcheckData | null) => void;
  setLockdownProtocol: (v: string) => void;
  setLockdownMode: (v: boolean) => void;
  setInRecoveryMode: (v: boolean) => void;
  setLoggingOut: (v: boolean) => void;
  setIsLocked: (v: boolean) => void;
  setOobeComplete: (v: boolean) => void;
  setShowChangelog: (v: boolean) => void;
  setMaintenanceMode: (v: boolean | ((prev: boolean) => boolean)) => void;
  setSafeMode: (v: boolean) => void;
  setIsUpdating: (v: boolean) => void;
  handleReboot: () => void;
  handleShutdown: () => void;
  onFakeBan: (data: FakeBanData) => void;
  onFakeTempBan: (data: FakeTempBanData) => void;
  onFakeWarn: (data: FakeWarnData) => void;
}

export const useCommandQueueHandler = (props: UseCommandQueueHandlerProps) => {
  const {
    crashed, lockdownMode, loggedIn,
    setCrashData, setCrashed, setBugcheckData,
    setLockdownProtocol, setLockdownMode, setInRecoveryMode,
    setLoggingOut, setIsLocked, setOobeComplete, setShowChangelog,
    setMaintenanceMode, setSafeMode, setIsUpdating,
    handleReboot, handleShutdown,
    onFakeBan, onFakeTempBan, onFakeWarn,
  } = props;

  useEffect(() => {
    const handleCommand = (cmd: QueuedCommand) => {
      actionDispatcher.system(`Executing queued command: ${cmd.type}`, { source: cmd.source });

      switch (cmd.type) {
        case "CRASH": {
          const crash = triggerCrash(cmd.payload.type as CrashType, { process: cmd.payload.process || "queue.exe" });
          setCrashData(crash);
          setCrashed(true);
          break;
        }
        case "BUGCHECK": {
          const bugcheck = createBugcheck(cmd.payload.code, cmd.payload.description, cmd.source);
          setBugcheckData(bugcheck);
          break;
        }
        case "REBOOT":
          handleReboot();
          break;
        case "SHUTDOWN":
          handleShutdown();
          break;
        case "LOCKDOWN":
          setLockdownProtocol(cmd.payload.protocol || "ALPHA");
          setLockdownMode(true);
          break;
        case "RECOVERY":
          setInRecoveryMode(true);
          break;
        case "WIPE":
          localStorage.clear();
          window.location.reload();
          break;
        case "WRITE_STORAGE":
          if (cmd.payload.key && cmd.payload.value !== undefined) {
            localStorage.setItem(cmd.payload.key, cmd.payload.value);
            actionDispatcher.file(`Storage write: ${cmd.payload.key}`);
          }
          break;
        case "DELETE_STORAGE":
          if (cmd.payload.key) {
            localStorage.removeItem(cmd.payload.key);
            actionDispatcher.file(`Storage delete: ${cmd.payload.key}`);
          }
          break;
        case "TOAST": {
          const toastType = cmd.payload.type || "info";
          if (toastType === "success") toast.success(cmd.payload.message);
          else if (toastType === "error") toast.error(cmd.payload.message);
          else if (toastType === "warning") toast.warning(cmd.payload.message);
          else toast.info(cmd.payload.message);
          break;
        }
        case "CUSTOM":
          systemBus.emit("CUSTOM_COMMAND", cmd.payload);
          break;
        case "LOGOUT":
          setLoggingOut(true);
          break;
        case "LOCK":
          setIsLocked(true);
          break;
        case "OOBE":
          localStorage.removeItem("urbanshade_oobe_complete");
          setOobeComplete(false);
          break;
        case "CHANGELOG":
          setShowChangelog(true);
          break;
        case "MAINTENANCE":
          setMaintenanceMode(cmd.payload.enable ?? true);
          break;
        case "SAFE_MODE":
          sessionStorage.setItem("urbanshade_safe_mode", "true");
          setSafeMode(true);
          handleReboot();
          break;
        case "UPDATE":
          setIsUpdating(true);
          break;
        case "FAKE_BAN":
          onFakeBan({ reason: cmd.payload.reason || "Testing ban screen", duration: cmd.payload.duration, isFake: true });
          break;
        case "FAKE_TEMP_BAN":
          onFakeTempBan({
            reason: cmd.payload.reason || "Testing temp ban",
            duration: cmd.payload.duration || "7 days",
            expiresAt: cmd.payload.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            isFake: true,
          });
          break;
        case "FAKE_WARN":
          onFakeWarn({ reason: cmd.payload.reason || "Testing warning", isFake: true });
          break;
        case "FAKE_MUTE":
          toast.error(`🔇 MUTED: ${cmd.payload.reason || "Testing mute"}`, {
            description: `Duration: ${cmd.payload.duration || "30 minutes"} [FAKE - DEF-DEV Testing Mode]`,
            duration: 8000,
          });
          break;
        case "FAKE_KICK":
          toast.error(`👢 KICKED: ${cmd.payload.reason || "Testing kick"}`, {
            description: "[FAKE - DEF-DEV Testing Mode]",
            duration: 5000,
          });
          setTimeout(() => {
            setLoggingOut(true);
            setTimeout(() => setLoggingOut(false), 2000);
          }, 1000);
          break;
        case "TIMEOUT":
          toast.error("⏱️ Operation timed out", { description: "[Simulated]" });
          break;
        case "NETWORK_FAILURE":
          toast.error("🌐 Network connection lost", { description: "[Simulated]" });
          break;
        case "STORAGE_FULL":
          toast.error("💾 Storage quota exceeded", { description: "[Simulated]" });
          break;
        case "AUTH_FAILURE":
          toast.error("🔐 Authentication failed", { description: "[Simulated]" });
          break;
        case "DB_ERROR":
          toast.error(`🗄️ ${cmd.payload.message || "Database error"}`, { description: "[Simulated]" });
          break;
        case "HANDSHAKE_REQUEST": {
          const currentUser = localStorage.getItem("urbanshade_current_user");
          let username = "Unknown";
          try {
            if (currentUser) username = JSON.parse(currentUser).name || "Unknown";
          } catch {}
          const handshakeResponse = {
            status: "online" as const,
            user: username,
            systemState: crashed ? "crashed" : lockdownMode ? "lockdown" : loggedIn ? "desktop" : "boot",
            timestamp: new Date().toISOString(),
          };
          localStorage.setItem("urbanshade_handshake_response", JSON.stringify(handshakeResponse));
          actionDispatcher.system("Handshake response sent to DEF-DEV");
          break;
        }
      }
    };

    const unsubscribe = commandQueue.onAny(handleCommand);
    commandQueue.startPolling(250);

    // Legacy pending crashes/bugchecks
    const pendingCrash = localStorage.getItem("urbanshade_pending_crash");
    if (pendingCrash) {
      localStorage.removeItem("urbanshade_pending_crash");
      try {
        const data = JSON.parse(pendingCrash);
        actionDispatcher.system(`Processing legacy pending crash: ${data.type}`);
        const crash = triggerCrash(data.type as CrashType, { process: data.process || "admin.exe" });
        setCrashData(crash);
        setCrashed(true);
      } catch (e) {
        console.error("Failed to parse pending crash", e);
      }
    }

    const pendingBugcheck = localStorage.getItem("urbanshade_pending_bugcheck");
    if (pendingBugcheck) {
      localStorage.removeItem("urbanshade_pending_bugcheck");
      try {
        const data = JSON.parse(pendingBugcheck);
        actionDispatcher.system(`Processing legacy pending bugcheck: ${data.code}`);
        const bugcheck = createBugcheck(data.code, data.description, "DEF-DEV Admin");
        setBugcheckData(bugcheck);
      } catch (e) {
        console.error("Failed to parse pending bugcheck", e);
      }
    }

    return () => {
      unsubscribe();
      commandQueue.stopPolling();
    };
  }, [crashed, lockdownMode, loggedIn]);
};
