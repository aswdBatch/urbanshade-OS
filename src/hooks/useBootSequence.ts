import { useState, useEffect } from "react";
import { getShortVersion, getBuildNumber } from "@/lib/versionInfo";
import { toast } from "sonner";
import { CrashType, CrashData, triggerCrash } from "@/components/CrashScreen";
import { BugcheckData, createBugcheck } from "@/components/BugcheckScreen";

export type SimpleCrashType = "kernel" | "virus" | "bluescreen" | "memory" | "corruption" | "overload";
import { actionDispatcher } from "@/lib/actionDispatcher";
import { systemBus } from "@/lib/systemBus";
import { useIdleLock } from "@/hooks/useIdleLock";
import { useBootKeyboard } from "@/hooks/useBootKeyboard";
import { useBootConsoleCommands } from "@/hooks/useBootConsoleCommands";
import { useCommandQueueHandler } from "@/hooks/useCommandQueueHandler";
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

  // ── Extracted sub-hooks ──
  useBootKeyboard({
    booted, inRecoveryMode, rebooting,
    setRebooting, setBlackScreen, setBiosComplete, setInRecoveryMode,
  });

  useBootConsoleCommands({
    setShowAdminPanel, setMaintenanceMode, setDevModeOpen,
  });

  // ── Handlers (declared before useCommandQueueHandler needs them) ──
  const handleReboot = () => {
    setLoggedIn(false);
    setRebooting(true);
  };

  const handleShutdown = () => {
    setLoggedIn(false);
    setShuttingDown(true);
  };

  useCommandQueueHandler({
    crashed, lockdownMode, loggedIn,
    setCrashData, setCrashed, setBugcheckData,
    setLockdownProtocol, setLockdownMode, setInRecoveryMode,
    setLoggingOut, setIsLocked, setOobeComplete, setShowChangelog,
    setMaintenanceMode, setSafeMode, setIsUpdating,
    handleReboot, handleShutdown,
    onFakeBan, onFakeTempBan, onFakeWarn,
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

  // ── Admin setup check ──
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
  }, []);

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

  // ── Changelog + Tour check ──
  useEffect(() => {
    if (loggedIn && !crashed && !lockdownMode) {
      const lastSeenVersion = localStorage.getItem("urbanshade_last_seen_version");
      const lastSeenBuild = localStorage.getItem("urbanshade_last_seen_build");
      const isNewVersion = lastSeenVersion !== getShortVersion();
      const isNewBuild = lastSeenBuild !== String(getBuildNumber());
      if (isNewVersion || isNewBuild) {
        setTimeout(() => setShowChangelog(true), 500);
      }

      const tourCompleted = localStorage.getItem("urbanshade_tour_completed");
      if (!tourCompleted) {
        setTimeout(() => setShowTour(true), 2000);
      }
    }
  }, [loggedIn, crashed, lockdownMode]);

  // ── Remaining Handlers ──
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
