import { HelpCircle, AlertTriangle, CheckCircle, XCircle, RotateCcw, Bug, Wrench, ChevronDown, Search, ExternalLink, Hash, ArrowRight, Zap, LifeBuoy } from "lucide-react";
import { DocLayout, DocHero, DocSection, DocCard, DocAlert } from "@/components/docs";
import { useState, useMemo, useRef, useEffect } from "react";

// Decision tree for "What's wrong?"
interface TreeNode {
  question: string;
  options: { label: string; next?: string; answer?: string }[];
}

const decisionTree: Record<string, TreeNode> = {
  start: {
    question: "What kind of problem are you experiencing?",
    options: [
      { label: "System won't boot", next: "boot" },
      { label: "Settings / data lost", next: "data" },
      { label: "App not working", next: "app" },
      { label: "Got banned / moderated", next: "ban" },
    ],
  },
  boot: {
    question: "What happens when you load the page?",
    options: [
      { label: "Blank screen", answer: "Hard refresh (Ctrl+Shift+R) to clear cached assets. If still blank, clear localStorage via browser DevTools → Application → Storage." },
      { label: "Stuck on boot screen", answer: "Press ESC to skip the boot animation. If stuck permanently, press F2 for Recovery Mode or clear localStorage." },
      { label: "Bugcheck / crash screen", answer: "Click 'Reboot Now' on the crash screen. If it keeps crashing, use F8 during boot for Safe Mode, or F2 for Recovery Mode → Factory Reset." },
      { label: "Login loop", answer: "Your saved password may be corrupted. Use F2 → Recovery Mode → Reset Password. Or clear localStorage to start fresh." },
    ],
  },
  data: {
    question: "What data was affected?",
    options: [
      { label: "Desktop icons / layout", answer: "Window positions are not persisted between sessions — this is expected. Desktop icon positions reset on refresh. Your installed apps are preserved." },
      { label: "System settings", answer: "Check if your browser allows localStorage. Incognito/private mode blocks it. If you have an account, use Settings → Sync to restore from cloud." },
      { label: "Account / profile", answer: "Account data is stored in Supabase and persists across sessions. If your profile seems wrong, try logging out and back in. Check Account Settings for details." },
      { label: "Everything is gone", answer: "Someone (maybe you) cleared localStorage. If you had an account with sync enabled, log in again and your data will restore. Otherwise, use Recovery Mode (F2) for options." },
    ],
  },
  app: {
    question: "Which app has the issue?",
    options: [
      { label: "Terminal", answer: "Try typing 'help' to see available commands. If the terminal is frozen, close and reopen it. Some commands only work in specific contexts." },
      { label: "File Explorer", answer: "The virtual file system resets between sessions unless synced. Files you created will be gone after refresh. This is expected behavior." },
      { label: "DEF-DEV", answer: "You must accept the DEF-DEV warning screen first. Make sure Developer Mode is enabled in Settings → Developer Options. The console won't capture logs from before it was opened." },
      { label: "Other app", answer: "Try closing and reopening the app. If it's a downloadable app, uninstall and reinstall from the App Store. Check if the app requires specific permissions or clearance level." },
    ],
  },
  ban: {
    question: "What happened?",
    options: [
      { label: "Permanently banned", answer: "You can submit a ban appeal from the ban screen. Appeals are reviewed manually. Make sure to explain why the ban should be lifted." },
      { label: "Temporarily banned", answer: "Temp bans expire automatically. The ban screen shows when it expires. Wait it out or submit an appeal if you believe it was a mistake." },
      { label: "Warning received", answer: "Warnings are informational. They don't restrict access but accumulate. Multiple warnings may lead to temporary or permanent bans." },
      { label: "Fake moderation (DEF-DEV)", answer: "If you triggered a fake moderation action from DEF-DEV, it only affects your local session. Refresh the page to clear it." },
    ],
  },
};

// Error codes reference
const errorCodes = [
  { code: "IRQL_NOT_LESS_OR_EQUAL", description: "Memory access violation — usually a simulated crash", severity: "critical" },
  { code: "KERNEL_DATA_INPAGE_ERROR", description: "Disk read failure in the virtual file system", severity: "critical" },
  { code: "CRITICAL_PROCESS_DIED", description: "A core system process was terminated", severity: "critical" },
  { code: "SYSTEM_SERVICE_EXCEPTION", description: "An app caused an unhandled exception", severity: "high" },
  { code: "MEMORY_MANAGEMENT", description: "Virtual memory subsystem error", severity: "high" },
  { code: "PAGE_FAULT_IN_NONPAGED_AREA", description: "Invalid memory reference", severity: "high" },
  { code: "DRIVER_POWER_STATE_FAILURE", description: "Power state transition error", severity: "medium" },
  { code: "WHEA_UNCORRECTABLE_ERROR", description: "Hardware abstraction layer error", severity: "medium" },
];

