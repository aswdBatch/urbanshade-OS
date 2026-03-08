import { Terminal, Folder, Cpu, Sparkles, HelpCircle, Zap, Search, ExternalLink, ChevronDown, Copy, Check, Network, Hash } from "lucide-react";
import { DocLayout, DocHero, DocSection, DocCode, DocAlert } from "@/components/docs";
import { useState, useMemo, useRef, useEffect } from "react";

interface Command {
  name: string;
  args?: string;
  description: string;
  category: string;
  related?: string[];
}

const ALL_COMMANDS: Command[] = [
  // Basic
  { name: "help", description: "Show all available commands", category: "Basic", related: ["status", "whoami"] },
  { name: "clear", description: "Clear the terminal screen", category: "Basic" },
  { name: "status", description: "Display current system status", category: "Basic", related: ["uptime", "neofetch"] },
  { name: "whoami", description: "Show current user identity", category: "Basic", related: ["help"] },
  { name: "date", description: "Display current date and time", category: "Basic", related: ["uptime"] },
  { name: "echo", args: "[text]", description: "Print text to the terminal", category: "Basic" },
  { name: "history", description: "Show command history", category: "Basic", related: ["clear"] },
  // File System
  { name: "ls", description: "List files in current directory", category: "File System", related: ["ls -la", "cd", "pwd"] },
  { name: "ls -la", description: "List all files with details", category: "File System", related: ["ls"] },
  { name: "cd", args: "[dir]", description: "Change directory", category: "File System", related: ["pwd", "ls"] },
  { name: "cd ..", description: "Go up one directory", category: "File System", related: ["cd", "pwd"] },
  { name: "pwd", description: "Print working directory path", category: "File System", related: ["cd", "ls"] },
  { name: "cat", args: "[file]", description: "Display file contents", category: "File System", related: ["ls", "head"] },
  { name: "mkdir", args: "[name]", description: "Create a new directory", category: "File System", related: ["rmdir", "ls"] },
  { name: "rm", args: "[file]", description: "Remove a file", category: "File System", related: ["cp", "mv"] },
  { name: "cp", args: "[src] [dst]", description: "Copy a file", category: "File System", related: ["mv", "rm"] },
  { name: "mv", args: "[src] [dst]", description: "Move or rename a file", category: "File System", related: ["cp", "rm"] },
  // System
  { name: "neofetch", description: "Show system information in style", category: "System", related: ["status", "uptime"] },
  { name: "uptime", description: "Display system uptime", category: "System", related: ["neofetch", "date"] },
  { name: "ps", description: "List running processes", category: "System", related: ["kill", "top"] },
  { name: "kill", args: "[pid]", description: "Terminate a process by ID", category: "System", related: ["ps", "top"] },
  { name: "top", description: "Interactive process viewer", category: "System", related: ["ps", "free"] },
  { name: "free", description: "Show memory usage", category: "System", related: ["df", "top"] },
  { name: "df", description: "Show disk space usage", category: "System", related: ["free", "ls"] },
  { name: "reboot", description: "Restart the system", category: "System", related: ["shutdown"] },
  { name: "shutdown", description: "Power off the system", category: "System", related: ["reboot"] },
  // Network
  { name: "ping", args: "[host]", description: "Test network connectivity", category: "Network", related: ["ifconfig", "curl"] },
  { name: "ifconfig", description: "Show network interfaces", category: "Network", related: ["netstat", "ping"] },
  { name: "netstat", description: "Display network statistics", category: "Network", related: ["ifconfig"] },
  { name: "curl", args: "[url]", description: "Fetch content from URL", category: "Network", related: ["wget", "ping"] },
  { name: "wget", args: "[url]", description: "Download file from URL", category: "Network", related: ["curl"] },
  // Secret
  { name: "secret", description: "Opens something special...", category: "Secret" },
  { name: "matrix", description: "Feel like Neo", category: "Secret" },
  { name: "panic", description: "Don't actually panic", category: "Secret" },
  { name: "fortune", description: "Wisdom from the deep", category: "Secret" },
  { name: "cow", args: "[text]", description: "Moo", category: "Secret" },
];

const CATEGORIES = ["Basic", "File System", "System", "Network", "Secret"] as const;

