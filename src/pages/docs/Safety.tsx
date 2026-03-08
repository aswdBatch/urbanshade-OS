import { Shield, Award, Lock, Flag, Eye, ArrowRight, AlertTriangle, Zap } from "lucide-react";
import { DocLayout, DocHero, DocSection, DocCard, DocAlert } from "@/components/docs";

const Safety = () => {
  // How we protect you timeline
  const protectionLayers = [
    { step: 1, title: "NAVI AI Monitor", desc: "Automated threat detection watches for spam, abuse, and suspicious patterns 24/7.", icon: Eye, color: "cyan" },
    { step: 2, title: "Rate Limiting", desc: "Message and action rate limits prevent spam floods and automated abuse.", icon: Zap, color: "blue" },
    { step: 3, title: "Badge Verification", desc: "System-rendered badges prevent staff impersonation — users can't fake them.", icon: Award, color: "purple" },
    { step: 4, title: "Human Moderation", desc: "Real admins review reports, handle appeals, and make final decisions.", icon: Shield, color: "red" },
    { step: 5, title: "Autonomous Response", desc: "NAVI can auto-warn, temp-ban, or lockdown in emergencies without waiting for humans.", icon: AlertTriangle, color: "amber" },
  ];

  // Moderation severity scale
  const severityScale = [
    { level: 1, action: "Warning", color: "amber", desc: "Informal notice. No restrictions. Accumulates toward bans.", duration: "Permanent record" },
    { level: 2, action: "Temp Mute", color: "orange", desc: "Chat/message privileges temporarily revoked.", duration: "1h – 24h" },
    { level: 3, action: "Temp Ban", color: "red", desc: "Full access revoked for a set duration.", duration: "1h – 30 days" },
    { level: 4, action: "Permanent Ban", color: "red", desc: "Account permanently restricted. Appeal possible.", duration: "Indefinite" },
    { level: 5, action: "Lockdown", color: "red", desc: "System-wide emergency restriction. Affects all users.", duration: "Until resolved" },
  ];

  return (
    <DocLayout
      title="Safety Center"
      description="How UrbanShade OS keeps you safe — badges, account security, reporting, moderation, and NAVI AI protection."
      keywords={["safety", "security", "badges", "reporting", "account", "moderation", "navi"]}
      accentColor="cyan"
      prevPage={{ title: "Back to Docs", path: "/docs" }}
    >
      <DocHero
        icon={Shield}
        title="Safety Center"
        subtitle="Your safety matters. Learn about our protection systems, trust indicators, and how to report issues."
        accentColor="cyan"
      />

      {/* Quick Links */}
      <DocSection title="Safety Topics" icon={Shield} accentColor="cyan" id="topics">
        <div className="grid gap-4 md:grid-cols-3">
          <DocCard title="Badges" description="User badges, trust levels, and how to spot fakes." icon={Award} link="/docs/safety/badges" accentColor="purple" />
          <DocCard title="Account Safety" description="Passwords, 2FA, session management, and threat recognition." icon={Lock} link="/docs/safety/account" accentColor="cyan" />
          <DocCard title="Reporting" description="How to report users, bugs, and security issues." icon={Flag} link="/docs/safety/reporting" accentColor="red" />
        </div>
      </DocSection>

      {/* How We Protect You — Infographic */}
      <DocSection title="How We Protect You" icon={Shield} accentColor="green" id="protection">
        <p className="text-sm text-slate-500 mb-6">Multiple layers of protection work together to keep UrbanShade safe.</p>
        <div className="space-y-3">
          {protectionLayers.map((layer, i) => {
            const Icon = layer.icon;
            const colorMap: Record<string, { bg: string; border: string; text: string }> = {
              cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-400" },
              blue: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" },
              purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400" },
              red: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400" },
              amber: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400" },
            };
            const c = colorMap[layer.color];
            return (
              <div key={layer.step} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${c.text}`} />
                  </div>
                  {i < protectionLayers.length - 1 && (
                    <div className="w-px h-5 bg-slate-700/50 mt-1" />
                  )}
                </div>
                <div className="pb-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${c.text}`}>Layer {layer.step}</span>
                    <h4 className="font-semibold text-white text-sm">{layer.title}</h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{layer.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </DocSection>

      {/* Reporting Flow Diagram */}
      <DocSection title="Reporting Flow" icon={Flag} accentColor="red" id="flow">
        <p className="text-sm text-slate-500 mb-4">What happens when you submit a report:</p>
        <div className="flex flex-wrap items-center gap-2 p-5 rounded-xl bg-slate-800/30 border border-slate-700/50">
          {[
            { label: "You Report", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
            { label: "NAVI Filters", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
            { label: "Admin Reviews", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
            { label: "Action Taken", color: "text-red-400 bg-red-500/10 border-red-500/20" },
            { label: "User Notified", color: "text-green-400 bg-green-500/10 border-green-500/20" },
          ].map((step, i, arr) => (
            <div key={step.label} className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${step.color}`}>
                {step.label}
              </span>
              {i < arr.length - 1 && <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />}
            </div>
          ))}
        </div>
      </DocSection>

      {/* Moderation Severity Scale */}
      <DocSection title="Moderation Severity Scale" icon={AlertTriangle} accentColor="amber" id="severity">
        <p className="text-sm text-slate-500 mb-4">Actions escalate based on the severity and frequency of violations.</p>
        <div className="rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-slate-800/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span className="col-span-1">Lv</span>
            <span className="col-span-2">Action</span>
            <span className="col-span-6">Description</span>
            <span className="col-span-3">Duration</span>
          </div>
          {severityScale.map((s, i) => (
            <div key={s.level} className={`grid grid-cols-12 gap-2 px-4 py-3 hover:bg-slate-800/20 transition-colors ${i > 0 ? 'border-t border-slate-800/50' : ''}`}>
              <span className="col-span-1 text-slate-500 font-mono text-sm">{s.level}</span>
              <span className={`col-span-2 text-sm font-medium ${
                s.color === 'amber' ? 'text-amber-400' :
                s.color === 'orange' ? 'text-orange-400' : 'text-red-400'
              }`}>{s.action}</span>
              <span className="col-span-6 text-xs text-slate-400">{s.desc}</span>
              <span className="col-span-3 text-xs text-slate-500">{s.duration}</span>
            </div>
          ))}
        </div>
      </DocSection>

      <DocAlert variant="tip" title="Have Questions?">
        Visit the <a href="/support" className="text-cyan-400 hover:underline">Support page</a> or message an admin directly through the Messages app.
      </DocAlert>
    </DocLayout>
  );
};

export default Safety;
