import { useIsMobile } from "@/hooks/use-mobile";
import { useNaviSecurity } from "@/hooks/useNaviSecurity";
import { useBanCheck } from "@/hooks/useBanCheck";
import { useModerationGates } from "@/hooks/useModerationGates";
import { useBootSequence } from "@/hooks/useBootSequence";

import { Desktop } from "@/components/Desktop";
import { UserSelectionScreen } from "@/components/UserSelectionScreen";
import { BootScreen } from "@/components/BootScreen";
import { BiosScreen } from "@/components/BiosScreen";
import { PostScreen } from "@/components/PostScreen";
import { ShutdownScreen } from "@/components/ShutdownScreen";
import { RebootScreen } from "@/components/RebootScreen";
import { CrashScreen } from "@/components/CrashScreen";
import { InstallationScreen } from "@/components/InstallationScreen";
import { MaintenanceMode } from "@/components/MaintenanceMode";
import { LockdownScreen } from "@/components/LockdownScreen";
import { NaviLockoutScreen } from "@/components/NaviLockoutScreen";
import { WelcomeModal } from "@/components/WelcomeModal";
import { RecoveryEnvironment } from "@/components/RecoveryEnvironment";
import { DisclaimerScreen } from "@/components/DisclaimerScreen";
import { OOBEScreen } from "@/components/OOBEScreen";
import { ChangelogDialog } from "@/components/ChangelogDialog";
import { UpdateScreen } from "@/components/UpdateScreen";
import { AdminPanel } from "@/components/AdminPanel";
import { LogoutScreen } from "@/components/LogoutScreen";
import { DevModeConsole } from "@/components/DevModeConsole";
import { LockScreen } from "@/components/LockScreen";
import { BugcheckScreen } from "@/components/BugcheckScreen";
import { BannedScreen } from "@/components/BannedScreen";
import { TempBanPopup } from "@/components/TempBanPopup";
import { TempBanBanner } from "@/components/TempBanBanner";
import { ModerationWarningPopup } from "@/components/ModerationWarningPopup";
import { VipWelcomeDialog } from "@/components/VipWelcomeDialog";
import { MobileBlockScreen } from "@/components/MobileBlockScreen";
import { SiteLockedScreen } from "@/components/SiteLockedScreen";
import SupabaseConnectivityChecker from "@/components/SupabaseConnectivityChecker";