// FAQ data
const faqs = [
  { question: "I forgot my boot password!", answer: "Press F2 during boot to enter Recovery Mode. From there, you can reset your password or do a factory reset.", solution: "Recovery Mode → Reset Password", category: "Boot" },
  { question: "The system won't boot!", answer: "Try refreshing the page. If that doesn't work, clear localStorage for this site. Some cached data might be corrupted.", solution: "Refresh page or clear localStorage", category: "Boot" },
  { question: "My settings aren't saving!", answer: "Check if your browser allows localStorage. Private/incognito mode often blocks it. Also check storage quota.", solution: "Check browser storage settings", category: "Data" },
  { question: "Can I export/import my data?", answer: "Yes! Go to Settings → System → Export/Import. The file must be valid JSON. Don't modify the export file manually.", solution: "Settings → System → Export", category: "Data" },
  { question: "How do I enable Developer Mode?", answer: "Go to Settings → Developer Options and toggle Developer Mode on. This unlocks DEF-DEV and additional debugging tools.", solution: "Settings → Developer Options", category: "Apps" },
  { question: "Everything is broken!", answer: "Go to Recovery Mode (F2 during boot) and do a Factory Reset. Sometimes you just need a fresh start.", solution: "Factory Reset via Recovery Mode", category: "Nuclear" },
  { question: "How do I get Kroner?", answer: "Earn Kroner through daily login bonuses, completing quests, and Battle Pass rewards. Check the Shop for current prices.", solution: "Login daily + complete quests", category: "Account" },
  { question: "What's my clearance level?", answer: "Check your profile in Account Settings. Clearance increases through achievements, time spent, and admin grants.", solution: "Account Settings → Profile", category: "Account" },
];

