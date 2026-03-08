import { Cpu, RotateCcw, Shield, Wrench, Lock, Skull, Bug, Zap, ChevronRight, ExternalLink, AlertTriangle, CheckCircle, Settings, Monitor } from "lucide-react";
import { Link } from "react-router-dom";
import { DocLayout, DocHero, DocSection, DocCard, DocAlert, DocCode } from "@/components/docs";

const Advanced = () => {
  // BIOS settings reference
  const biosSettings = [
    { setting: "Boot Order", default: "Standard", options: "Standard, Minimal, Complete", description: "Controls which installation profile loads" },
    { setting: "Boot Password", default: "Disabled", options: "Enabled / Disabled", description: "Require password before OS loads" },
    { setting: "Boot Animation", default: "Enabled", options: "Enabled / Disabled", description: "Show/skip the boot splash screen" },
    { setting: "Secure Boot", default: "Enabled", options: "Enabled / Disabled", description: "Verify system integrity on startup" },
    { setting: "POST Diagnostics", default: "Quick", options: "Quick / Full / Skip", description: "Hardware self-test detail level" },
    { setting: "Recovery Partition", default: "Enabled", options: "Enabled / Disabled", description: "Allow F2 recovery access" },
    { setting: "Safe Mode Access", default: "Enabled", options: "Enabled / Disabled", description: "Allow F8 safe mode boot" },
    { setting: "System Clock", default: "Auto", options: "Auto / Manual", description: "Time source configuration" },
  ];

  // Recovery mode steps
  const recoverySteps = [
    { step: 1, title: "Enter Recovery", action: "Press F2 during boot", detail: "Watch for the 'Press F2 for Recovery' prompt during POST" },
    { step: 2, title: "Choose Option", action: "Select from recovery menu", detail: "Reset Password, System Repair, Factory Reset, Boot Logs, or Terminal" },
    { step: 3, title: "Authenticate", action: "Confirm your identity", detail: "Some options require your current password or BIOS password" },
    { step: 4, title: "Execute", action: "Confirm the action", detail: "Factory Reset requires double confirmation — it wipes everything" },
    { step: 5, title: "Reboot", action: "System restarts automatically", detail: "Changes take effect on the next boot cycle" },
  ];

  // Safe Mode vs Normal comparison
  const modeComparison = [
    { feature: "Desktop & Taskbar", normal: true, safe: true, description: "Core UI loads in both modes" },
    { feature: "Start Menu", normal: true, safe: true, description: "Available but limited in Safe Mode" },
    { feature: "All Apps", normal: true, safe: false, description: "Safe Mode only loads essential apps" },
    { feature: "Downloadable Apps", normal: true, safe: false, description: "Disabled in Safe Mode" },
    { feature: "Theme Engine", normal: true, safe: false, description: "Safe Mode uses default theme" },
    { feature: "Widgets", normal: true, safe: false, description: "Disabled to reduce complexity" },
    { feature: "Network Features", normal: true, safe: false, description: "Supabase sync disabled" },
    { feature: "DEF-DEV Access", normal: true, safe: true, description: "Available for debugging" },
    { feature: "Settings", normal: true, safe: true, description: "Full access for troubleshooting" },
    { feature: "Boot Animations", normal: true, safe: false, description: "Skipped for fast boot" },
  ];

  // All crash/bugcheck types
  const crashTypes = [
    { code: "IRQL_NOT_LESS_OR_EQUAL", stop: "0x0000000A", trigger: "Memory access violation", severity: "critical" },
    { code: "KERNEL_DATA_INPAGE_ERROR", stop: "0x0000007A", trigger: "Disk read failure", severity: "critical" },
    { code: "CRITICAL_PROCESS_DIED", stop: "0x000000EF", trigger: "Core process terminated", severity: "critical" },
    { code: "SYSTEM_SERVICE_EXCEPTION", stop: "0x0000003B", trigger: "Unhandled app exception", severity: "high" },
    { code: "MEMORY_MANAGEMENT", stop: "0x0000001A", trigger: "Virtual memory error", severity: "high" },
    { code: "PAGE_FAULT_IN_NONPAGED_AREA", stop: "0x00000050", trigger: "Invalid memory reference", severity: "high" },
    { code: "DRIVER_POWER_STATE_FAILURE", stop: "0x0000009F", trigger: "Power state transition", severity: "medium" },
    { code: "WHEA_UNCORRECTABLE_ERROR", stop: "0x00000124", trigger: "Hardware abstraction error", severity: "medium" },
    { code: "KMODE_EXCEPTION_NOT_HANDLED", stop: "0x0000001E", trigger: "Kernel exception", severity: "critical" },
    { code: "DPC_WATCHDOG_VIOLATION", stop: "0x00000133", trigger: "Deferred procedure timeout", severity: "high" },
    { code: "CLOCK_WATCHDOG_TIMEOUT", stop: "0x00000101", trigger: "Processor timeout", severity: "medium" },
    { code: "UNEXPECTED_KERNEL_MODE_TRAP", stop: "0x0000007F", trigger: "CPU trap error", severity: "critical" },
  ];

  return (
    <DocLayout
      title="Advanced Features"
      description="Deep dive into BIOS settings, Recovery Mode, Safe Mode, crash codes, and system internals of Urbanshade OS."
      keywords={["bios", "recovery mode", "safe mode", "advanced", "crash", "bugcheck", "developer"]}
      accentColor="cyan"
      prevPage={{ title: "Troubleshooting", path: "/docs/troubleshooting" }}
      nextPage={{ title: "Shortcuts", path: "/docs/shortcuts" }}
    >
      <DocHero
        icon={Wrench}
        title="Advanced Features"
        subtitle="BIOS configuration, recovery tools, safe mode, and every bugcheck code. Power user territory."
        accentColor="cyan"
      />

      {/* BIOS Settings Reference */}
      <DocSection title="BIOS Settings" icon={Cpu} accentColor="cyan" id="bios">
        <div className="flex items-center gap-3 mb-4">
          <kbd className="px-4 py-2 bg-slate-900 rounded-lg border border-cyan-500/30 font-mono text-cyan-400 text-lg">DEL</kbd>
          <span className="text-slate-400">Press during boot POST screen</span>
        </div>

        <p className="text-slate-400 mb-4">
          The BIOS provides low-level system configuration. Settings persist across sessions via localStorage.
        </p>

        <div className="rounded-xl border border-slate-700/50 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-4 gap-2 px-4 py-2.5 bg-slate-800/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Setting</span>
            <span>Default</span>
            <span>Options</span>
            <span>Description</span>
          </div>
          {/* Rows */}
          {biosSettings.map((s, i) => (
            <div key={s.setting} className={`grid grid-cols-4 gap-2 px-4 py-3 text-sm hover:bg-slate-800/20 transition-colors ${i > 0 ? 'border-t border-slate-800/50' : ''}`}>
              <span className="font-medium text-cyan-400 font-mono text-xs">{s.setting}</span>
              <span className="text-slate-300">{s.default}</span>
              <span className="text-slate-500 text-xs">{s.options}</span>
              <span className="text-slate-500 text-xs">{s.description}</span>
            </div>
          ))}
        </div>

        <DocAlert variant="tip" title="BIOS Password">
          If you set a BIOS password and forget it, use Recovery Mode (F2) to reset it. The BIOS password is separate from your login password.
        </DocAlert>
      </DocSection>

      {/* Recovery Mode Step-by-Step */}
      <DocSection title="Recovery Mode" icon={RotateCcw} accentColor="green" id="recovery">
        <div className="flex items-center gap-3 mb-4">
          <kbd className="px-4 py-2 bg-slate-900 rounded-lg border border-green-500/30 font-mono text-green-400 text-lg">F2</kbd>
          <span className="text-slate-400">Press during boot sequence</span>
        </div>

        {/* Visual Step Guide */}
        <div className="space-y-3 mb-6">
          {recoverySteps.map((s, i) => (
            <div key={s.step} className="flex items-start gap-4">
              {/* Step number + connector */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 font-bold text-sm flex-shrink-0">
                  {s.step}
                </div>
                {i < recoverySteps.length - 1 && (
                  <div className="w-px h-6 bg-green-500/20 mt-1" />
                )}
              </div>
              {/* Content */}
              <div className="pb-2">
                <h4 className="font-semibold text-white text-sm">{s.title}</h4>
                <p className="text-sm text-green-400 mt-0.5">{s.action}</p>
                <p className="text-xs text-slate-500 mt-1">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recovery Options Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "Reset Password", desc: "Clear your boot/login password", icon: "🔑" },
            { title: "System Repair", desc: "Fix corrupted settings & state", icon: "🔧" },
            { title: "Factory Reset", desc: "Wipe everything — nuclear option", icon: "💣" },
            { title: "Boot Logs", desc: "View startup diagnostic logs", icon: "📋" },
            { title: "Recovery Terminal", desc: "Command-line recovery tools", icon: "💻" },
            { title: "Export Data", desc: "Save settings before reset", icon: "💾" },
          ].map((opt) => (
            <div key={opt.title} className="p-4 rounded-lg bg-slate-800/30 border border-green-500/15 hover:border-green-500/30 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <span>{opt.icon}</span>
                <h4 className="font-medium text-white text-sm">{opt.title}</h4>
              </div>
              <p className="text-xs text-slate-500">{opt.desc}</p>
            </div>
          ))}
        </div>
      </DocSection>

      {/* Safe Mode Comparison */}
      <DocSection title="Safe Mode" icon={Shield} accentColor="amber" id="safe-mode">
        <div className="flex items-center gap-3 mb-4">
          <kbd className="px-4 py-2 bg-slate-900 rounded-lg border border-amber-500/30 font-mono text-amber-400 text-lg">F8</kbd>
          <span className="text-slate-400">Press during boot sequence</span>
        </div>

        <p className="text-slate-400 mb-4">
          Safe Mode boots with minimal features for troubleshooting. Here's what's available vs disabled:
        </p>

        <div className="rounded-xl border border-slate-700/50 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-4 gap-2 px-4 py-2.5 bg-slate-800/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span className="col-span-2">Feature</span>
            <span className="text-center">Normal</span>
            <span className="text-center">Safe Mode</span>
          </div>
          {modeComparison.map((row, i) => (
            <div key={row.feature} className={`grid grid-cols-4 gap-2 px-4 py-2.5 text-sm hover:bg-slate-800/20 transition-colors ${i > 0 ? 'border-t border-slate-800/50' : ''}`}>
              <div className="col-span-2">
                <span className="text-slate-300 text-xs">{row.feature}</span>
                <p className="text-[10px] text-slate-600">{row.description}</p>
              </div>
              <div className="flex justify-center">
                {row.normal ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <span className="text-slate-600">—</span>
                )}
              </div>
              <div className="flex justify-center">
                {row.safe ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500/50" />
                )}
              </div>
            </div>
          ))}
        </div>
      </DocSection>

      {/* All Bugcheck Codes */}
      <DocSection title="Bugcheck Reference" icon={Skull} accentColor="red" id="bugchecks">
        <p className="text-slate-400 mb-4">
          Complete reference of all {crashTypes.length} simulated bugcheck (BSOD) error codes. These are cosmetic — click "Reboot Now" to recover.
        </p>

        <div className="rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-slate-800/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span className="col-span-5">Error Code</span>
            <span className="col-span-2">Stop Code</span>
            <span className="col-span-3">Trigger</span>
            <span className="col-span-2 text-right">Severity</span>
          </div>
          {crashTypes.map((err, i) => (
            <div key={err.code} className={`grid grid-cols-12 gap-2 px-4 py-2.5 hover:bg-slate-800/20 transition-colors ${i > 0 ? 'border-t border-slate-800/50' : ''}`}>
              <code className="col-span-5 text-xs font-mono text-red-400 truncate">{err.code}</code>
              <code className="col-span-2 text-xs font-mono text-slate-500">{err.stop}</code>
              <span className="col-span-3 text-xs text-slate-400">{err.trigger}</span>
              <div className="col-span-2 flex justify-end">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  err.severity === 'critical' ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                  err.severity === 'high' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20' :
                  'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                }`}>
                  {err.severity}
                </span>
              </div>
            </div>
          ))}
        </div>

        <DocAlert variant="info" title="Triggering Crashes">
          You can trigger bugchecks via the <strong>System Crash</strong> app, the <code className="font-mono text-cyan-400">panic</code> terminal command, or the Admin Panel.
        </DocAlert>
      </DocSection>

      {/* System States */}
      <DocSection title="System States" icon={Monitor} accentColor="blue" id="states">
        <p className="text-slate-400 mb-4">The OS can enter several special states:</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { title: "Maintenance Mode", icon: "⚙️", desc: "Limited access during simulated updates. Triggered by admins.", color: "amber" },
            { title: "Lockdown Mode", icon: "🔐", desc: "Emergency lockdown — restricted access. NAVI AI can trigger this.", color: "red" },
            { title: "Update Mode", icon: "🔄", desc: "Fake file names scroll by while 'installing updates.'", color: "blue" },
            { title: "Crash Screen", icon: "💥", desc: "Dramatic bugcheck display. Click Reboot to recover.", color: "red" },
            { title: "Lock Screen", icon: "🔒", desc: "Session locked. Re-enter password to continue.", color: "cyan" },
            { title: "Logout", icon: "👋", desc: "Returns to login screen. Session data preserved.", color: "green" },
          ].map((state) => (
            <div key={state.title} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-1">
                <span>{state.icon}</span>
                <h4 className="font-medium text-white text-sm">{state.title}</h4>
              </div>
              <p className="text-xs text-slate-500">{state.desc}</p>
            </div>
          ))}
        </div>
      </DocSection>

      {/* SystemBus API */}
      <DocSection title="SystemBus API" icon={Zap} accentColor="blue" id="systembus">
        <p className="text-slate-400 mb-4">
          Internal event system for cross-component communication. Access via <code className="font-mono text-cyan-400">window.systemBus</code>.
        </p>
        <DocCode
          title="SystemBus Events"
          code={`TRIGGER_CRASH      // Trigger a bugcheck screen
TRIGGER_REBOOT     // Initiate system reboot
TRIGGER_SHUTDOWN   // Initiate shutdown sequence
ENTER_RECOVERY     // Enter recovery mode
OPEN_DEV_MODE      // Open DEF-DEV console
LOCK_SCREEN        // Lock the session
TOGGLE_START_MENU  // Toggle start menu

// Usage: window.systemBus.emit('TRIGGER_CRASH')`}
        />
        <p className="mt-3 text-sm text-slate-500">
          Full developer docs: <Link to="/docs/dev/system-bus" className="text-blue-400 hover:underline">SystemBus Reference</Link>
        </p>
      </DocSection>

      {/* DEF-DEV Quick Reference */}
      <DocSection title="DEF-DEV Console" icon={Bug} accentColor="amber" id="def-dev">
        <p className="text-slate-400 mb-4">
          Enable Developer Mode in Settings → Developer Options to access the full debugging suite.
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { name: "Console", desc: "Real-time log capture" },
            { name: "Actions", desc: "Monitor system events" },
            { name: "Storage", desc: "Inspect localStorage" },
            { name: "Terminal", desc: "Remote OS commands" },
            { name: "Recovery", desc: "System snapshots" },
            { name: "Bugchecks", desc: "Crash history & replay" },
            { name: "Performance", desc: "Render metrics" },
            { name: "Network", desc: "Supabase requests" },
            { name: "Boot Analyzer", desc: "Startup profiling" },
          ].map((tab) => (
            <div key={tab.name} className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <h4 className="font-medium text-amber-400 text-sm">{tab.name}</h4>
              <p className="text-[11px] text-slate-500">{tab.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-500">
          Full guide: <Link to="/docs/def-dev" className="text-amber-400 hover:underline">DEF-DEV Documentation</Link>
        </p>
      </DocSection>

      <DocAlert variant="danger" title="Remember">
        All of this is simulated. No real hardware, no real crashes, no real danger. The worst that can happen is clearing localStorage. Have fun breaking things!
      </DocAlert>
    </DocLayout>
  );
};

export default Advanced;
