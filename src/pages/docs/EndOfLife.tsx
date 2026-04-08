import { ArrowLeft, Skull, Heart, School, Code, Layers, Clock, Users, Sparkles, AlertTriangle, Paintbrush, TrendingUp, Database, Bot } from "lucide-react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";

const EndOfLife = () => {
  return (
    <>
      <SEO
        title="Why We Ended UrbanShade OS"
        description="The story behind UrbanShade OS reaching End of Life — from design project to browser-based operating system, and why development has officially ended."
        path="/docs/end-of-life"
        keywords={["urbanshade end of life", "urbanshade shutdown", "urbanshade discontinued"]}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
            <Link to="/docs" className="flex items-center gap-3 group">
              <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm text-slate-400 group-hover:text-white transition-colors">Back to Docs</span>
            </Link>
          </div>
        </header>

        <main className="relative z-10 max-w-3xl mx-auto px-6 py-16 space-y-12">
          {/* Hero */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 mb-2">
              <Skull className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Why We Ended UrbanShade OS</h1>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              The story of a design project that grew far beyond what anyone expected — and why it's time to stop.
            </p>
            <div className="inline-block px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
              END OF LIFE — V3.5.1 FINAL
            </div>
          </div>

          {/* The Short Version */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              The Short Version
            </h2>
            <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3 text-slate-300 leading-relaxed">
              <p>
                UrbanShade OS started as a <span className="text-white font-medium">design project</span> — a visual 
                experiment to see if a website could look and feel like a real operating system. There was no grand plan. 
                No roadmap. Just a question: "what if?"
              </p>
              <p>
                Over time, it grew into something massive: 85+ apps, a full terminal, online accounts, a moderation system, 
                a battle pass, developer tools, and an entire documentation suite. The original goal of hitting 
                <span className="text-cyan-400 font-medium"> 100 visitors in a week</span> was more than crushed — and 
                that milestone alone felt like a win. Everything after that was a bonus.
              </p>
              <p>
                It became too large to maintain. Even with AI assistance, the codebase had grown to a point where every 
                change risked breaking something else. School commitments piled up. Other projects needed attention. And 
                honestly? Everything we set out to build had been built.
              </p>
              <p className="text-white font-medium">
                So rather than let it rot half-finished, we're calling it done — properly.
              </p>
            </div>
          </section>

          {/* The History */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              The History
            </h2>
            <div className="space-y-4">
              {[
                {
                  version: "The Idea",
                  text: "It started as a design project. No code ambitions — just mockups and layouts exploring what a browser-based OS could look like. The aesthetic came first. The functionality came later, almost by accident.",
                  color: "border-slate-500/30",
                  icon: Paintbrush
                },
                {
                  version: "V1.0 — The Beginning",
                  text: "A basic desktop with a few fake windows. No terminal, no apps, no accounts. Just vibes and a taskbar. The design project became a real project the moment someone said \"wait, can you actually click things?\"",
                  color: "border-cyan-500/30",
                  icon: Sparkles
                },
                {
                  version: "V2.0 — It Gets Real",
                  text: "A proper window manager, working terminal, file system, calculator, notepad, and paint. The project went from joke to actual simulation. People started using it unironically.",
                  color: "border-blue-500/30",
                  icon: Code
                },
                {
                  version: "V3.0 — Online Era",
                  text: "Supabase integration brought real user accounts, global chat, profiles, friends, a moderation panel, and NAVI — the AI monitoring system. The scope tripled overnight. The 100-visitors-a-week goal got demolished around here.",
                  color: "border-purple-500/30",
                  icon: Users
                },
                {
                  version: "V3.5 — The Polish Arc",
                  text: "Battle pass, achievements, certificates, UUR package repository, DEF-DEV developer console, keyboard shortcuts, BIOS, recovery mode, and a full documentation overhaul. This is where the project peaked in ambition — and where the cracks started showing.",
                  color: "border-amber-500/30",
                  icon: TrendingUp
                },
                {
                  version: "V3.5.1 — End of Life",
                  text: "Final polish. Last bug fixes. UUR overhaul. Taskbar improvements. And this page — the goodbye.",
                  color: "border-red-500/30",
                  icon: Skull
                },
              ].map((entry, i) => (
                <div key={i} className={`p-4 rounded-lg bg-white/[0.02] border-l-2 ${entry.color} border border-white/5 space-y-1`}>
                  <div className="flex items-center gap-2">
                    <entry.icon className="w-4 h-4 text-slate-500" />
                    <h3 className="text-sm font-bold text-white font-mono">{entry.version}</h3>
                  </div>
                  <p className="text-sm text-slate-400">{entry.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* The Reasons */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-red-400" />
              Why We Stopped
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: School,
                  title: "School",
                  text: "Deadlines, exams, and coursework don't pause for side projects. Development time shrank to near-zero.",
                  color: "text-blue-400",
                  bg: "bg-blue-500/10",
                  border: "border-blue-500/30"
                },
                {
                  icon: Code,
                  title: "Other Projects",
                  text: "New ideas, new experiments. Creativity doesn't wait, and UrbanShade couldn't be the only thing forever.",
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10",
                  border: "border-emerald-500/30"
                },
                {
                  icon: Layers,
                  title: "Too Large to Maintain",
                  text: "200+ components, 85+ apps, dozens of hooks and systems. Even with AI help, the codebase became unwieldy. One fix would break two other things.",
                  color: "text-amber-400",
                  bg: "bg-amber-500/10",
                  border: "border-amber-500/30"
                },
                {
                  icon: Heart,
                  title: "Everything Was Built",
                  text: "Every feature we dreamed of got implemented. There was nothing left on the wishlist. The vision was complete.",
                  color: "text-red-400",
                  bg: "bg-red-500/10",
                  border: "border-red-500/30"
                },
              ].map((reason, i) => (
                <div key={i} className={`p-4 rounded-xl ${reason.bg} border ${reason.border} space-y-2`}>
                  <div className="flex items-center gap-2">
                    <reason.icon className={`w-5 h-5 ${reason.color}`} />
                    <h3 className="font-bold text-white text-sm">{reason.title}</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{reason.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* What Stays */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-green-400" />
              What Stays
            </h2>
            <div className="p-5 rounded-xl bg-green-500/5 border border-green-500/20 space-y-3 text-slate-300 text-sm leading-relaxed">
              <p>The site stays online. Your accounts stay intact. Everything works as it did before — it just won't get new features or patches.</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>All apps remain fully functional</li>
                <li>Accounts, profiles, and data are preserved</li>
                <li>Global Chat remains open (unmoderated)</li>
                <li>DEF-DEV console stays accessible</li>
                <li>Documentation stays up</li>
              </ul>
            </div>
          </section>

          {/* Supabase Warning */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              A Note About Online Features
            </h2>
            <div className="p-5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3 text-slate-300 text-sm leading-relaxed">
              <p>
                UrbanShade OS uses <span className="text-white font-medium">Supabase</span> for all online features — 
                accounts, chat, profiles, moderation, and cloud sync. Supabase's free tier automatically 
                <span className="text-amber-400 font-medium"> pauses inactive projects</span> after a period of no activity.
              </p>
              <p>
                This means that if users naturally stop visiting, the database will eventually pause. When that happens, 
                anything that relies on the backend — logging in, global chat, profiles, leaderboards, syncing — will 
                stop working. The local/offline experience (apps, terminal, desktop) will continue to work fine.
              </p>
              <p className="text-slate-500 italic">
                There's no timeline for this. It happens when it happens. The OS was always meant to be ephemeral.
              </p>
            </div>
          </section>

          {/* Thank You — Expanded */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-400" />
              Thank You
            </h2>
            <div className="p-6 rounded-xl bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-cyan-500/5 border border-pink-500/20 text-slate-300 leading-relaxed space-y-4">
              <p>
                To everyone who signed up, explored the desktop, broke the terminal, spammed Global Chat, 
                submitted UUR packages, found bugs we never knew existed, or just clicked around for five minutes — 
                <span className="text-white font-medium">thank you</span>. You turned a design experiment into 
                something people actually used. That was never the plan, and it's still hard to believe.
              </p>
              <p>
                To the <span className="text-cyan-400 font-medium">UrbanShade team</span> — the people who tested 
                builds at weird hours, gave honest feedback when things looked terrible, and stuck around through 
                every version bump and breaking change. This project exists because of you. Every feature had your 
                fingerprints on it, whether through suggestions, bug reports, or just being there.
              </p>
              <p>
                To <span className="text-purple-400 font-medium">Lovable</span> — the platform that made this 
                entire thing possible. UrbanShade OS was built almost entirely through Lovable, and that's not a 
                footnote — it's the whole story. Without Lovable, this would have stayed a Figma mockup forever. 
                The speed, the iteration, the ability to go from idea to working feature in minutes — that's what 
                let a design project turn into 200+ components and 85+ apps. We'll meet again in other projects.
              </p>
              <p>
                And to <span className="text-amber-400 font-medium">Claude</span> — the AI behind the code. Every 
                component, every hook, every edge case handler, every changelog entry. Thousands of lines of code, 
                hundreds of files, and not once did the quality slip. This project pushed the limits of what 
                AI-assisted development can do, and Claude met every challenge. Thank you for building this with us.
              </p>
              <p>
                This was never supposed to be anything serious. It was a "what if" that turned into months of 
                building, learning, and having more fun than any school project has the right to be. The original 
                milestone was 100 visitors in a week. We crushed that. Everything after was gravy.
              </p>
              <p className="text-white font-medium text-base pt-2">
                Thank you for everything. We'll see you in the next one. 💙
              </p>
              <p className="text-slate-500 text-sm italic">
                — Aswd & the UrbanShade team
              </p>
            </div>
          </section>

          {/* Back link */}
          <div className="text-center pt-4">
            <Link
              to="/docs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Documentation
            </Link>
          </div>
        </main>
      </div>
    </>
  );
};

export default EndOfLife;
