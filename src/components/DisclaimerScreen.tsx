// UrbanShade OS v3.1 - Redesigned Disclaimer Screen
import { useState, useEffect } from "react";
import { CheckCircle, ShieldCheck, Github, AlertTriangle, Cloud, Database, Users, Crown, Code, TestTube, Lightbulb, ChevronDown, Sparkles, Zap, Lock, FastForward, FileText, ExternalLink, ScrollText } from "lucide-react";
import { VERSION } from "@/lib/versionInfo";
import { ChangelogDialog } from "./ChangelogDialog";

// Team data
const CONTRIBUTORS = [
{
  name: "Aswd_LV",
  role: "Founder & Lead Dev",
  color: "from-yellow-500 to-amber-600",
  icon: <Crown className="w-4 h-4" />
},
{
  name: "plplll",
  role: "Developer & Tester",
  color: "from-slate-400 to-zinc-500",
  icon: <Code className="w-4 h-4" />
},
{
  name: "robo-karlix",
  role: "Lead Tester",
  color: "from-purple-500 to-violet-600",
  icon: <TestTube className="w-4 h-4" />
},
{
  name: "Kombainis_yehaw",
  role: "QA Tester",
  color: "from-green-500 to-emerald-600",
  icon: <Lightbulb className="w-4 h-4" />
}];


interface DisclaimerScreenProps {
  onAccept: (skipInstall?: boolean) => void;
}

export const DisclaimerScreen = ({ onAccept }: DisclaimerScreenProps) => {
  const [understood, setUnderstood] = useState(false);
  const [skipInstall, setSkipInstall] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-foreground overflow-hidden">
      {/* Animated background grid */}
      <div className="fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />
      
      {/* Glow effects */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px] -translate-y-1/2" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] translate-y-1/2" />
      
      <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-8">
        <div className={`max-w-3xl w-full space-y-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
              <img src="/favicon.svg" alt="UrbanShade" className="w-12 h-12" />
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 bg-clip-text text-transparent">
                UrbanShade OS
              </span>
            </h1>
            
            <div className="flex items-center justify-center gap-3 text-sm">
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono">
                {VERSION.displayVersion}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Browser-Based OS Simulator
              </span>
            </div>
          </div>

          {/* Quick Info Cards */}
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 text-center">
              <Zap className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
              <p className="text-sm font-medium">100% Browser-Based</p>
              <p className="text-xs text-muted-foreground mt-1">No installation needed</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 text-center">
              <Lock className="w-6 h-6 mx-auto mb-2 text-green-400" />
              <p className="text-sm font-medium">Your Data, Your Control</p>
              <p className="text-xs text-muted-foreground mt-1">Local or cloud storage</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 text-center">
              <ShieldCheck className="w-6 h-6 mx-auto mb-2 text-cyan-400" />
              <p className="text-sm font-medium">Completely Safe</p>
              <p className="text-xs text-muted-foreground mt-1">It's just a simulation</p>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="p-4 bg-gradient-to-r from-amber-950/50 to-amber-900/30 border rounded-xl border-amber-600">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-300">Important</p>
                <p className="text-xs text-amber-200/70">
                  This is a simulation. Don't enter real passwords or sensitive information.
                </p>
              </div>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5 text-purple-400" />
                <span className="font-semibold text-sm">Local Mode</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Data stays in your browser. Clearing cache resets everything.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Cloud className="w-5 h-5 text-cyan-400" />
                <span className="font-semibold text-sm">Cloud Mode</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">Optional</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Sign up to sync settings and chat with other users.
              </p>
            </div>
          </div>

          {/* Expandable Details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">

            <span>More details</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
          </button>

          {showDetails &&
          <div className="space-y-4 animate-fade-in">
              {/* Quick Actions */}
              <div className="grid sm:grid-cols-2 gap-3">
                {/* View Changelog */}
                <button
                onClick={() => setShowChangelog(true)}
                className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 text-left hover:bg-slate-700/50 transition-colors group">

                  <div className="flex items-center gap-3">
                    <ScrollText className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-sm font-medium">View Changelog</p>
                      <p className="text-xs text-muted-foreground">See what's new in {VERSION.displayVersion}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto group-hover:text-cyan-400 transition-colors" />
                  </div>
                </button>
                
                {/* Documentation */}
                <a
                href="/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 text-left hover:bg-slate-700/50 transition-colors group">

                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-sm font-medium">Documentation</p>
                      <p className="text-xs text-muted-foreground">Learn how to use UrbanShade</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto group-hover:text-purple-400 transition-colors" />
                  </div>
                </a>
              </div>

              {/* Contributors */}
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-sm">Made by</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {CONTRIBUTORS.map((contributor) =>
                <div key={contributor.name} className="text-center">
                      <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${contributor.color} flex items-center justify-center mb-2`}>
                        {contributor.icon}
                      </div>
                      <p className="text-xs font-medium truncate">{contributor.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{contributor.role}</p>
                    </div>
                )}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-700/50 text-center">
                  <a
                  href="/team"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline">

                    Meet the full team →
                  </a>
                </div>
              </div>

              {/* Links */}
              <div className="flex flex-wrap justify-center gap-3">
                <a
                href="https://github.com/aswdBatch/urbanshade-OS"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm hover:bg-slate-700/50 transition-colors">

                  <Github className="w-4 h-4" />
                  GitHub
                </a>
                <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm hover:bg-slate-700/50 transition-colors">

                  Terms
                </a>
                <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm hover:bg-slate-700/50 transition-colors">

                  Privacy
                </a>
              </div>
            </div>
          }

          {/* Changelog Dialog */}
          <ChangelogDialog open={showChangelog} onOpenChange={setShowChangelog} />

          {/* Acceptance */}
          <div className="space-y-3">
            <label className="flex items-start gap-3 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 cursor-pointer hover:border-cyan-500/30 transition-colors">
              <input
                type="checkbox"
                checked={understood}
                onChange={(e) => setUnderstood(e.target.checked)}
                className="w-5 h-5 mt-0.5 accent-cyan-500 cursor-pointer" />

              <div>
                <p className="font-medium text-sm">I understand this is a simulation</p>
                <p className="text-xs text-muted-foreground mt-1">
                  I won't enter real passwords and understand all data is fictional.
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800/20 border border-slate-700/30 cursor-pointer hover:border-amber-500/30 transition-colors">
              <input
                type="checkbox"
                checked={skipInstall}
                onChange={(e) => setSkipInstall(e.target.checked)}
                className="w-4 h-4 accent-amber-500 cursor-pointer" />

              <FastForward className={`w-5 h-5 ${skipInstall ? 'text-amber-400' : 'text-muted-foreground'}`} />
              <div>
                <span className={`text-sm ${skipInstall ? 'text-amber-400' : ''}`}>Quick start</span>
                <span className="text-xs text-muted-foreground ml-2">Skip installation wizard</span>
              </div>
            </label>

            <button
              onClick={() => onAccept(skipInstall)}
              disabled={!understood}
              className="w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:scale-[1.02] disabled:hover:scale-100 disabled:shadow-none">

              {understood ?
              <>
                  <CheckCircle className="w-5 h-5" />
                  {skipInstall ? "Quick Start" : "Enter UrbanShade OS"}
                </> :

              <>
                  <Lock className="w-5 h-5 opacity-50" />
                  Accept to continue
                </>
              }
            </button>
          </div>

        </div>
      </div>
    </div>);

};