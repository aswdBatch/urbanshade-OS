import { Rocket, Monitor, CheckCircle, LogIn, Layout, Terminal, Keyboard, Settings, User, Clock, ExternalLink, ChevronDown, ChevronRight, Zap, HardDrive, Gamepad2, X } from "lucide-react";
import { DocLayout, DocHero, DocSection, DocCard, DocAlert, DocTable } from "@/components/docs";
import { useState } from "react";

const installTypes = [
  {
    name: "Minimal",
    time: "~2 min",
    desc: "Core system only. Fast installation for backup terminals and lightweight usage.",
    color: "cyan",
    features: {
      "Desktop Environment": true,
      "Terminal": true,
      "File Explorer": true,
      "Calculator": true,
      "Browser": true,
      "App Store": true,
      "Settings": true,
      "Facility Apps": false,
      "Research Tools": false,
      "Game Hub": false,
      "DEF-DEV Console": false,
      "All 70+ Apps": false,
    }
  },
  {
    name: "Standard",
    time: "~5 min",
    desc: "Recommended for most users. Includes facility tools and productivity apps.",
    color: "green",
    recommended: true,
    features: {
      "Desktop Environment": true,
      "Terminal": true,
      "File Explorer": true,
      "Calculator": true,
      "Browser": true,
      "App Store": true,
      "Settings": true,
      "Facility Apps": true,
      "Research Tools": false,
      "Game Hub": false,
      "DEF-DEV Console": false,
      "All 70+ Apps": false,
    }
  },
  {
    name: "Complete",
    time: "~10 min",
    desc: "Full installation with all applications, research modules, and developer tools.",
    color: "purple",
    features: {
      "Desktop Environment": true,
      "Terminal": true,
      "File Explorer": true,
      "Calculator": true,
      "Browser": true,
      "App Store": true,
      "Settings": true,
      "Facility Apps": true,
      "Research Tools": true,
      "Game Hub": true,
      "DEF-DEV Console": true,
      "All 70+ Apps": true,
    }
  }
];

const bootSteps = [
  { label: "POST", desc: "Power-On Self Test", icon: "⚡" },
  { label: "BIOS", desc: "Press DEL to enter", icon: "⌨️" },
  { label: "BOOT", desc: "Loading kernel", icon: "💾" },
  { label: "INIT", desc: "Starting services", icon: "⚙️" },
  { label: "LOGIN", desc: "User authentication", icon: "🔐" },
  { label: "DESKTOP", desc: "Ready to use", icon: "🖥️" },
];