const categoryMeta: Record<string, { icon: React.ElementType; color: string; accent: string }> = {
  "Basic": { icon: HelpCircle, color: "cyan", accent: "text-cyan-400" },
  "File System": { icon: Folder, color: "blue", accent: "text-blue-400" },
  "System": { icon: Cpu, color: "green", accent: "text-green-400" },
  "Network": { icon: Network, color: "purple", accent: "text-purple-400" },
  "Secret": { icon: Sparkles, color: "amber", accent: "text-amber-400" },
};

// Inline copy button for command cells
const CopyableCommand = ({ cmd }: { cmd: Command }) => {
  const [copied, setCopied] = useState(false);
  const fullCmd = cmd.args ? `${cmd.name} ${cmd.args}` : cmd.name;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(fullCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center gap-2 group/cmd">
      <code className="text-cyan-400 font-mono text-sm">
        {cmd.name}
        {cmd.args && <span className="text-slate-500 ml-1">{cmd.args}</span>}
      </code>
      <button
        onClick={handleCopy}
        className="opacity-0 group-hover/cmd:opacity-100 transition-opacity p-0.5 rounded hover:bg-slate-700"
        title="Copy command"
      >
        {copied ? (
          <Check className="w-3 h-3 text-green-400" />
        ) : (
          <Copy className="w-3 h-3 text-slate-500" />
        )}
      </button>
    </div>
  );
};

