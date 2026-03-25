import { useState, useEffect, useRef, useMemo } from "react";
import { Package, Download, Star, CheckCircle, Trash2, Search, X, LayoutGrid, Play, Loader2, ChevronLeft, Tag, User, ArrowDownToLine, Sparkles, Grid3x3, Filter } from "lucide-react";
import { 
  UUR_REAL_PACKAGES, 
  getUURAppHtml, 
  getInstalledUURApps, 
  installUURApp, 
  uninstallUURApp,
  isUURAppInstalled,
  getAllPackages,
  UUR_CATEGORIES,
  type InstalledUURApp,
  type UURPackage,
  type UURCategory
} from "@/lib/uurRepository";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UURAppProps {
  onClose: () => void;
}

type ViewMode = 'terminal' | 'gui' | 'run';

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'success' | 'warning' | 'info';
  text: string;
}

// Category color map for consistent styling
const CATEGORY_COLORS: Record<UURCategory, string> = {
  app: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  utility: 'text-green-400 bg-green-500/10 border-green-500/20',
  theme: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  extension: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  game: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  productivity: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  security: 'text-red-400 bg-red-500/10 border-red-500/20',
  system: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
};

// --- GUI Components ---

const PackageDetailView = ({ pkg, onBack, onInstall, onUninstall, onRun, isInstalled, isInstalling }: {
  pkg: UURPackage;
  onBack: () => void;
  onInstall: () => void;
  onUninstall: () => void;
  onRun: () => void;
  isInstalled: boolean;
  isInstalling: boolean;
}) => {
  const catInfo = UUR_CATEGORIES.find(c => c.id === pkg.category);
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-cyan-500/20 bg-slate-900/80 flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5 text-slate-400" />
        </button>
        <span className="text-sm font-medium text-slate-300">Package Details</span>
      </div>
      <ScrollArea className="flex-1 p-5">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-xl border flex items-center justify-center text-2xl ${CATEGORY_COLORS[pkg.category]}`}>
              {catInfo?.icon || '📦'}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white">{pkg.name}</h2>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                <User className="w-3 h-3" /> {pkg.author}
                <span>•</span>
                <span>v{pkg.version}</span>
                {pkg.isOfficial && <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-[10px] font-bold">OFFICIAL</span>}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {isInstalled ? (
              <>
                <button onClick={onRun} className="flex-1 py-2.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <Play className="w-4 h-4" /> Run
                </button>
                <button onClick={onUninstall} className="px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button onClick={onInstall} disabled={isInstalling} className="flex-1 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {isInstalling ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownToLine className="w-4 h-4" />}
                {isInstalling ? 'Installing...' : 'Install'}
              </button>
            )}
          </div>

          {/* Install Progress */}
          {isInstalling && (
            <div className="space-y-2">
              <Progress value={66} className="h-1.5" />
              <p className="text-xs text-slate-500 text-center">Downloading and verifying package...</p>
            </div>
          )}

          {/* Description */}
          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <h3 className="text-xs font-semibold text-slate-400 mb-2">Description</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{pkg.description}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 text-center">
              <Download className="w-4 h-4 text-slate-500 mx-auto mb-1" />
              <p className="text-sm font-bold text-white">{pkg.downloads.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500">Downloads</p>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 text-center">
              <Star className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <p className="text-sm font-bold text-white">{pkg.stars}</p>
              <p className="text-[10px] text-slate-500">Stars</p>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 text-center">
              <Tag className="w-4 h-4 text-slate-500 mx-auto mb-1" />
              <p className="text-sm font-bold text-white capitalize">{pkg.category}</p>
              <p className="text-[10px] text-slate-500">Category</p>
            </div>
          </div>

          {/* Tags */}
          {pkg.tags && pkg.tags.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {pkg.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-xs border border-slate-700/50">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Dependencies */}
          {pkg.dependencies && pkg.dependencies.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 mb-2">Dependencies</h3>
              <div className="space-y-1">
                {pkg.dependencies.map(dep => (
                  <div key={dep} className="text-xs text-slate-500 flex items-center gap-2">
                    <Package className="w-3 h-3" /> {dep}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export const UURApp = ({ onClose }: UURAppProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('terminal');
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [installedApps, setInstalledApps] = useState<InstalledUURApp[]>([]);
  const [allPackages, setAllPackages] = useState<UURPackage[]>([]);
  const [runningApp, setRunningApp] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [guiSearch, setGuiSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<UURCategory | 'all'>('all');
  const [detailPkg, setDetailPkg] = useState<UURPackage | null>(null);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInstalledApps(getInstalledUURApps());
    setAllPackages(getAllPackages());
    setTerminalLines([
      { type: 'info', text: '------------------------------------------' },
      { type: 'info', text: 'UUR Terminal v1.2' },
      { type: 'info', text: '------------------------------------------' },
      { type: 'warning', text: 'The UUR terminal is not recommended' },
      { type: 'warning', text: 'for inexperienced users.' },
      { type: 'info', text: 'For GUI install do "uur gui"' },
      { type: 'info', text: '------------------------------------------' },
      { type: 'output', text: '' },
      { type: 'output', text: 'Type "help" for available commands.' },
    ]);
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  const addLine = (type: TerminalLine['type'], text: string) => {
    setTerminalLines(prev => [...prev, { type, text }]);
  };

  const refreshPackages = () => {
    setAllPackages(getAllPackages());
    setInstalledApps(getInstalledUURApps());
  };

  // Filtered packages for GUI
  const filteredPackages = useMemo(() => {
    let pkgs = allPackages;
    if (selectedCategory !== 'all') {
      pkgs = pkgs.filter(p => p.category === selectedCategory);
    }
    if (guiSearch.trim()) {
      const q = guiSearch.toLowerCase();
      pkgs = pkgs.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    return pkgs;
  }, [allPackages, selectedCategory, guiSearch]);

  const handleGuiInstall = async (pkg: UURPackage) => {
    setInstallingId(pkg.id);
    await new Promise(r => setTimeout(r, 1200));
    if (installUURApp(pkg.id)) {
      refreshPackages();
      toast.success(`Installed ${pkg.name}`);
    }
    setInstallingId(null);
  };

  const handleGuiUninstall = (pkg: UURPackage) => {
    uninstallUURApp(pkg.id);
    refreshPackages();
    toast.success(`Removed ${pkg.name}`);
  };

  const processCommand = async (cmd: string) => {
    const parts = cmd.trim().toLowerCase().split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    addLine('input', `> ${cmd}`);
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 100));

    switch (command) {
      case 'help':
        addLine('info', 'Available commands:');
        addLine('output', '  uur gui          - Open graphical interface');
        addLine('output', '  uur list         - List all available packages');
        addLine('output', '  uur installed    - List installed packages');
        addLine('output', '  uur install <id> - Install a package');
        addLine('output', '  uur remove <id>  - Remove a package');
        addLine('output', '  uur run <id>     - Run an installed package');
        addLine('output', '  uur search <q>   - Search packages');
        addLine('output', '  uur info <id>    - Show package info');
        addLine('output', '  clear            - Clear terminal');
        addLine('output', '  exit             - Close UUR');
        break;
      case 'uur':
        if (args[0] === 'gui') {
          addLine('success', 'Opening GUI mode...');
          setTimeout(() => setViewMode('gui'), 500);
        } else if (args[0] === 'list') {
          addLine('info', `Found ${allPackages.length} packages:`);
          allPackages.forEach(pkg => {
            const installed = isUURAppInstalled(pkg.id);
            addLine('output', `  ${installed ? '[✓]' : '[ ]'} ${pkg.id} - ${pkg.name} v${pkg.version}`);
          });
        } else if (args[0] === 'installed') {
          if (installedApps.length === 0) {
            addLine('warning', 'No packages installed.');
          } else {
            addLine('info', `Installed packages (${installedApps.length}):`);
            installedApps.forEach(app => addLine('output', `  ${app.id} - ${app.name} v${app.version}`));
          }
        } else if (args[0] === 'install' && args[1]) {
          const pkg = allPackages.find(p => p.id.toLowerCase() === args[1]);
          if (!pkg) addLine('error', `Package "${args[1]}" not found.`);
          else if (isUURAppInstalled(pkg.id)) addLine('warning', `"${pkg.name}" is already installed.`);
          else {
            addLine('output', `Installing ${pkg.name}...`);
            await new Promise(r => setTimeout(r, 1000));
            if (installUURApp(pkg.id)) { refreshPackages(); addLine('success', `✓ Installed ${pkg.name}`); }
            else addLine('error', 'Installation failed.');
          }
        } else if (args[0] === 'remove' && args[1]) {
          const installed = installedApps.find(a => a.id.toLowerCase() === args[1]);
          if (!installed) addLine('error', `"${args[1]}" is not installed.`);
          else {
            addLine('output', `Removing ${installed.name}...`);
            await new Promise(r => setTimeout(r, 500));
            if (uninstallUURApp(installed.id)) { refreshPackages(); addLine('success', `✓ Removed ${installed.name}`); }
            else addLine('error', 'Removal failed.');
          }
        } else if (args[0] === 'run' && args[1]) {
          const installed = installedApps.find(a => a.id.toLowerCase() === args[1]);
          if (!installed) addLine('error', `"${args[1]}" is not installed.`);
          else { addLine('success', `Launching ${installed.name}...`); setRunningApp(installed.id); setViewMode('run'); }
        } else if (args[0] === 'search' && args[1]) {
          const query = args.slice(1).join(' ');
          const results = allPackages.filter(p => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query));
          if (results.length === 0) addLine('warning', `No packages found for "${query}"`);
          else { addLine('info', `Found ${results.length} packages:`); results.forEach(pkg => addLine('output', `  ${pkg.id} - ${pkg.name}`)); }
        } else if (args[0] === 'info' && args[1]) {
          const pkg = allPackages.find(p => p.id.toLowerCase() === args[1]);
          if (!pkg) addLine('error', `Package "${args[1]}" not found.`);
          else {
            addLine('info', `Package: ${pkg.name}`);
            addLine('output', `  ID: ${pkg.id}`);
            addLine('output', `  Version: ${pkg.version}`);
            addLine('output', `  Author: ${pkg.author}`);
            addLine('output', `  Category: ${pkg.category}`);
            addLine('output', `  Description: ${pkg.description}`);
            addLine('output', `  Installed: ${isUURAppInstalled(pkg.id) ? 'Yes' : 'No'}`);
          }
        } else addLine('error', 'Unknown uur command. Type "help" for usage.');
        break;
      case 'clear': setTerminalLines([]); break;
      case 'exit': onClose(); break;
      case '': break;
      default:
        addLine('error', `Command not found: ${command}`);
        addLine('output', 'Type "help" for available commands.');
    }
    setIsProcessing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isProcessing) {
      processCommand(currentInput);
      setCurrentInput("");
    }
  };

  // GUI Mode
  if (viewMode === 'gui') {
    // Detail view
    if (detailPkg) {
      return (
        <div className="h-full flex flex-col bg-slate-950 text-white">
          <PackageDetailView
            pkg={detailPkg}
            onBack={() => setDetailPkg(null)}
            onInstall={() => handleGuiInstall(detailPkg)}
            onUninstall={() => { handleGuiUninstall(detailPkg); setDetailPkg(null); }}
            onRun={() => { setRunningApp(detailPkg.id); setViewMode('run'); }}
            isInstalled={isUURAppInstalled(detailPkg.id)}
            isInstalling={installingId === detailPkg.id}
          />
        </div>
      );
    }

    const installedPkgs = filteredPackages.filter(p => isUURAppInstalled(p.id));
    const availablePkgs = filteredPackages.filter(p => !isUURAppInstalled(p.id));
    const featured = allPackages.filter(p => p.isFeatured && !isUURAppInstalled(p.id));

    return (
      <div className="h-full flex flex-col bg-slate-950 text-white">
        {/* GUI Header */}
        <div className="p-4 border-b border-cyan-500/20 bg-slate-900/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
              <Package className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-cyan-400">UUR Manager</h1>
              <p className="text-[10px] text-slate-500">{allPackages.length} packages available</p>
            </div>
          </div>
          <button onClick={() => setViewMode('terminal')} className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors">
            Terminal
          </button>
        </div>

        {/* Search + Category Tabs */}
        <div className="px-4 pt-3 pb-2 space-y-3 shrink-0 border-b border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={guiSearch}
              onChange={(e) => setGuiSearch(e.target.value)}
              placeholder="Search packages..."
              className="w-full pl-10 pr-8 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
            {guiSearch && (
              <button onClick={() => setGuiSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-transparent'
              }`}
            >
              <Grid3x3 className="w-3 h-3 inline mr-1" />All
            </button>
            {UUR_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id ? `${CATEGORY_COLORS[cat.id]} border` : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-transparent'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-5">
            {/* Featured - only on "all" tab with no search */}
            {selectedCategory === 'all' && !guiSearch && featured.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Featured
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {featured.slice(0, 4).map(pkg => {
                    const catInfo = UUR_CATEGORIES.find(c => c.id === pkg.category);
                    return (
                      <button
                        key={pkg.id}
                        onClick={() => setDetailPkg(pkg)}
                        className="p-3 bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-slate-700/50 rounded-xl text-left hover:border-cyan-500/30 transition-all group"
                      >
                        <div className="text-lg mb-1">{catInfo?.icon}</div>
                        <p className="font-medium text-sm text-white group-hover:text-cyan-400 transition-colors">{pkg.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{pkg.author} • ⭐ {pkg.stars}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Installed */}
            {installedPkgs.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" /> Installed ({installedPkgs.length})
                </h2>
                <div className="grid gap-2">
                  {installedPkgs.map(pkg => (
                    <button
                      key={pkg.id}
                      onClick={() => setDetailPkg(pkg)}
                      className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:border-green-500/30 transition-all text-left group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center text-sm ${CATEGORY_COLORS[pkg.category]}`}>
                          {UUR_CATEGORIES.find(c => c.id === pkg.category)?.icon || '📦'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{pkg.name}</p>
                          <p className="text-xs text-slate-500">v{pkg.version} • {pkg.author}</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => { setRunningApp(pkg.id); setViewMode('run'); }}
                          className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleGuiUninstall(pkg)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Available */}
            <div>
              <h2 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" /> Available{selectedCategory !== 'all' ? ` in ${UUR_CATEGORIES.find(c => c.id === selectedCategory)?.name}` : ''} ({availablePkgs.length})
              </h2>
              {availablePkgs.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                  <p className="text-sm text-slate-500">
                    {guiSearch ? `No packages found for "${guiSearch}"` : 'No packages available in this category'}
                  </p>
                  {guiSearch && (
                    <button onClick={() => setGuiSearch('')} className="mt-2 text-xs text-cyan-400 hover:underline">
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-2">
                  {availablePkgs.map(pkg => (
                    <button
                      key={pkg.id}
                      onClick={() => setDetailPkg(pkg)}
                      className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:border-cyan-500/30 transition-all text-left group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center text-sm ${CATEGORY_COLORS[pkg.category]}`}>
                          {UUR_CATEGORIES.find(c => c.id === pkg.category)?.icon || '📦'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate group-hover:text-cyan-400 transition-colors">{pkg.name}</p>
                          <p className="text-xs text-slate-500 truncate">{pkg.description}</p>
                        </div>
                      </div>
                      <div className="shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleGuiInstall(pkg)}
                          disabled={installingId === pkg.id}
                          className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          {installingId === pkg.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowDownToLine className="w-3 h-3" />}
                          {installingId === pkg.id ? '...' : 'Install'}
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Run Mode
  if (viewMode === 'run' && runningApp) {
    const appHtml = getUURAppHtml(runningApp);
    return (
      <div className="h-full flex flex-col bg-slate-950">
        <div className="p-2 border-b border-cyan-500/20 bg-slate-900/80 flex items-center justify-between">
          <span className="text-sm text-cyan-400 font-mono">Running: {runningApp}</span>
          <button onClick={() => { setRunningApp(null); setViewMode('gui'); }} className="p-1.5 hover:bg-slate-800 rounded transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <div className="flex-1">
          {appHtml ? (
            <iframe srcDoc={appHtml} className="w-full h-full border-0" sandbox="allow-scripts" title={runningApp} />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">App content not available</div>
          )}
        </div>
      </div>
    );
  }

  // Terminal Mode
  return (
    <div className="h-full flex flex-col bg-slate-950 font-mono text-sm">
      <div ref={terminalRef} className="flex-1 p-4 overflow-y-auto" onClick={() => inputRef.current?.focus()}>
        {terminalLines.map((line, i) => (
          <div key={i} className={`leading-relaxed ${
            line.type === 'input' ? 'text-cyan-400' :
            line.type === 'error' ? 'text-red-400' :
            line.type === 'success' ? 'text-green-400' :
            line.type === 'warning' ? 'text-amber-400' :
            line.type === 'info' ? 'text-slate-500' :
            'text-slate-300'
          }`}>
            {line.text}
          </div>
        ))}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-cyan-400">{">"}</span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            className="flex-1 bg-transparent text-slate-300 outline-none caret-cyan-400"
            autoFocus
          />
          {isProcessing && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
        </div>
      </div>
    </div>
  );
};