const DecisionWizard = () => {
  const [path, setPath] = useState<string[]>(["start"]);
  const [answer, setAnswer] = useState<string | null>(null);

  const currentNode = decisionTree[path[path.length - 1]];

  const handleOption = (option: { label: string; next?: string; answer?: string }) => {
    if (option.answer) {
      setAnswer(option.answer);
    } else if (option.next) {
      setPath(prev => [...prev, option.next!]);
    }
  };

  const reset = () => {
    setPath(["start"]);
    setAnswer(null);
  };

  if (answer) {
    return (
      <div className="p-5 rounded-xl bg-green-500/10 border border-green-500/30 space-y-3">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-green-300 text-sm">Solution</h4>
            <p className="text-sm text-slate-300 mt-1">{answer}</p>
          </div>
        </div>
        <button onClick={reset} className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1">
          <RotateCcw className="w-3 h-3" /> Start over
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-4">
      <div className="flex items-center gap-2">
        {path.length > 1 && (
          <button
            onClick={() => setPath(prev => prev.slice(0, -1))}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Back
          </button>
        )}
      </div>
      <p className="font-semibold text-slate-200">{currentNode.question}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {currentNode.options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => handleOption(opt)}
            className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50 text-left text-sm text-slate-300 hover:bg-slate-700/50 hover:border-slate-500 transition-all flex items-center justify-between gap-2 group"
          >
            {opt.label}
            <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
};

const Troubleshooting = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
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

  const filteredFaqs = useMemo(() => {
    if (!searchQuery) return faqs;
    const q = searchQuery.toLowerCase();
    return faqs.filter(f =>
      f.question.toLowerCase().includes(q) ||
      f.answer.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const knownIssues = [
    { issue: "Window positions reset after refresh", status: "known", note: "Expected behavior — not persisted" },
    { issue: "Some keyboard shortcuts don't work in inputs", status: "known", note: "By design — prevents conflicts" },
    { issue: "Camera feeds show static", status: "feature", note: "That's the aesthetic 👀" },
    { issue: "DEF-DEV console not capturing logs", status: "known", note: "Accept warning screen first" },
    { issue: "File system resets on refresh", status: "known", note: "Use Sync to persist across sessions" },
  ];

  return (
    <DocLayout
      title="Troubleshooting"
      description="Interactive troubleshooting guide for Urbanshade OS — diagnostic wizard, FAQ, error codes, and recovery options."
      keywords={["help", "troubleshooting", "faq", "problems", "recovery", "reset", "errors", "bugcheck"]}
      accentColor="red"
      prevPage={{ title: "Keyboard Shortcuts", path: "/docs/shortcuts" }}
      nextPage={{ title: "Advanced", path: "/docs/advanced" }}
    >
      <DocHero
        icon={HelpCircle}
        title="Troubleshooting"
        subtitle="Something went wrong? Use the diagnostic wizard below to find your fix, or search the FAQ."
        accentColor="red"
      />

      {/* Diagnostic Wizard */}
      <DocSection title="What's Wrong?" icon={Wrench} accentColor="cyan" id="wizard">
        <p className="text-sm text-slate-500 mb-4">Answer a few questions to find the right solution.</p>
        <DecisionWizard />
      </DocSection>

      {/* The Universal Fix */}
      <DocSection title="The Universal Fix" icon={RotateCcw} accentColor="cyan" id="universal">
        <div className="p-5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 space-y-3">
          <p className="font-semibold text-slate-200">Most issues can be fixed by:</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { step: "1", label: "Refresh the page", detail: "Ctrl+R / Cmd+R" },
              { step: "2", label: "Hard refresh", detail: "Ctrl+Shift+R / Cmd+Shift+R" },
              { step: "3", label: "Recovery Mode", detail: "Press F2 during boot" },
              { step: "4", label: "Factory Reset", detail: "Recovery Mode → Reset" },
            ].map((s) => (
              <div key={s.step} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xs font-bold flex-shrink-0">{s.step}</span>
                <div>
                  <p className="text-sm font-medium text-slate-200">{s.label}</p>
                  <p className="text-[11px] text-slate-500">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DocSection>

      {/* Searchable FAQ */}
      <DocSection title="FAQ" icon={HelpCircle} accentColor="amber" id="faq">
        <div className="relative max-w-md mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search FAQ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 text-sm transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-slate-700/50 border border-slate-600/50 text-slate-500 text-[10px] font-mono">/</kbd>
        </div>

        <div className="space-y-2">
          {filteredFaqs.map((faq, i) => {
            const isExpanded = expandedFaq === i;
            return (
              <div key={i} className="rounded-xl border border-slate-700/50 overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(isExpanded ? null : i)}
                  className="w-full flex items-center justify-between gap-3 p-4 bg-slate-800/30 hover:bg-slate-800/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-200">{faq.question}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-500">{faq.category}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 space-y-2">
                    <p className="text-sm text-slate-400">{faq.answer}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-green-400">{faq.solution}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filteredFaqs.length === 0 && (
            <p className="text-center text-slate-500 py-4">No FAQ entries match "{searchQuery}"</p>
          )}
        </div>
      </DocSection>

      {/* Error Codes */}
      <DocSection title="Bugcheck Error Codes" icon={Hash} accentColor="red" id="error-codes">
        <p className="text-sm text-slate-500 mb-4">
          These are the simulated bugcheck (BSOD) error codes you may encounter. They're cosmetic — no real damage occurs.
        </p>
        <div className="rounded-xl border border-slate-700/50 overflow-hidden">
          {errorCodes.map((err, i) => (
            <div key={err.code} className={`flex items-center gap-4 px-4 py-3 hover:bg-slate-800/30 transition-colors ${i > 0 ? 'border-t border-slate-800/50' : ''}`}>
              <code className="text-xs font-mono text-red-400 w-64 flex-shrink-0 truncate">{err.code}</code>
              <span className="text-sm text-slate-400 flex-1">{err.description}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                err.severity === 'critical' ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                err.severity === 'high' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20' :
                'bg-amber-500/15 text-amber-400 border border-amber-500/20'
              }`}>
                {err.severity}
              </span>
            </div>
          ))}
        </div>
        <DocAlert variant="info" title="Don't Panic">
          All bugcheck screens are simulated. Click "Reboot Now" to restart. You can also trigger crashes deliberately via the System Crash app or the <code className="font-mono text-cyan-400">panic</code> terminal command.
        </DocAlert>
      </DocSection>

      {/* Known Issues */}
      <DocSection title="Known Issues" icon={Bug} accentColor="purple" id="known">
        <div className="space-y-2">
          {knownIssues.map((item, i) => (
            <div key={i} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50 flex items-center gap-3">
              {item.status === "feature" ? (
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200">{item.issue}</p>
                <p className="text-xs text-slate-500">{item.note}</p>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${
                item.status === 'feature' ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400'
              }`}>
                {item.status === 'feature' ? 'By Design' : 'Known'}
              </span>
            </div>
          ))}
        </div>
      </DocSection>

      {/* Nuclear Options */}
      <DocSection title="Nuclear Options" icon={AlertTriangle} accentColor="red" id="nuclear">
        <DocAlert variant="danger">
          These options will delete your saved data. Export your settings first!
        </DocAlert>
        <div className="grid gap-3 sm:grid-cols-3 mt-4">
          {[
            { title: "Clear Site Data", steps: "DevTools (F12) → Application → Storage → Clear" },
            { title: "Factory Reset", steps: "F2 during boot → Recovery → Factory Reset" },
            { title: "Manual Clear", steps: "DevTools Console → localStorage.clear() → Refresh" },
          ].map((opt) => (
            <div key={opt.title} className="p-4 rounded-lg bg-slate-900/50 border border-red-500/20">
              <p className="font-semibold text-sm text-slate-200">{opt.title}</p>
              <p className="text-xs text-slate-500 mt-1">{opt.steps}</p>
            </div>
          ))}
        </div>
      </DocSection>

      {/* Still stuck CTA */}
      <DocSection id="support">
        <div className="p-6 rounded-xl bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-cyan-500/10 border border-cyan-500/20 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <LifeBuoy className="w-10 h-10 text-cyan-400 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-white text-lg">Still stuck?</h4>
            <p className="text-sm text-slate-400 mt-1">This is a simulated OS for fun. Worst case, refresh and start over — no real data is harmed!</p>
          </div>
          <a
            href="/support"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 transition-all font-medium text-sm whitespace-nowrap"
          >
            <ExternalLink className="w-4 h-4" />
            Contact Support
          </a>
        </div>
      </DocSection>
    </DocLayout>
  );
};

export default Troubleshooting;
