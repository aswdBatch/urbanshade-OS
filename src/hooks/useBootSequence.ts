import { useState, useEffect } from "react";
import { getShortVersion, getBuildNumber } from "@/lib/versionInfo";
import { toast } from "sonner";
import { CrashType, CrashData, triggerCrash } from "@/components/CrashScreen";
import { BugcheckData, createBugcheck } from "@/components/BugcheckScreen";

export type SimpleCrashType = "kernel" | "virus" | "bluescreen" | "memory" | "corruption" | "overload";
import { actionDispatcher } from "@/lib/actionDispatcher";
import { systemBus } from "@/lib/systemBus";
import { commandQueue, QueuedCommand } from "@/lib/commandQueue";
import { useIdleLock } from "@/hooks/useIdleLock";
import type { FakeBanData, FakeTempBanData, FakeWarnData } from "./useModerationGates";

interface UseBootSequenceProps {
  onFakeBan: (data: FakeBanData) => void;
  onFakeTempBan: (data: FakeTempBanData) => void;
  onFakeWarn: (data: FakeWarnData) => void;
}

export const useBootSequence = ({ onFakeBan, onFakeTempBan, onFakeWarn }: UseBootSequenceProps) => {
  // ── Boot cascade state ──
  const [adminSetupComplete, setAdminSetupComplete] = useState(false);
  const [showingBiosTransition, setShowingBiosTransition] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [postComplete, setPostComplete] = useState(() => {
    const warmReboot = sessionStorage.getItem("urbanshade_warm_reboot");
    if (warmReboot === "true") {
      sessionStorage.removeItem("urbanshade_warm_reboot");
      return true;
    }
    return false;
  });
  const [biosComplete, setBiosComplete] = useState(() => {
    const rebootToBios = localStorage.getItem("urbanshade_reboot_to_bios");
    if (rebootToBios === "true") {
      localStorage.removeItem("urbanshade_reboot_to_bios");
      return false;
    }
    return true;
  });
  const [booted, setBooted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [shuttingDown, setShuttingDown] = useState(false);
  const [rebooting, setRebooting] = useState(false);
  const [blackScreen, setBlackScreen] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [crashData, setCrashData] = useState<CrashData | null>(null);
  const [killedProcess, setKilledProcess] = useState("");
  const [crashType, setCrashType] = useState<SimpleCrashType>("kernel");
  const [loggingOut, setLoggingOut] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [customCrashData, setCustomCrashData] = useState<{ title: string; message: string } | null>(null);
  const [bugcheckData, setBugcheckData] = useState<BugcheckData | null>(null);
  const [lockdownMode, setLockdownMode] = useState(false);
  const [lockdownProtocol, setLockdownProtocol] = useState("");
  const [siteLocked, setSiteLocked] = useState(false);
  const [siteLockReason, setSiteLockReason] = useState("");
  const [showTour, setShowTour] = useState(false);
  const [safeMode, setSafeMode] = useState(() => sessionStorage.getItem("urbanshade_safe_mode") === "true");
  const [needsRecovery, setNeedsRecovery] = useState(false);
  const [inRecoveryMode, setInRecoveryMode] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [keyBuffer, setKeyBuffer] = useState("");
  const [oobeComplete, setOobeComplete] = useState(() => localStorage.getItem("urbanshade_oobe_complete") === "true");
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(() => localStorage.getItem("urbanshade_disclaimer_accepted") === "true");
  const [devModeOpen, setDevModeOpen] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // ── Idle lock ──
  useIdleLock({
    onLock: () => setIsLocked(true),
    idleTimeMinutes: 5,
    enabled: loggedIn && !crashed && !shuttingDown && !rebooting && !isLocked,
  });

  // ── Site lock check ──
  useEffect(() => {
    const checkSiteLock = async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data } = await supabase
          .from("site_locks")
          .select("is_locked, lock_reason")
          .eq("id", "global")
          .maybeSingle();

        if (data?.is_locked) {
          const { data: session } = await supabase.auth.getSession();
          if (session.session) {
            const { data: roleData } = await supabase.rpc("has_role", {
              _user_id: session.session.user.id,
              _role: "admin",
            });
            if (roleData) return;
          }
          setSiteLocked(true);
          setSiteLockReason(data.lock_reason || "Site is currently locked by an administrator.");
        } else {
          setSiteLocked(false);
        }
      } catch (e) {
        console.warn("Could not check site lock status:", e);
      }
    };

    checkSiteLock();
    const interval = setInterval(checkSiteLock, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Admin setup check + keyboard shortcuts + console commands ──
  useEffect(() => {
    try {
      const adminData = localStorage.getItem("urbanshade_admin");
      if (adminData) {
        const parsed = JSON.parse(adminData);
        if (parsed?.id && parsed?.name && parsed?.password) {
          setAdminSetupComplete(true);
        } else {
          console.warn("Invalid admin data structure, clearing...");
          localStorage.removeItem("urbanshade_admin");
          setAdminSetupComplete(false);
        }
      } else {
        setAdminSetupComplete(false);
      }
    } catch (e) {
      console.error("Error checking admin setup:", e);
      localStorage.removeItem("urbanshade_admin");
      setAdminSetupComplete(false);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.length === 1) {
        const newBuffer = (keyBuffer + e.key.toLowerCase()).slice(-10);
        setKeyBuffer(newBuffer);
        if (newBuffer.endsWith("del") || newBuffer.endsWith("delete")) {
          if (!booted && !inRecoveryMode) {
            e.preventDefault();
            if (rebooting) {
              setRebooting(false);
              setBlackScreen(false);
            }
            setShowingBiosTransition(true);
            setTimeout(() => {
              setBiosComplete(false);
              setShowingBiosTransition(false);
            }, 1500);
            toast.info("Entering BIOS Setup...");
            setKeyBuffer("");
          }
        }
      }
      if (e.key === "F2" && !booted && !inRecoveryMode) {
        e.preventDefault();
        setInRecoveryMode(true);
        toast.info("Entering Recovery Mode...");
      }
      if ((e.key === "Delete" || e.key === "Del") && !booted && !inRecoveryMode) {
        e.preventDefault();
        if (rebooting) {
          setRebooting(false);
          setBlackScreen(false);
        }
        setShowingBiosTransition(true);
        setTimeout(() => {
          setBiosComplete(false);
          setShowingBiosTransition(false);
        }, 1500);
        toast.info("Entering BIOS Setup...");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Console commands
    (window as any).adminPanel = () => {
      setShowAdminPanel(true);
      console.log("%c[SYSTEM] Admin Panel Opened", "color: #00ff00; font-weight: bold");
    };
    (window as any).maintenanceMode = () => {
      setMaintenanceMode(true);
      console.log("%c[SYSTEM] Entering Maintenance Mode...", "color: #ffff00; font-weight: bold");
    };
    (window as any).normalMode = () => {
      setMaintenanceMode(false);
      console.log("%c[SYSTEM] Returning to Normal Mode...", "color: #00ff00; font-weight: bold");
    };
    (window as any).devMode = () => {
      setDevModeOpen(true);
      console.log("%c[SYSTEM] Opening Developer Console...", "color: #ff00ff; font-weight: bold");
    };

    console.log("%c[URBANSHADE OS] Console Commands Available", "color: #00ffff; font-weight: bold; font-size: 14px");
    console.log("%cadminPanel() - Access admin panel (password required)", "color: #888888");
    console.log("%cmaintenanceMode() - Enter maintenance mode", "color: #888888");
    console.log("%cnormalMode() - Return to normal mode", "color: #888888");
    console.log("%cdevMode() - Open developer console", "color: #ff00ff");
    console.log("%c\nHint: Check the HTML source for hidden secrets...", "color: #ffaa00; font-style: italic");

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [loggedIn, lockdownMode, crashed, shuttingDown, rebooting, booted, biosComplete, inRecoveryMode, keyBuffer]);

  // ── Command Queue Polling ──
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

  // ── System Bus listeners ──
  useEffect(() => {
    const unsubCrash = systemBus.on("TRIGGER_CRASH", (event) => {
      const { crashType: ct, process } = event.payload || {};
      if (ct) {
        const crash = triggerCrash(ct, { process: process || "systembus.exe" });
        setCrashData(crash);
        setCrashed(true);
        setShowAdminPanel(false);
      }
    });
    const unsubBugcheck = systemBus.on("TRIGGER_BUGCHECK", (event) => {
      const { code, description } = event.payload || {};
      if (code) {
        const bugcheck = createBugcheck(code, description || "System Bus triggered bugcheck", "SystemBus");
        setBugcheckData(bugcheck);
        setShowAdminPanel(false);
      }
    });
    const unsubRecovery = systemBus.on("ENTER_RECOVERY", () => {
      setInRecoveryMode(true);
      setShowAdminPanel(false);
    });
    const unsubReboot = systemBus.on("TRIGGER_REBOOT", () => {
      handleReboot();
      setShowAdminPanel(false);
    });
    const unsubShutdown = systemBus.on("TRIGGER_SHUTDOWN", () => {
      handleShutdown();
      setShowAdminPanel(false);
    });
    const unsubDevMode = systemBus.on("OPEN_DEV_MODE", () => setDevModeOpen(true));
    const unsubCloseAdmin = systemBus.on("CLOSE_ADMIN_PANEL", () => setShowAdminPanel(false));

    return () => {
      unsubCrash();
      unsubBugcheck();
      unsubRecovery();
      unsubReboot();
      unsubShutdown();
      unsubDevMode();
      unsubCloseAdmin();
    };
  }, []);

  // ── Changelog auto-open ──
  useEffect(() => {
    if (loggedIn && !crashed && !lockdownMode) {
      const lastSeenVersion = localStorage.getItem("urbanshade_last_seen_version");
      const lastSeenBuild = localStorage.getItem("urbanshade_last_seen_build");
      const isNewVersion = lastSeenVersion !== getShortVersion();
      const isNewBuild = lastSeenBuild !== String(getBuildNumber());
      if (isNewVersion || isNewBuild) {
        setTimeout(() => setShowChangelog(true), 500);
      }
    }
  }, [loggedIn, crashed, lockdownMode]);

  // ── Tour check ──
  useEffect(() => {
    if (loggedIn && !crashed && !lockdownMode) {
      const tourCompleted = localStorage.getItem("urbanshade_tour_completed");
      if (!tourCompleted) {
        setTimeout(() => setShowTour(true), 2000);
      }
    }
  }, [loggedIn, crashed, lockdownMode]);

  // ── Handlers ──
  const handleReboot = () => {
    setLoggedIn(false);
    setRebooting(true);
  };

  const handleRebootComplete = () => {
    setRebooting(false);
    setLoggedIn(false);
    setBlackScreen(true);
    sessionStorage.setItem("urbanshade_warm_reboot", "true");
    setTimeout(() => {
      setBlackScreen(false);
      setPostComplete(true);
      setBooted(false);
    }, 3000);
  };

  const handleEnterBios = () => {
    setShowingBiosTransition(true);
    setTimeout(() => {
      setBiosComplete(false);
      setPostComplete(true);
      setBooted(false);
      setShowingBiosTransition(false);
    }, 1500);
  };

  const handlePostComplete = () => setPostComplete(true);

  const handlePostEnterBios = () => {
    setPostComplete(true);
    setBiosComplete(false);
  };

  const handleInstallationComplete = (adminData: { username: string; password: string }) => {
    try {
      const fullAdminData = {
        username: adminData.username,
        password: adminData.password,
        id: "P000",
        name: `Administrator (${adminData.username})`,
        role: "System Administrator",
        clearance: 5,
        department: "Administration",
        location: "Control Room",
        status: "active",
        phone: "x1000",
        email: "admin@urbanshade.corp",
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("urbanshade_admin", JSON.stringify(fullAdminData));
      setAdminSetupComplete(true);
      if (!oobeComplete) localStorage.removeItem("urbanshade_oobe_complete");
    } catch (e) {
      console.error("Setup failed, creating passwordless admin:", e);
      const fallbackAdmin = {
        username: "Admin", password: "", id: "P000",
        name: "Administrator (Admin)", role: "System Administrator",
        clearance: 5, department: "Administration", location: "Control Room",
        status: "active", createdAt: new Date().toISOString(),
      };
      localStorage.setItem("urbanshade_admin", JSON.stringify(fallbackAdmin));
      setAdminSetupComplete(true);
    }
  };

  const handleShutdownComplete = () => {
    setShuttingDown(false);
    setTimeout(() => {
      setBooted(false);
      setPostComplete(false);
    }, 3000);
  };

  const handleLogout = () => setLoggingOut(true);

  const handleLogoutComplete = () => {
    setLoggingOut(false);
    setLoggedIn(false);
    setIsGuestMode(false);
    localStorage.removeItem("urbanshade_current_user");
  };

  const handleShutdown = () => {
    setLoggedIn(false);
    setShuttingDown(true);
  };

  const handleCriticalKill = (
    processName: string,
    type: SimpleCrashType = "kernel",
  ) => {
    setKilledProcess(processName);
    setCrashType(type);
    setCustomCrashData(null);
    setCrashed(true);
    if (type === "corruption" || type === "virus" || Math.random() < 0.3) {
      setNeedsRecovery(true);
    }
  };

  const handleCustomCrash = (title: string, message: string, type: SimpleCrashType) => {
    setCustomCrashData({ title, message });
    setKilledProcess("admin.custom");
    setCrashType(type);
    setCrashed(true);
  };

  const handleAdminCrash = (type: string) => {
    const crashTypes: Record<string, SimpleCrashType> = {
      kernel: "kernel", bluescreen: "bluescreen", memory: "memory",
      corruption: "corruption", overload: "overload", virus: "virus",
    };
    handleCriticalKill("admin.panel", crashTypes[type] || "kernel");
  };

  const handleCrashReboot = () => {
    if (needsRecovery) {
      setInRecoveryMode(true);
      setCrashed(false);
    } else {
      setCrashed(false);
      setLoggedIn(false);
      setBooted(false);
      setPostComplete(false);
      setKilledProcess("");
      setCrashType("kernel");
      setCustomCrashData(null);
    }
  };

  const handleLockdown = (protocolName: string) => {
    setLockdownMode(true);
    setLockdownProtocol(protocolName);
  };

  const handleLockdownAuthorized = () => {
    setLockdownMode(false);
    setLockdownProtocol("");
  };

  return {
    // State
    adminSetupComplete, showingBiosTransition, isUpdating, postComplete,
    biosComplete, booted, loggedIn, shuttingDown, rebooting, blackScreen,
    crashed, crashData, killedProcess, crashType, loggingOut, isGuestMode,
    maintenanceMode, customCrashData, bugcheckData, lockdownMode, lockdownProtocol,
    siteLocked, siteLockReason, showTour, safeMode, needsRecovery, inRecoveryMode,
    showAdminPanel, oobeComplete, disclaimerAccepted, devModeOpen, showChangelog, isLocked,

    // Handlers
    handleReboot, handleRebootComplete, handleEnterBios, handlePostComplete,
    handlePostEnterBios, handleInstallationComplete, handleShutdownComplete,
    handleLogout, handleLogoutComplete, handleShutdown,
    handleCriticalKill, handleCustomCrash, handleAdminCrash,
    handleCrashReboot, handleLockdown, handleLockdownAuthorized,

    // Setters needed by render layer
    setBiosComplete, setBooted, setLoggedIn, setIsGuestMode,
    setInRecoveryMode, setIsUpdating, setSafeMode, setIsLocked,
    setOobeComplete, setDisclaimerAccepted, setAdminSetupComplete,
    setMaintenanceMode, setShowTour, setShowAdminPanel, setDevModeOpen,
    setShowChangelog, setBugcheckData, setNeedsRecovery,
  };
};
