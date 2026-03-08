import { Star, Crown, Shield, Sparkles, Bot, Users, AlertTriangle, CheckCircle, XCircle, Gavel } from "lucide-react";
import { DocLayout, DocHero, DocSection, DocAlert } from "@/components/docs";

const Badges = () => {
  const badges = [
    { name: 'Creator', icon: Crown, color: 'amber', bgClass: 'bg-amber-500/15 border-amber-500/25', textClass: 'text-amber-400', description: 'Exclusive to Aswd, the creator of UrbanShade OS.', trustLevel: 'Maximum', howEarned: 'Built the whole thing.' },
    { name: 'Co-Creator', icon: Crown, color: 'amber', bgClass: 'bg-amber-500/10 border-amber-500/20', textClass: 'text-amber-300', description: 'Core contributors who helped build UrbanShade.', trustLevel: 'Maximum', howEarned: 'Appointed by Aswd.' },
    { name: 'Admin', icon: Shield, color: 'red', bgClass: 'bg-red-500/15 border-red-500/25', textClass: 'text-red-400', description: 'Trusted staff who moderate and manage the platform.', trustLevel: 'High', howEarned: 'Appointed by Aswd.' },
    { name: 'Trial Admin', icon: Shield, color: 'orange', bgClass: 'bg-orange-500/10 border-orange-500/20', textClass: 'text-orange-400', description: 'Admins in probation period with limited powers.', trustLevel: 'Elevated', howEarned: 'Promoted from users.' },
    { name: 'Moderator', icon: Gavel, color: 'blue', bgClass: 'bg-blue-500/10 border-blue-500/20', textClass: 'text-blue-400', description: 'Assists with moderation tasks and user support.', trustLevel: 'Elevated', howEarned: 'Promoted by admins.' },
    { name: 'VIP', icon: Sparkles, color: 'purple', bgClass: 'bg-purple-500/15 border-purple-500/25', textClass: 'text-purple-400', description: 'Users personally recognized by Aswd for contributions.', trustLevel: 'Trusted', howEarned: 'Granted by Aswd.' },
    { name: 'Bot', icon: Bot, color: 'cyan', bgClass: 'bg-cyan-500/10 border-cyan-500/20', textClass: 'text-cyan-400', description: 'Automated system accounts (NAVI, etc).', trustLevel: 'System', howEarned: 'System-assigned.' },
    { name: 'User', icon: Users, color: 'slate', bgClass: 'bg-slate-500/10 border-slate-500/20', textClass: 'text-slate-400', description: 'Regular members of UrbanShade OS.', trustLevel: 'Standard', howEarned: 'Create an account.' },
  ];

  return (
    <DocLayout
      title="User Badges"
      description="Complete visual guide to UrbanShade OS badges — trust levels, roles, and how to spot fakes."
      keywords={["badges", "trust", "admin", "vip", "creator", "verification", "roles"]}
      accentColor="purple"
      breadcrumbs={[{ label: "Safety", path: "/docs/safety" }]}
      prevPage={{ title: "Safety Center", path: "/docs/safety" }}
      nextPage={{ title: "Account Safety", path: "/docs/safety/account" }}
    >
      <DocHero
        icon={Star}
        title="Badge Gallery"
        subtitle={`${badges.length} badge types identify roles and trust levels. Badges are system-rendered — they cannot be faked.`}
        accentColor="purple"
      />

      <DocAlert variant="warning" title="Why Badges Matter">
        Always check for badges before trusting someone claiming to be staff. Real admins ALWAYS have their badge visible. No exceptions.
      </DocAlert>

      {/* Visual Badge Gallery */}
      <DocSection title="All Badges" icon={Star} accentColor="purple" id="gallery">
        <div className="grid gap-3 sm:grid-cols-2">
          {badges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div key={badge.name} className={`p-4 rounded-xl ${badge.bgClass} border transition-colors hover:brightness-110`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${badge.bgClass} border flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${badge.textClass}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-bold text-sm ${badge.textClass}`}>{badge.name}</h4>
                      <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-900/50 text-slate-400 border border-slate-700/50">
                        {badge.trustLevel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{badge.description}</p>
                    <p className="text-[11px] text-slate-600 mt-1.5 italic">{badge.howEarned}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DocSection>

      {/* Trust Hierarchy Visual */}
      <DocSection title="Trust Hierarchy" icon={Shield} accentColor="cyan" id="hierarchy">
        <div className="p-5 rounded-xl bg-slate-800/30 border border-slate-700/50">
          <div className="space-y-2">
            {[
              { level: "Maximum", roles: "Creator, Co-Creator", bar: "w-full", color: "bg-amber-500/40" },
              { level: "High", roles: "Admin", bar: "w-4/5", color: "bg-red-500/40" },
              { level: "Elevated", roles: "Trial Admin, Moderator", bar: "w-3/5", color: "bg-blue-500/40" },
              { level: "Trusted", roles: "VIP", bar: "w-2/5", color: "bg-purple-500/40" },
              { level: "Standard", roles: "User", bar: "w-1/5", color: "bg-slate-500/40" },
            ].map((tier) => (
              <div key={tier.level} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-16 text-right flex-shrink-0">{tier.level}</span>
                <div className="flex-1">
                  <div className={`h-6 ${tier.bar} ${tier.color} rounded-md flex items-center px-2`}>
                    <span className="text-[10px] text-white/80 font-medium truncate">{tier.roles}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DocSection>

      {/* Real vs Fake */}
      <DocSection title="Spotting Fake Badges" icon={AlertTriangle} accentColor="red" id="fake">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="font-bold text-green-400">Real Badge</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50 flex items-center gap-2">
              <span className="text-white text-sm">Aswd</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Crown className="w-2.5 h-2.5" /> Creator
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Rendered by the system as a styled component</p>
          </div>
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="w-5 h-5 text-red-400" />
              <span className="font-bold text-red-400">Fake Badge</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
              <span className="text-white text-sm">👑 [Admin] TotallyReal</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Emojis or text in the username — always fake</p>
          </div>
        </div>
      </DocSection>
    </DocLayout>
  );
};

export default Badges;
