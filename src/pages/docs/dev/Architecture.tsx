import { Layers, Box, Database, Zap, GitBranch, HardDrive, Monitor } from "lucide-react";
import { DocLayout, DocHero, DocSection, DocCard, DocCode } from "@/components/docs";

const Architecture = () => {
  const hookCategories = [
    { 
      category: "System", 
      hooks: ["useBootSequence", "useSystemSettings", "useSystemPreferences", "useBugcheck", "useAutoBugcheck", "useIdleLock", "useKeyboardShortcuts"] 
    },
    { 
      category: "Windows & Desktop", 
      hooks: ["useMultipleDesktops", "useWindowSnap", "useWindowGroups", "useDesktopGrid", "useWidgets"] 
    },
    { 
      category: "Social", 
      hooks: ["useFriends", "useMessages", "useGlobalChat", "useContacts", "useUserProfiles"] 
    },
    { 
      category: "Economy & Progression", 
      hooks: ["useKroner", "useShop", "useBattlePass", "useAchievements", "useQuests", "useLoginBonus", "useLeaderboards"] 
    },
    { 
      category: "Moderation & Security", 
      hooks: ["useModerationGates", "useBanCheck", "useNaviSecurity", "useNaviAutonomous"] 
    },
    { 
      category: "Data & Sync", 
      hooks: ["useAutoSync", "useSyncHistory", "useOnlineAccount", "useVirtualFileSystem", "useRecentFiles"] 
    },
  ];

  return (
    <DocLayout
      title="Architecture Overview"
      description="How UrbanShade OS is structured - boot flow, component hierarchy, state management, and hook architecture."
      keywords={["architecture", "react", "typescript", "components", "state", "hooks"]}
      accentColor="teal"
      breadcrumbs={[{ label: "Developer Docs", path: "/docs/dev" }]}
      prevPage={{ title: "Developer Docs", path: "/docs/dev" }}
      nextPage={{ title: "Theming", path: "/docs/dev/theming" }}
    >
      <DocHero
        icon={Layers}
        title="Architecture Overview"
        subtitle="How UrbanShade OS is structured under the hood."
        accentColor="teal"
      />

      <DocSection title="Technology Stack" icon={Box} accentColor="teal" id="stack">
        <div className="flex flex-wrap gap-3">
          {[
            { name: "React 18", desc: "UI library with hooks" },
            { name: "TypeScript", desc: "Type-safe JavaScript" },
            { name: "Tailwind CSS", desc: "Utility-first CSS" },
            { name: "Vite", desc: "Fast build tool" },
            { name: "Supabase", desc: "Auth, DB, edge functions" },
            { name: "shadcn/ui", desc: "Headless component primitives" }
          ].map((tech) => (
            <DocCard key={tech.name} title={tech.name} accentColor="teal">
              <p className="mt-1 text-xs text-slate-400">{tech.desc}</p>
            </DocCard>
          ))}
        </div>
      </DocSection>

      <DocSection title="Boot Flow" icon={Monitor} accentColor="teal" id="boot">
        <p className="text-slate-400 mb-4">
          The entire OS lifecycle is managed by <code className="px-2 py-0.5 bg-slate-800 rounded text-teal-400">src/pages/Index.tsx</code> — the "god component". 
          It holds all top-level state and passes it down. The boot sequence is orchestrated by <code className="px-2 py-0.5 bg-slate-800 rounded text-teal-400">useBootSequence</code>.
        </p>
        <DocCode
          title="Boot Sequence Flow"
          code={`Index.tsx (god component)
├── useBootSequence() orchestrates:
│   ├── BiosScreen → BootScreen → InstallationScreen → OOBEScreen
│   ├── DisclaimerScreen (first visit)
│   └── Desktop Environment (ready)
├── useModerationGates() checks:
│   ├── BannedScreen / TempBanPopup
│   ├── MaintenanceMode
│   └── LockdownScreen
└── Desktop Environment
    ├── Desktop (icons, wallpaper, widgets)
    ├── WindowManager (renders app windows)
    ├── Taskbar (start menu button, system tray)
    ├── StartMenu (app launcher)
    ├── NotificationCenter
    └── AltTabSwitcher`}
        />
      </DocSection>

      <DocSection title="State Management" icon={Database} accentColor="teal" id="state">
        <div className="space-y-3">
          <DocCard title="Local State (Index.tsx)" accentColor="teal">
            <p className="mt-2 text-sm text-slate-400">
              The god component holds windows[], openApps, desktop state, and passes everything via props. 
              No global state library — it's all React state + props.
            </p>
          </DocCard>
          <DocCard title="localStorage (persistence.ts)" accentColor="teal">
            <p className="mt-2 text-sm text-slate-400">
              Settings, accounts, installed apps, theme preferences, and virtual file system data are persisted 
              to localStorage. The <code className="text-teal-400">persistence.ts</code> module handles save/load.
            </p>
          </DocCard>
          <DocCard title="SystemBus (systemBus.ts)" accentColor="teal">
            <p className="mt-2 text-sm text-slate-400">
              A singleton pub/sub event bus for decoupled communication. Used to trigger crashes, reboots, 
              lockdowns, and other system events without direct prop drilling.
            </p>
          </DocCard>
          <DocCard title="React Query (Supabase)" accentColor="teal">
            <p className="mt-2 text-sm text-slate-400">
              Server state (profiles, messages, chat, achievements, shop items) is managed via React Query 
              with Supabase as the data source.
            </p>
          </DocCard>
        </div>
      </DocSection>

      <DocSection title="Window Lifecycle" icon={GitBranch} accentColor="teal" id="windows">
        <DocCode
          title="Window Data Model (src/types/window.ts)"
          code={`interface App {
  id: string;          // Unique app identifier
  name: string;        // Display name
  icon: ReactNode;     // Lucide icon element
  run: () => void;     // Opens the app window
  minimalInclude?: boolean;   // Shown in minimal install
  standardInclude?: boolean;  // Shown in standard install
  downloadable?: boolean;     // Available in App Store
  searchAliases?: string[];   // Search keywords
}

interface WindowData {
  id: string;          // Unique window instance ID
  app: App;            // The app definition
  zIndex: number;      // Stacking order
  minimized?: boolean; // Window state
}`}
        />
        <p className="text-slate-400 mt-4">
          Apps are registered in <code className="text-teal-400">appRegistry.tsx</code> and rendered 
          by <code className="text-teal-400">WindowManager.tsx</code> via a switch on the app ID. 
          See the <a href="/docs/dev/apps" className="text-teal-400 hover:underline">Building Apps</a> guide for details.
        </p>
      </DocSection>

      <DocSection title="Hook Architecture" icon={Zap} accentColor="teal" id="hooks">
        <p className="text-slate-400 mb-4">
          Business logic is extracted into 40+ custom hooks organized by domain:
        </p>
        <div className="space-y-4">
          {hookCategories.map((cat) => (
            <div key={cat.category} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700">
              <h4 className="font-semibold text-teal-100 mb-2">{cat.category}</h4>
              <div className="flex flex-wrap gap-2">
                {cat.hooks.map(hook => (
                  <code key={hook} className="text-xs px-2 py-1 rounded bg-slate-900 text-slate-300 font-mono">
                    {hook}
                  </code>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Virtual File System" icon={HardDrive} accentColor="teal" id="vfs">
        <p className="text-slate-400">
          The <code className="text-teal-400">useVirtualFileSystem</code> hook provides an in-memory 
          file system with directories and files, persisted to localStorage. Used by the File Explorer, 
          Terminal, and Notepad apps. Supports create, read, delete, and directory traversal operations.
        </p>
      </DocSection>
    </DocLayout>
  );
};

export default Architecture;