const GettingStarted = () => {
  const [expandedInstall, setExpandedInstall] = useState<string | null>("Standard");

  return (
    <DocLayout
      title="Getting Started"
      description="Learn the basics of Urbanshade OS - installation, first boot, OOBE setup, logging in, and navigating the desktop environment."
      keywords={["urbanshade install", "first boot", "oobe", "login", "desktop setup", "new user guide"]}
      accentColor="cyan"
      nextPage={{ title: "Core Applications", path: "/docs/applications" }}
    >
      <DocHero
        icon={Rocket}
        title="Getting Started"
        subtitle="Welcome to the facility, recruit. This guide will walk you through your first boot, setup, and orientation. Try not to break anything."
        accentColor="cyan"
      />

      {/* Boot Sequence Diagram */}
      <DocSection title="Boot Sequence" icon={Zap} accentColor="cyan" id="boot-sequence">
        <p className="mb-6">
          UrbanShade OS follows a realistic boot sequence. Here's what happens when you power on:
        </p>

        <div className="relative">
          {/* Connection line */}
          <div className="absolute top-6 left-0 right-0 h-px bg-gradient-to-r from-cyan-500/0 via-cyan-500/30 to-cyan-500/0 hidden md:block" />
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {bootSteps.map((step, i) => (
              <div key={step.label} className="relative group">
                <div className="flex flex-col items-center text-center p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-cyan-500/30 transition-all hover:-translate-y-1">
                  <div className="text-2xl mb-2">{step.icon}</div>
                  <div className="font-mono text-xs font-bold text-cyan-400">{step.label}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{step.desc}</div>
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-[10px] text-slate-400 font-mono">
                    {i + 1}
                  </div>
                </div>
                {i < bootSteps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-600 absolute -right-3.5 top-1/2 -translate-y-1/2 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>

        <DocAlert variant="tip" title="Quick Access">
          Press <kbd className="px-2 py-0.5 bg-slate-800 rounded text-cyan-400 text-xs font-mono">DEL</kbd> during POST to enter BIOS settings, or <kbd className="px-2 py-0.5 bg-slate-800 rounded text-cyan-400 text-xs font-mono">F2</kbd> for Recovery Mode.
        </DocAlert>
      </DocSection>

      {/* Installation Types - Interactive Comparison */}
      <DocSection title="Installation Types" icon={Monitor} accentColor="cyan" id="installation">
        <p className="mb-6">
          Choose your installation type based on your needs. You can always install more apps later from the App Store.
        </p>

        {/* Comparison Table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Feature</th>
                {installTypes.map(t => (
                  <th key={t.name} className="text-center py-3 px-4">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`font-bold ${t.color === 'cyan' ? 'text-cyan-400' : t.color === 'green' ? 'text-green-400' : 'text-purple-400'}`}>
                        {t.name}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{t.time}
                      </span>
                      {t.recommended && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20 font-medium">
                          RECOMMENDED
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(installTypes[0].features).map((feature) => (
                <tr key={feature} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                  <td className="py-2.5 px-4 text-slate-300 text-xs">{feature}</td>
                  {installTypes.map(t => (
                    <td key={t.name} className="text-center py-2.5 px-4">
                      {t.features[feature as keyof typeof t.features] ? (
                        <CheckCircle className="w-4 h-4 text-green-400 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-slate-600 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Expandable Install Cards */}
        <div className="grid gap-3">
          {installTypes.map(t => {
            const isExpanded = expandedInstall === t.name;
            return (
              <button
                key={t.name}
                onClick={() => setExpandedInstall(isExpanded ? null : t.name)}
                className={`text-left w-full p-4 rounded-xl border transition-all ${
                  isExpanded
                    ? `bg-slate-800/50 ${t.color === 'cyan' ? 'border-cyan-500/40' : t.color === 'green' ? 'border-green-500/40' : 'border-purple-500/40'}`
                    : 'bg-slate-800/20 border-slate-700/50 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      t.color === 'cyan' ? 'bg-cyan-500/15 text-cyan-400' :
                      t.color === 'green' ? 'bg-green-500/15 text-green-400' :
                      'bg-purple-500/15 text-purple-400'
                    }`}>
                      {t.name === 'Minimal' ? <HardDrive className="w-5 h-5" /> :
                       t.name === 'Standard' ? <Monitor className="w-5 h-5" /> :
                       <Gamepad2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{t.name}</span>
                        {t.recommended && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/20">
                            ★ RECOMMENDED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-mono">{t.time}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.entries(t.features).map(([feat, included]) => (
                        <div key={feat} className={`flex items-center gap-2 text-xs ${included ? 'text-slate-300' : 'text-slate-600'}`}>
                          {included ? (
                            <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                          )}
                          {feat}
                        </div>
                      ))}
                    </div>
                    <a
                      href="/?install=true"
                      onClick={(e) => e.stopPropagation()}
                      className={`inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        t.color === 'cyan' ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30' :
                        t.color === 'green' ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/30' :
                        'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30'
                      }`}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Try it now
                    </a>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </DocSection>

      <DocSection title="OOBE Setup" icon={User} accentColor="cyan" id="oobe">
        <p>
          After installation, you'll go through the Out of Box Experience (OOBE) — 
          a wizard that helps you personalize your workstation.
        </p>

        <DocAlert variant="tip" title="Take Your Time">
          The OOBE wizard guides you through all initial settings. You can always change these later in Settings.
        </DocAlert>

        {/* Visual OOBE Steps */}
        <div className="grid gap-3 mt-6">
          {[
            { step: 1, title: "Welcome", desc: "Introduction and language selection", icon: "👋" },
            { step: 2, title: "Account Creation", desc: "Set your username and password", icon: "🔑" },
            { step: 3, title: "Theme Selection", desc: "Choose your visual theme", icon: "🎨" },
            { step: 4, title: "Privacy Settings", desc: "Configure data and sync preferences", icon: "🛡️" },
            { step: 5, title: "Final Setup", desc: "Review and complete installation", icon: "✅" },
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-cyan-500/20 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-lg flex-shrink-0">
                {item.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-cyan-500 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                    STEP {item.step}
                  </span>
                  <span className="font-medium text-white">{item.title}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Login Screen" icon={LogIn} accentColor="cyan" id="login">
        <p>
          After OOBE, you'll see the login screen. Select your user account and enter 
          your password to access the desktop.
        </p>

        <DocAlert variant="warning" title="Simulation Reminder">
          This is a simulation! Don't use real passwords. Everything is stored in your browser's localStorage.
        </DocAlert>

        <ul className="list-disc list-inside space-y-2 text-slate-400 mt-4">
          <li>Click on your user account to select it</li>
          <li>Enter your password in the field</li>
          <li>Press Enter or click the arrow to log in</li>
          <li>Use <kbd className="px-2 py-0.5 bg-slate-800 rounded text-cyan-400 text-xs">Shift+L</kbd> to lock the screen later</li>
        </ul>
      </DocSection>

      <DocSection title="Desktop Overview" icon={Layout} accentColor="cyan" id="desktop">
        <p>
          Welcome to your underwater command center! The desktop is your primary workspace 
          for managing the facility.
        </p>

        <div className="grid gap-4 mt-6 lg:grid-cols-2">
          <div className="p-5 rounded-xl bg-slate-800/30 border border-cyan-500/20">
            <h4 className="font-bold text-cyan-400 mb-3">Desktop Elements</h4>
            <ul className="text-sm text-slate-400 space-y-2">
              <li>• <strong className="text-slate-200">Desktop Icons</strong> — Quick access to apps</li>
              <li>• <strong className="text-slate-200">Taskbar</strong> — Running windows and pinned apps</li>
              <li>• <strong className="text-slate-200">Start Menu</strong> — All applications (bottom left)</li>
              <li>• <strong className="text-slate-200">System Tray</strong> — Notifications and status (bottom right)</li>
              <li>• <strong className="text-slate-200">Quick Settings</strong> — Volume, brightness, toggles</li>
            </ul>
          </div>

          <div className="p-5 rounded-xl bg-slate-800/30 border border-cyan-500/20">
            <h4 className="font-bold text-cyan-400 mb-3">Quick Actions</h4>
            <ul className="text-sm text-slate-400 space-y-2">
              <li>• <strong className="text-slate-200">Double-click</strong> — Open apps and files</li>
              <li>• <strong className="text-slate-200">Right-click</strong> — Context menus</li>
              <li>• <strong className="text-slate-200">Drag windows</strong> — Snap to edges</li>
              <li>• <strong className="text-slate-200">Click clock</strong> — Calendar and notifications</li>
              <li>• <strong className="text-slate-200">Start button</strong> — Access all apps</li>
            </ul>
          </div>
        </div>

        {/* Try it now CTA */}
        <div className="mt-6 p-5 rounded-xl bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-cyan-500/10 border border-cyan-500/20 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 text-center sm:text-left">
            <h4 className="font-semibold text-white">Ready to explore?</h4>
            <p className="text-sm text-slate-400">Jump into the OS and start using the desktop.</p>
          </div>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 transition-all font-medium text-sm whitespace-nowrap"
          >
            <ExternalLink className="w-4 h-4" />
            Launch UrbanShade OS
          </a>
        </div>
      </DocSection>

      <DocSection title="Essential Shortcuts" icon={Keyboard} accentColor="cyan" id="shortcuts">
        <p>Master these keyboard shortcuts to navigate like a pro:</p>

        <DocTable
          headers={["Shortcut", "Action"]}
          rows={[
            [<kbd className="px-2 py-0.5 bg-slate-800 rounded text-cyan-400 text-xs">Shift+T</kbd>, "Open Terminal"],
            [<kbd className="px-2 py-0.5 bg-slate-800 rounded text-cyan-400 text-xs">Shift+Q</kbd>, "Close active window"],
            [<kbd className="px-2 py-0.5 bg-slate-800 rounded text-cyan-400 text-xs">Shift+L</kbd>, "Lock screen"],
            [<kbd className="px-2 py-0.5 bg-slate-800 rounded text-cyan-400 text-xs">Shift+D</kbd>, "Show desktop"],
            [<kbd className="px-2 py-0.5 bg-slate-800 rounded text-cyan-400 text-xs">Shift+W</kbd>, "Task view"],
            [<kbd className="px-2 py-0.5 bg-slate-800 rounded text-cyan-400 text-xs">F11</kbd>, "Toggle fullscreen"],
          ]}
          accentColor="cyan"
        />

        <DocAlert variant="info" title="More Shortcuts">
          For a complete list of keyboard shortcuts, check out the <a href="/docs/shortcuts" className="text-cyan-400 hover:underline">Keyboard Shortcuts</a> documentation.
        </DocAlert>
      </DocSection>

      <DocSection title="Next Steps" icon={Settings} accentColor="cyan">
        <div className="grid gap-4 lg:grid-cols-2">
          <DocCard
            title="Explore Applications"
            description="Learn about File Explorer, Terminal, and other core apps."
            icon={Terminal}
            link="/docs/applications"
            accentColor="cyan"
          />
          <DocCard
            title="Facility Management"
            description="Discover security cameras, containment monitors, and more."
            icon={Monitor}
            link="/docs/facility"
            accentColor="purple"
          />
        </div>
      </DocSection>
    </DocLayout>
  );
};

export default GettingStarted;