const Index = () => {
  const isMobile = useIsMobile();
  const naviSecurity = useNaviSecurity();
  const banCheck = useBanCheck();
  const modGates = useModerationGates();

  const boot = useBootSequence({
    onFakeBan: modGates.setFakeBanData,
    onFakeTempBan: modGates.setFakeTempBanData,
    onFakeWarn: modGates.setFakeWarnData,
  });

  // Expose NAVI security to window (typed via vite-env.d.ts)
  (window as Window).naviSecurity = {
    reportViolation: (type: string, target: string, severity?: string) => 
      naviSecurity.reportViolation(type as any, target, severity as any),
    triggerLockout: naviSecurity.triggerLockout,
    clearLockout: naviSecurity.clearLockout,
    getStatus: () => ({
      violations: naviSecurity.violations.length,
      warningLevel: naviSecurity.warningLevel,
      isLockedOut: naviSecurity.isLockedOut,
    }),
  };

  // ── Priority cascade: highest-priority screens first ──

  if (!boot.disclaimerAccepted) {
    return (
      <DisclaimerScreen
        onAccept={(skipInstall) => {
          localStorage.setItem("urbanshade_disclaimer_accepted", "true");
          boot.setDisclaimerAccepted(true);
          if (skipInstall) {
            const defaultAdmin = {
              username: "Admin", password: "admin", id: "P000",
              name: "Administrator (Admin)", role: "System Administrator",
              clearance: 5, department: "Administration", location: "Control Room",
              status: "active", phone: "x1000", email: "admin@urbanshade.corp",
              createdAt: new Date().toISOString(),
            };
            localStorage.setItem("urbanshade_admin", JSON.stringify(defaultAdmin));
            localStorage.setItem("urbanshade_accounts", JSON.stringify([defaultAdmin]));
            localStorage.setItem("urbanshade_oobe_complete", "true");
            localStorage.setItem("urbanshade_first_boot", "true");
            localStorage.setItem("urbanshade_tour_completed", "true");
            localStorage.setItem("urbanshade_install_type", "standard");
            boot.setOobeComplete(true);
            boot.setAdminSetupComplete(true);
          }
        }}
      />
    );
  }

  if (!boot.adminSetupComplete) {
    return <InstallationScreen onComplete={boot.handleInstallationComplete} />;
  }

  // Permanent ban
  if (banCheck.isBanned && !banCheck.isLoading && !banCheck.isTempBan && !banCheck.isFakeBan) {
    return <BannedScreen reason={banCheck.reason} expiresAt={banCheck.expiresAt} isFakeBan={false} />;
  }

  // Fake ban
  if (banCheck.isBanned && !banCheck.isLoading && banCheck.isFakeBan) {
    return <BannedScreen reason={banCheck.reason} expiresAt={banCheck.expiresAt} isFakeBan onFakeBanDismiss={banCheck.refreshBanStatus} />;
  }

  const showTempBanGate = banCheck.isBanned && !banCheck.isLoading && banCheck.isTempBan && !banCheck.tempBanDismissed;
  const showWarningGate = !banCheck.isLoading && !!banCheck.pendingWarning;

  // NAVI lockout
  if (naviSecurity.isLockedOut && naviSecurity.lockoutTime) {
    return <NaviLockoutScreen reason={naviSecurity.lockoutReason} lockoutTime={naviSecurity.lockoutTime} onUnlock={naviSecurity.clearLockout} />;
  }

  // Site lock
  if (boot.siteLocked) {
    return <SiteLockedScreen reason={boot.siteLockReason} />;
  }

  if (boot.lockdownMode) {
    return <LockdownScreen onAuthorized={boot.handleLockdownAuthorized} protocolName={boot.lockdownProtocol} />;
  }

  if (boot.bugcheckData) {
    return (
      <BugcheckScreen
        bugcheck={boot.bugcheckData}
        onRestart={() => { boot.setBugcheckData(null); boot.setBooted(false); boot.setLoggedIn(false); }}
        onReportToDev={() => { boot.setBugcheckData(null); window.open("/def-dev", "_blank"); }}
        onRecovery={() => { boot.setBugcheckData(null); boot.setInRecoveryMode(true); }}
      />
    );
  }

  if (boot.crashed) {
    return <CrashScreen onReboot={boot.handleCrashReboot} crashData={boot.crashData || undefined} killedProcess={boot.killedProcess} crashType={boot.crashType} customData={boot.customCrashData} />;
  }

  if (boot.loggingOut) {
    const currentUser = localStorage.getItem("urbanshade_current_user");
    const username = currentUser ? JSON.parse(currentUser).name : "User";
    return <LogoutScreen onComplete={boot.handleLogoutComplete} username={username} />;
  }

  if (boot.shuttingDown) return <ShutdownScreen onComplete={boot.handleShutdownComplete} />;
  if (boot.rebooting) return <RebootScreen onComplete={boot.handleRebootComplete} />;
  if (boot.blackScreen) return <div className="fixed inset-0 bg-black" />;

  if (boot.inRecoveryMode) {
    return (
      <RecoveryEnvironment
        onContinue={() => { boot.setInRecoveryMode(false); boot.setNeedsRecovery(false); boot.setBooted(true); boot.setLoggedIn(true); }}
        onShutdown={boot.handleShutdown}
        onBootToBios={() => { boot.setInRecoveryMode(false); boot.setBiosComplete(false); }}
        onTerminalBoot={() => { sessionStorage.setItem("urbanshade_terminal_only", "true"); boot.setInRecoveryMode(false); boot.setBooted(true); boot.setLoggedIn(true); }}
        onSafeMode={() => { sessionStorage.setItem("urbanshade_safe_mode", "true"); boot.setSafeMode(true); boot.setInRecoveryMode(false); boot.setBooted(true); boot.setLoggedIn(true); }}
        onOfflineMode={() => { sessionStorage.setItem("urbanshade_offline_mode", "true"); boot.setInRecoveryMode(false); boot.setBooted(true); boot.setLoggedIn(true); }}
      />
    );
  }

  if (!boot.postComplete) return <PostScreen onComplete={boot.handlePostComplete} onEnterBios={boot.handlePostEnterBios} />;
  if (!boot.biosComplete) return <BiosScreen onExit={() => boot.setBiosComplete(true)} />;
  if (!boot.booted) {
    return (
      <BootScreen
        onComplete={() => boot.setBooted(true)}
        onSafeMode={() => { sessionStorage.setItem("urbanshade_safe_mode", "true"); boot.setSafeMode(true); boot.setBooted(true); }}
      />
    );
  }

  const isFirstBoot = localStorage.getItem("urbanshade_first_boot") === "true";
  if (!boot.loggedIn) {
    if (isFirstBoot) {
      localStorage.removeItem("urbanshade_first_boot");
      boot.setLoggedIn(true);
      return null;
    }
    return <UserSelectionScreen onLogin={(guest) => { boot.setIsGuestMode(guest || false); boot.setLoggedIn(true); }} onShutdown={boot.handleShutdown} onRestart={boot.handleReboot} />;
  }

  if (!boot.oobeComplete) return <OOBEScreen onComplete={() => boot.setOobeComplete(true)} />;

  if (boot.isUpdating) {
    return <UpdateScreen onComplete={() => { boot.setIsUpdating(false); boot.setBooted(false); boot.setLoggedIn(false); }} />;
  }

  if (boot.isLocked) {
    const currentUser = localStorage.getItem("urbanshade_current_user");
    const username = currentUser ? JSON.parse(currentUser).name : "Administrator";
    return <LockScreen onUnlock={() => boot.setIsLocked(false)} username={username} />;
  }

  // FakeMod ban screen
  if (modGates.fakeBanData) {
    return <BannedScreen reason={modGates.fakeBanData.reason} expiresAt={null} isFakeBan onFakeBanDismiss={() => modGates.setFakeBanData(null)} />;
  }

  // ── Desktop ──
  return (
    <>
      {banCheck.isBanned && banCheck.isTempBan && banCheck.tempBanDismissed && (
        <TempBanBanner expiresAt={banCheck.expiresAt} />
      )}

      <Desktop
        onLogout={boot.handleLogout}
        onReboot={boot.handleReboot}
        onShutdown={boot.handleShutdown}
        onCriticalKill={boot.handleCriticalKill}
        onLockdown={boot.handleLockdown}
        onEnterBios={boot.handleEnterBios}
        onUpdate={() => boot.setIsUpdating(true)}
        onLock={() => boot.setIsLocked(true)}
        safeMode={boot.safeMode}
        onExitSafeMode={() => { sessionStorage.removeItem("urbanshade_safe_mode"); boot.setSafeMode(false); boot.handleReboot(); }}
      />

      <ChangelogDialog open={boot.showChangelog} onOpenChange={boot.setShowChangelog} />
      {boot.maintenanceMode && <MaintenanceMode onExit={() => boot.setMaintenanceMode(false)} />}
      {boot.showTour && <WelcomeModal onComplete={() => boot.setShowTour(false)} />}
      {boot.showAdminPanel && <AdminPanel onExit={() => boot.setShowAdminPanel(false)} onCrash={boot.handleAdminCrash} onCustomCrash={boot.handleCustomCrash} />}
      {boot.devModeOpen && <DevModeConsole onClose={() => boot.setDevModeOpen(false)} />}
      <SupabaseConnectivityChecker currentRoute="main" />

      <VipWelcomeDialog open={banCheck.showVipWelcome} onClose={banCheck.dismissVipWelcome} reason={banCheck.vipReason} />

      <TempBanPopup
        open={showTempBanGate || !!modGates.fakeTempBanData}
        onDismiss={modGates.fakeTempBanData ? () => modGates.setFakeTempBanData(null) : banCheck.dismissTempBan}
        reason={modGates.fakeTempBanData?.reason || banCheck.reason}
        expiresAt={modGates.fakeTempBanData?.expiresAt ? new Date(modGates.fakeTempBanData.expiresAt) : banCheck.expiresAt}
        isFake={!!modGates.fakeTempBanData}
      />

      <ModerationWarningPopup
        open={showWarningGate || !!modGates.fakeWarnData}
        onDismiss={modGates.fakeWarnData ? () => modGates.setFakeWarnData(null) : banCheck.acknowledgeWarning}
        reason={modGates.fakeWarnData?.reason || banCheck.pendingWarning?.reason || null}
        isFake={!!modGates.fakeWarnData}
      />

      {isMobile && <MobileBlockScreen />}
    </>
  );
};

export default Index;
