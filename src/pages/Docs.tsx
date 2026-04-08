import { ArrowLeft, Search, Rocket, Folder, Map, Terminal, Shield, Zap, Keyboard, HelpCircle, Package, Cpu, Bug, Code, Users, BookOpen, ChevronRight, Star, Sparkles, Clock, TrendingUp, Filter, Skull } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useMemo, useEffect, useRef } from "react";
import { VERSION } from "@/lib/versionInfo";
import SEO from "@/components/SEO";

interface DocArticle {
  icon: React.ElementType;
  title: string;
  description: string;
  link: string;
  category: string;
  accent: string;
  featured?: boolean;
  popular?: boolean;
  readTime?: number; // minutes
}

const CATEGORIES = ["All", "Guide", "Apps", "Terminal", "Developer", "Staff", "Safety", "Advanced"] as const;

const Docs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [scanlineY, setScanlineY] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  // Scanline animation
  useEffect(() => {
    let frame: number;
    let y = 0;
    const animate = () => {
      y = (y + 0.3) % 100;
      setScanlineY(y);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

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

  const articles: DocArticle[] = [
    {
      icon: Rocket, title: "Getting Started",
      description: "First boot? Start here. Installation, OOBE setup, and desktop basics.",
      link: "/docs/getting-started", category: "Guide", accent: "cyan",
      featured: true, popular: true, readTime: 5
    },
    {
      icon: Folder, title: "Core Applications",
      description: "File Explorer, Notepad, Calculator — your standard OS toolkit.",
      link: "/docs/applications", category: "Apps", accent: "blue",
      featured: true, readTime: 8
    },
    {
      icon: Map, title: "Facility Applications",
      description: "Security cameras, containment monitors, and power grid management.",
      link: "/docs/facility", category: "Apps", accent: "purple", readTime: 6
    },
    {
      icon: Terminal, title: "Terminal Guide",
      description: "Command-line reference with all available commands and scripts.",
      link: "/docs/terminal", category: "Terminal", accent: "green",
      featured: true, popular: true, readTime: 12
    },
    {
      icon: Shield, title: "Admin Panel",
      description: "Secret access codes, visual effects, and chaos controls.",
      link: "/docs/admin-panel", category: "Staff", accent: "amber", readTime: 4
    },
    {
      icon: Zap, title: "Advanced Features",
      description: "BIOS settings, Recovery Mode, Safe Mode, and developer options.",
      link: "/docs/advanced", category: "Advanced", accent: "orange", readTime: 10
    },
    {
      icon: Keyboard, title: "Keyboard Shortcuts",
      description: "All hotkeys and key combinations for power users.",
      link: "/docs/shortcuts", category: "Guide", accent: "teal",
      featured: true, popular: true, readTime: 3
    },
    {
      icon: HelpCircle, title: "Troubleshooting",
      description: "FAQ and solutions for common issues and error codes.",
      link: "/docs/troubleshooting", category: "Guide", accent: "red",
      featured: true, readTime: 7
    },
    {
      icon: Package, title: "UUR Repository",
      description: "User-submitted packages, themes, and extensions.",
      link: "/docs/uur", category: "Developer", accent: "indigo", readTime: 5
    },
    {
      icon: Cpu, title: "Features Overview",
      description: "Complete feature list and system capabilities.",
      link: "/docs/features", category: "Guide", accent: "pink", readTime: 6
    },
    {
      icon: Bug, title: "DEF-DEV Console",
      description: "Real-time debugging, action logs, and system diagnostics.",
      link: "/docs/def-dev", category: "Developer", accent: "amber",
      featured: true, popular: true, readTime: 15
    },
    {
      icon: Code, title: "Developer Docs",
      description: "API documentation, theming, and extension development.",
      link: "/docs/dev", category: "Developer", accent: "emerald", readTime: 20
    },
    {
      icon: Shield, title: "Safety Center",
      description: "User badges, account security, and reporting guidelines.",
      link: "/docs/safety", category: "Safety", accent: "green", readTime: 4
    },
    {
      icon: Users, title: "Moderation Guide",
      description: "Admin tools, user management, and NAVI AI monitoring.",
      link: "/docs/moderation", category: "Staff", accent: "red", readTime: 8
    }
  ];

  const featuredArticles = useMemo(() =>
    articles.filter(a => a.featured).slice(0, 6),
  []);

  const filteredArticles = useMemo(() => {
    let results = articles;
    if (activeCategory !== "All") {
      results = results.filter(a => a.category === activeCategory);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.description.toLowerCase().includes(query) ||
        article.category.toLowerCase().includes(query)
      );
    }
    return results;
  }, [searchQuery, activeCategory]);

  const getAccentClasses = (accent: string) => {
    const colors: Record<string, { bg: string; border: string; text: string; iconBg: string; glow: string }> = {
      cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400", iconBg: "bg-cyan-500/20", glow: "shadow-cyan-500/30" },
      blue: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", iconBg: "bg-blue-500/20", glow: "shadow-blue-500/30" },
      purple: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400", iconBg: "bg-purple-500/20", glow: "shadow-purple-500/30" },
      amber: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", iconBg: "bg-amber-500/20", glow: "shadow-amber-500/30" },
      orange: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", iconBg: "bg-orange-500/20", glow: "shadow-orange-500/30" },
      red: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", iconBg: "bg-red-500/20", glow: "shadow-red-500/30" },
      green: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400", iconBg: "bg-green-500/20", glow: "shadow-green-500/30" },
      teal: { bg: "bg-teal-500/10", border: "border-teal-500/30", text: "text-teal-400", iconBg: "bg-teal-500/20", glow: "shadow-teal-500/30" },
      emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", iconBg: "bg-emerald-500/20", glow: "shadow-emerald-500/30" },
      indigo: { bg: "bg-indigo-500/10", border: "border-indigo-500/30", text: "text-indigo-400", iconBg: "bg-indigo-500/20", glow: "shadow-indigo-500/30" },
      pink: { bg: "bg-pink-500/10", border: "border-pink-500/30", text: "text-pink-400", iconBg: "bg-pink-500/20", glow: "shadow-pink-500/30" }
    };
    return colors[accent] || colors.cyan;
  };

  return (
    <>
      <SEO
        title="Documentation"
        description="Complete documentation for Urbanshade OS - a browser-based operating system simulation with terminal, apps, and developer tools."
        path="/docs"
        keywords={["urbanshade documentation", "os simulation guide", "browser os tutorial", "terminal commands"]}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        {/* Background effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-cyan-500/15 via-blue-500/10 to-transparent blur-[100px] rounded-full" />
          <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-purple-500/10 via-indigo-500/8 to-transparent blur-[100px] rounded-full" />
          <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-blue-500/12 via-cyan-500/8 to-transparent blur-[120px] rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-tl from-teal-500/10 to-transparent blur-[80px] rounded-full" />
          {/* Grid overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
          {/* Scanline effect */}
          <div
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent"
            style={{ top: `${scanlineY}%`, transition: 'none' }}
          />
        </div>

        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <img src="/favicon.svg" alt="UrbanShade" className="w-9 h-9" />
                <div className="absolute -inset-1 bg-white/10 blur-md rounded-full -z-10 group-hover:bg-white/20 transition-colors" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">URBANSHADE OS</h1>
                <p className="text-xs text-gray-500 font-mono">Documentation v{VERSION.shortVersion}</p>
              </div>
            </Link>

            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/20 text-white hover:bg-white/5 transition-all text-sm font-medium group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to App
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="relative z-10 max-w-6xl mx-auto px-6 py-12 space-y-16">
          {/* Hero with animated gradient */}
          <section className="text-center space-y-6 relative">
            {/* Animated gradient orb behind icon */}
            <div className="relative inline-block">
              <img src="/favicon.svg" alt="UrbanShade" className="w-20 h-20 mx-auto relative z-10" />
              <div className="absolute -inset-8 bg-gradient-to-br from-cyan-500/20 via-blue-500/15 to-purple-500/20 blur-3xl rounded-full -z-10 animate-pulse" />
              <div className="absolute -inset-4 bg-gradient-to-tr from-cyan-400/10 to-teal-400/10 blur-xl rounded-full -z-10" />
            </div>

            <div className="space-y-3">
              <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
                Documentation
              </h2>
              <p className="text-gray-400 max-w-xl mx-auto text-lg">
                Everything you need to master UrbanShade OS.
              </p>
            </div>

            {/* What's New Banner */}
            <Link
              to="/docs/advanced"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-500/20 hover:border-cyan-500/40 transition-all group"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-300">What's New in v{VERSION.shortVersion}</span>
              <ChevronRight className="w-3 h-3 text-cyan-500 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Quick stats */}
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              {[
                { icon: BookOpen, label: `${articles.length} Articles` },
                { icon: Terminal, label: "50+ Commands" },
                { icon: Keyboard, label: "30+ Shortcuts" },
                { icon: Clock, label: `~${Math.round(articles.reduce((s, a) => s + (a.readTime || 5), 0))} min total` }
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded border border-white/10 text-gray-400">
                  <stat.icon className="w-4 h-4 text-white" />
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Featured Articles */}
          {!searchQuery && activeCategory === "All" && (
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
                  <Star className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Featured Guides</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {featuredArticles.map((article) => {
                  const colors = getAccentClasses(article.accent);
                  return (
                    <Link
                      key={article.link}
                      to={article.link}
                      className="group relative p-5 rounded-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 hover:border-white/20 hover:from-white/[0.05] hover:to-white/[0.02] transition-all duration-300 overflow-hidden"
                    >
                      {/* Subtle glow on hover */}
                      <div className={`absolute -top-20 -right-20 w-40 h-40 ${colors.iconBg} blur-3xl opacity-0 group-hover:opacity-50 transition-opacity`} />

                      <div className="relative flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl ${colors.iconBg} border ${colors.border} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                          <article.icon className={`w-6 h-6 ${colors.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-white group-hover:text-cyan-100 transition-colors">{article.title}</h4>
                            {article.popular && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">
                                <TrendingUp className="w-3 h-3" />
                                HOT
                              </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all ml-auto" />
                          </div>
                          <p className="text-sm text-slate-500 mt-1 line-clamp-2">{article.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-block px-2 py-0.5 text-xs rounded ${colors.bg} ${colors.text} border ${colors.border}`}>
                              {article.category}
                            </span>
                            {article.readTime && (
                              <span className="flex items-center gap-1 text-xs text-slate-600">
                                <Clock className="w-3 h-3" />
                                {article.readTime} min
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Search & Filter */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-500/20 to-slate-600/20 border border-slate-500/30 flex items-center justify-center">
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Browse All</h3>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat;
                const count = cat === "All" ? articles.length : articles.filter(a => a.category === cat).length;
                if (cat !== "All" && count === 0) return null;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                      isActive
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10"
                        : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600 hover:text-slate-300"
                    }`}
                  >
                    {cat === "All" && <Filter className="w-3 h-3" />}
                    {cat}
                    <span className={`text-xs ${isActive ? 'text-cyan-400' : 'text-slate-600'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Bar */}
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-16 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-800/80 transition-all"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-slate-700/50 border border-slate-600/50 text-slate-500 text-xs font-mono">
                /
              </kbd>
            </div>

            {searchQuery && (
              <p className="text-sm text-slate-500">
                Found {filteredArticles.length} articles matching "{searchQuery}"
              </p>
            )}
          </section>

          {/* Articles Grid */}
          <section className="space-y-6">
            {filteredArticles.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {filteredArticles.map((article) => {
                  const colors = getAccentClasses(article.accent);
                  return (
                    <Link
                      key={article.link}
                      to={article.link}
                      className="group p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/50 transition-all flex items-center gap-4"
                    >
                      <div className={`w-10 h-10 rounded-lg ${colors.iconBg} border ${colors.border} flex items-center justify-center flex-shrink-0`}>
                        <article.icon className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-white">{article.title}</h4>
                          {article.popular && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">
                              <TrendingUp className="w-2.5 h-2.5" />
                              POPULAR
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{article.description}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {article.readTime && (
                          <span className="text-xs text-slate-600 hidden sm:flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {article.readTime}m
                          </span>
                        )}
                        <span className={`px-2 py-0.5 text-xs rounded ${colors.bg} ${colors.text} border ${colors.border} hidden sm:block`}>
                          {article.category}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 group-hover:text-slate-400 transition-all" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <HelpCircle className="w-12 h-12 mx-auto text-slate-700 mb-4" />
                <p className="text-slate-500">No articles found matching your search.</p>
                <button
                  onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}
                  className="mt-4 px-4 py-2 rounded-lg border border-slate-600 text-white hover:bg-slate-800 transition-colors text-sm"
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>

          {/* Quick Reference */}
          <section className="space-y-6">
            <h3 className="text-xl font-bold text-white text-center">Quick Reference</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { key: "DEL", label: "Access BIOS", desc: "During boot" },
                { key: "F2", label: "Recovery Mode", desc: "During boot" },
                { key: "Shift+/", label: "Global Search", desc: "Search apps" },
                { key: "Shift+Esc", label: "Task Manager", desc: "View processes" },
                { key: "Shift+E", label: "File Explorer", desc: "Browse files" },
                { key: "Shift+T", label: "Terminal", desc: "Command line" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-800/30 border border-slate-700/50">
                  <kbd className="px-3 py-1.5 rounded-lg bg-slate-900 text-cyan-400 text-xs font-mono border border-slate-700">
                    {item.key}
                  </kbd>
                  <div>
                    <div className="text-sm font-medium text-white">{item.label}</div>
                    <div className="text-xs text-slate-500">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <footer className="pt-12 border-t border-white/10 text-center">
            <p className="text-gray-600 text-sm">
              UrbanShade OS Documentation • Built with 🖥️ at depth 8,247m
            </p>
            <div className="mt-4 flex justify-center gap-4 text-xs text-gray-600">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/support" className="hover:text-white transition-colors">Support</Link>
              <Link to="/status" className="hover:text-white transition-colors">Status</Link>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
};

export default Docs;