const TerminalGuide = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(CATEGORIES));
  const searchRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: / to focus search
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

  const filteredCommands = useMemo(() => {
    if (!searchQuery) return ALL_COMMANDS;
    const q = searchQuery.toLowerCase();
    return ALL_COMMANDS.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      (c.args && c.args.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const commandsByCategory = useMemo(() => {
    const map: Record<string, Command[]> = {};
    for (const cat of CATEGORIES) {
      const cmds = filteredCommands.filter(c => c.category === cat);
      if (cmds.length > 0) map[cat] = cmds;
    }
    return map;
  }, [filteredCommands]);

  return (
    <DocLayout
      title="Terminal Guide"
      description="Complete command-line reference for Urbanshade OS terminal - basic commands, file operations, system commands, and hidden secrets."
      keywords={["terminal", "command line", "cli", "commands", "bash", "shell", "scripting"]}
      accentColor="cyan"
      prevPage={{ title: "Facility Apps", path: "/docs/facility" }}
      nextPage={{ title: "Admin Panel", path: "/docs/admin-panel" }}
    >
      <DocHero
        icon={Terminal}
        title="Terminal Guide"
        subtitle="The command-line interface is where the real power users thrive. Master these commands to control the facility like a true operator."
        accentColor="cyan"
      />

      {/* Terminal Prompt Preview */}
      <DocSection id="prompt">
        <div className="p-5 rounded-xl bg-slate-900/80 border border-cyan-500/30 font-mono text-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-cyan-400">user@urbanshade</span>
            <span>:</span>
            <span className="text-blue-400">~</span>
            <span>$</span>
            <span className="text-slate-200 ml-1 animate-pulse">_</span>
          </div>
          <p className="text-slate-500 text-xs mt-3">
            This is your terminal prompt. Type commands after the $ symbol and press Enter.
          </p>
          <a
            href="/?open=terminal"
            className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 text-xs font-medium hover:bg-cyan-500/25 border border-cyan-500/20 transition-all"
          >
            <ExternalLink className="w-3 h-3" />
            Try in Terminal
          </a>
        </div>
      </DocSection>

      {/* Searchable Command Index */}
      <DocSection title="Command Index" icon={Hash} accentColor="cyan" id="index">
        <p className="mb-4">
          Search {ALL_COMMANDS.length} commands across {CATEGORIES.length} categories.
        </p>

        {/* Search */}
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search commands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 text-sm transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-slate-700/50 border border-slate-600/50 text-slate-500 text-[10px] font-mono">
            /
          </kbd>
        </div>

        {searchQuery && (
          <p className="text-sm text-slate-500 mb-4">
            Found {filteredCommands.length} command{filteredCommands.length !== 1 ? 's' : ''} matching "{searchQuery}"
          </p>
        )}

        {/* Collapsible Category Sections */}
        <div className="space-y-3">
          {Object.entries(commandsByCategory).map(([category, commands]) => {
            const meta = categoryMeta[category];
            const Icon = meta.icon;
            const isExpanded = expandedCategories.has(category);
            const bgColors: Record<string, string> = {
              cyan: "bg-cyan-500/10 border-cyan-500/20",
              blue: "bg-blue-500/10 border-blue-500/20",
              green: "bg-green-500/10 border-green-500/20",
              purple: "bg-purple-500/10 border-purple-500/20",
              amber: "bg-amber-500/10 border-amber-500/20",
            };

            return (
              <div key={category} className="rounded-xl border border-slate-700/50 overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-4 bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${bgColors[meta.color]} border flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${meta.accent}`} />
                    </div>
                    <span className="font-semibold text-white">{category}</span>
                    <span className="text-xs text-slate-500">{commands.length} commands</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {/* Commands Table */}
                {isExpanded && (
                  <div className="divide-y divide-slate-800/50">
                    {commands.map((cmd) => (
                      <div key={cmd.name} className="flex items-start justify-between gap-4 px-4 py-3 hover:bg-slate-800/20 transition-colors group">
                        <div className="flex-1 min-w-0">
                          <CopyableCommand cmd={cmd} />
                          <p className="text-xs text-slate-500 mt-0.5">{cmd.description}</p>
                          {/* Related Commands */}
                          {cmd.related && cmd.related.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[10px] text-slate-600">Related:</span>
                              {cmd.related.map(r => (
                                <button
                                  key={r}
                                  onClick={() => setSearchQuery(r)}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-500 hover:bg-slate-700 transition-colors font-mono"
                                >
                                  {r}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {Object.keys(commandsByCategory).length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-500">No commands found matching "{searchQuery}"</p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-3 px-4 py-2 rounded-lg border border-slate-600 text-white hover:bg-slate-800 transition-colors text-sm"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      </DocSection>

      {/* Examples */}
      <DocSection title="Usage Examples" icon={Terminal} accentColor="cyan" id="examples">
        <DocCode
          title="Navigating the File System"
          code={`$ pwd
/home/user

$ ls
documents  downloads  pictures  notes.txt

$ cd documents
$ ls
report.md  specs.pdf  logs/

$ cat report.md
# Monthly Report
Facility status: Normal...`}
        />

        <div className="mt-4" />

        <DocCode
          title="System Administration"
          code={`$ neofetch
 ╔══════════════╗   user@urbanshade
 ║  URBANSHADE  ║   OS: UrbanShade OS v3.6.1
 ║     OS       ║   Uptime: 2h 47m
 ╚══════════════╝   Shell: ush 1.0

$ ps
  PID  NAME              STATUS
  001  system-monitor    running
  002  terminal          running
  003  file-explorer     running

$ kill 003
Process 003 (file-explorer) terminated.`}
        />
      </DocSection>

      {/* Terminal Shortcuts */}
      <DocSection title="Terminal Shortcuts" icon={Zap} accentColor="cyan" id="shortcuts">
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { key: "↑ / ↓", action: "Navigate command history" },
            { key: "Tab", action: "Auto-complete commands" },
            { key: "Ctrl+C", action: "Cancel current command" },
            { key: "Ctrl+L", action: "Clear screen" },
            { key: "Ctrl+U", action: "Clear current line" },
          ].map((s) => (
            <div key={s.key} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
              <kbd className="px-2.5 py-1 rounded bg-slate-900 text-cyan-400 text-xs font-mono border border-slate-700 flex-shrink-0">
                {s.key}
              </kbd>
              <span className="text-sm text-slate-400">{s.action}</span>
            </div>
          ))}
        </div>
      </DocSection>

      {/* Try it CTA */}
      <DocSection id="try-it">
        <div className="p-6 rounded-xl bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-cyan-500/10 border border-cyan-500/20 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="flex-1">
            <h4 className="font-semibold text-white text-lg">Ready to try it yourself?</h4>
            <p className="text-sm text-slate-400 mt-1">Open the terminal and start typing commands.</p>
          </div>
          <a
            href="/?open=terminal"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 transition-all font-medium text-sm whitespace-nowrap"
          >
            <Terminal className="w-4 h-4" />
            Open Terminal
          </a>
        </div>
      </DocSection>

      <DocAlert variant="tip" title="Pro Tip">
        Type <code className="text-cyan-400 font-mono">help</code> in the terminal for the most up-to-date list of all commands. The terminal also supports tab completion!
      </DocAlert>
    </DocLayout>
  );
};

export default TerminalGuide;
