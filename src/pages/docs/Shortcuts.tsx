import { Keyboard, Power, Monitor, Terminal, Lightbulb, Search, Zap } from "lucide-react";
import { DocLayout, DocHero, DocSection, DocAlert } from "@/components/docs";
import { useState, useMemo, useRef, useEffect } from "react";

interface Shortcut {
  keys: string[];
  action: string;
  context: string;
  category: string;
}

const ALL_SHORTCUTS: Shortcut[] = [
  // Boot
  { keys: ["DEL"], action: "Access BIOS settings", context: "During boot", category: "Boot" },
  { keys: ["F2"], action: "Enter Recovery Mode", context: "During boot", category: "Boot" },
  { keys: ["F8"], action: "Boot into Safe Mode", context: "During boot", category: "Boot" },
  { keys: ["ESC"], action: "Skip boot animation", context: "During boot", category: "Boot" },

  // Desktop
  { keys: ["Shift", "/"], action: "Toggle global search", context: "Desktop", category: "Desktop" },
  { keys: ["Shift", "Tab"], action: "Alt-Tab window switcher", context: "Desktop", category: "Desktop" },
  { keys: ["Shift", "Esc"], action: "Open Task Manager", context: "Desktop", category: "Desktop" },
  { keys: ["Shift", "D"], action: "Minimize all / Show desktop", context: "Desktop", category: "Desktop" },
  { keys: ["Shift", "E"], action: "Open File Explorer", context: "Desktop", category: "Desktop" },
  { keys: ["Shift", "T"], action: "Open Terminal", context: "Desktop", category: "Desktop" },
  { keys: ["Shift", "I"], action: "Open Settings", context: "Desktop", category: "Desktop" },
  { keys: ["Shift", "L"], action: "Lock screen", context: "Desktop", category: "Desktop" },
  { keys: ["Shift", "Q"], action: "Close focused window", context: "Desktop", category: "Desktop" },
  { keys: ["Shift", "M"], action: "Minimize focused window", context: "Desktop", category: "Desktop" },
  { keys: ["Shift", "W"], action: "Task View", context: "Desktop", category: "Desktop" },
  { keys: ["F11"], action: "Toggle fullscreen", context: "Desktop", category: "Desktop" },

  // Terminal
  { keys: ["↑"], action: "Previous command in history", context: "Terminal", category: "Terminal" },
  { keys: ["↓"], action: "Next command in history", context: "Terminal", category: "Terminal" },
  { keys: ["Tab"], action: "Auto-complete command", context: "Terminal", category: "Terminal" },
  { keys: ["Ctrl", "C"], action: "Cancel current command", context: "Terminal", category: "Terminal" },
  { keys: ["Ctrl", "L"], action: "Clear terminal screen", context: "Terminal", category: "Terminal" },
  { keys: ["Ctrl", "U"], action: "Clear current input line", context: "Terminal", category: "Terminal" },
];

const CATEGORIES = ["Boot", "Desktop", "Terminal"] as const;

const categoryColors: Record<string, { border: string; text: string; bg: string; icon: typeof Power }> = {
  Boot: { border: "border-amber-500/30", text: "text-amber-400", bg: "bg-amber-500/10", icon: Power },
  Desktop: { border: "border-blue-500/30", text: "text-blue-400", bg: "bg-blue-500/10", icon: Monitor },
  Terminal: { border: "border-green-500/30", text: "text-green-400", bg: "bg-green-500/10", icon: Terminal },
};

const KeyCombo = ({ keys, color = "cyan" }: { keys: string[]; color?: string }) => {
  const borderColor: Record<string, string> = {
    cyan: "border-cyan-500/30 text-cyan-400",
    amber: "border-amber-500/30 text-amber-400",
    blue: "border-blue-500/30 text-blue-400",
    green: "border-green-500/30 text-green-400",
  };
  return (
    <span className="flex items-center gap-1">
      {keys.map((key, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-slate-600 text-xs">+</span>}
          <kbd className={`px-2 py-1 bg-slate-900 rounded border font-mono text-sm ${borderColor[color]}`}>
            {key}
          </kbd>
        </span>
      ))}
    </span>
  );
};

const Shortcuts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery) return ALL_SHORTCUTS;
    const q = searchQuery.toLowerCase();
    return ALL_SHORTCUTS.filter(s =>
      s.action.toLowerCase().includes(q) ||
      s.keys.join(' ').toLowerCase().includes(q) ||
      s.context.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const groupedByCategory = useMemo(() => {
    const map: Record<string, Shortcut[]> = {};
    for (const s of filtered) {
      if (!map[s.category]) map[s.category] = [];
      map[s.category].push(s);
    }
    return map;
  }, [filtered]);

  return (
    <DocLayout
      title="Keyboard Shortcuts"
      description="Complete keyboard shortcut reference for Urbanshade OS — boot, desktop, and terminal shortcuts with search and printable cheat sheet."
      keywords={["shortcuts", "keyboard", "hotkeys", "keys", "commands", "keybindings"]}
      accentColor="blue"
      prevPage={{ title: "Admin Panel", path: "/docs/admin-panel" }}
      nextPage={{ title: "Troubleshooting", path: "/docs/troubleshooting" }}
    >
      <DocHero
        icon={Keyboard}
        title="Keyboard Shortcuts"
        subtitle={`${ALL_SHORTCUTS.length} shortcuts across ${CATEGORIES.length} contexts. All desktop shortcuts use Shift as the modifier to avoid conflicts with your real OS.`}
        accentColor="blue"
      />

      <DocAlert variant="info">
        UrbanShade uses <strong>Shift</strong> as its modifier key (not Ctrl/Alt) so shortcuts never conflict with your browser or OS. Boot shortcuts are the exception — they have no modifier.
      </DocAlert>

      {/* Search */}
      <DocSection id="search">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search shortcuts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 text-sm transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-slate-700/50 border border-slate-600/50 text-slate-500 text-[10px] font-mono">/</kbd>
        </div>
        {searchQuery && (
          <p className="text-sm text-slate-500 mt-3">
            Found {filtered.length} shortcut{filtered.length !== 1 ? 's' : ''} matching "{searchQuery}"
          </p>
        )}
      </DocSection>

      {/* Shortcut Tables by Category */}
      {CATEGORIES.map((category) => {
        const shortcuts = groupedByCategory[category];
        if (!shortcuts || shortcuts.length === 0) return null;
        const meta = categoryColors[category];
        const Icon = meta.icon;
        const colorName = category === "Boot" ? "amber" : category === "Desktop" ? "blue" : "green";

        return (
          <DocSection key={category} title={category} icon={Icon} accentColor={colorName as "amber" | "blue" | "green"} id={category.toLowerCase()}>
            <div className="rounded-xl border border-slate-700/50 overflow-hidden">
              {shortcuts.map((shortcut, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-800/30 transition-colors ${
                    i > 0 ? "border-t border-slate-800/50" : ""
                  }`}
                >
                  <KeyCombo keys={shortcut.keys} color={colorName} />
                  <span className="flex-1 text-sm text-slate-300">{shortcut.action}</span>
                  <span className="text-xs text-slate-600 hidden sm:block">{shortcut.context}</span>
                </div>
              ))}
            </div>
          </DocSection>
        );
      })}

      {Object.keys(groupedByCategory).length === 0 && (
        <div className="text-center py-8">
          <p className="text-slate-500">No shortcuts found matching "{searchQuery}"</p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-3 px-4 py-2 rounded-lg border border-slate-600 text-white hover:bg-slate-800 transition-colors text-sm"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Printable Cheat Sheet */}
      <DocSection title="Quick Cheat Sheet" icon={Zap} accentColor="cyan" id="cheat-sheet">
        <p className="text-sm text-slate-500 mb-4">The essentials at a glance. Print this or screenshot it!</p>
        <div className="p-6 rounded-xl bg-slate-900/80 border border-cyan-500/20 space-y-4 print:border-black print:bg-white">
          <h4 className="font-mono text-cyan-400 text-sm uppercase tracking-wider">URBANSHADE OS — SHORTCUT REFERENCE</h4>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            {CATEGORIES.map((cat) => {
              const colorName = cat === "Boot" ? "amber" : cat === "Desktop" ? "blue" : "green";
              const textColor = categoryColors[cat].text;
              const shortcuts = ALL_SHORTCUTS.filter(s => s.category === cat);
              return (
                <div key={cat}>
                  <h5 className={`font-semibold mb-2 ${textColor}`}>{cat}</h5>
                  <div className="space-y-1.5">
                    {shortcuts.slice(0, 6).map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-400 w-24 flex-shrink-0 truncate">
                          {s.keys.join("+")}
                        </span>
                        <span className="text-xs text-slate-500 truncate">{s.action}</span>
                      </div>
                    ))}
                    {shortcuts.length > 6 && (
                      <span className="text-xs text-slate-600">+{shortcuts.length - 6} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DocSection>

      {/* Secret */}
      <DocSection title="The Secret Combo" icon={Lightbulb} accentColor="amber" id="secret">
        <div className="p-6 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-4">
          <p className="text-slate-300">
            There's a secret key combination that does something special.
            We're not going to tell you what it is. That's the point of a secret.
          </p>
          <p className="text-sm text-amber-400 italic">
            Hint: It involves the Konami Code. Or does it? 🤔
          </p>
        </div>
      </DocSection>

      <DocAlert variant="tip" title="Pro Tip">
        All desktop shortcuts use <strong>Shift</strong> as the modifier. If a shortcut isn't working, make sure you're not focused on a text input field.
      </DocAlert>
    </DocLayout>
  );
};

export default Shortcuts;
