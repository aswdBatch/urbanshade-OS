import { Package, Upload, FileCode, BookOpen, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { DocLayout, DocHero, DocSection, DocCode, DocAlert, DocCard } from "@/components/docs";

const UURDocs = () => {
  const manifestExample = `{
  "name": "my-awesome-app",
  "version": "1.0.0",
  "displayName": "My Awesome App",
  "description": "A cool app for UrbanShade OS",
  "author": "YourUsername",
  "icon": "Rocket",
  "category": "utilities",
  "main": "index.tsx",
  "permissions": ["filesystem", "notifications"],
  "tags": ["productivity", "tools"]
}`;

  const componentExample = `// index.tsx - Your app's entry point
import { useState } from "react";

export const MyAwesomeApp = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-foreground">
        My Awesome App
      </h1>
      <p className="text-muted-foreground">Count: {count}</p>
      <button
        onClick={() => setCount(c => c + 1)}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
      >
        Increment
      </button>
    </div>
  );
};

export default MyAwesomeApp;`;

  const categories = [
    { name: "utilities", description: "General utility apps", examples: "Calculator, Notes, Clock" },
    { name: "games", description: "Games and entertainment", examples: "Dice Roller, Reaction Test" },
    { name: "productivity", description: "Work and productivity tools", examples: "Spreadsheet, Calendar" },
    { name: "system", description: "System management apps", examples: "Task Manager, Settings" },
    { name: "facility", description: "Facility-specific apps", examples: "Containment Monitor, Cameras" },
    { name: "social", description: "Communication and social", examples: "Chat, Messages" }
  ];

  return (
    <DocLayout
      title="UUR Packages"
      description="Create and publish packages for the UrbanShade User Repository."
      keywords={["uur", "packages", "repository", "publish", "install"]}
      accentColor="teal"
      breadcrumbs={[{ label: "Developer", path: "/docs/dev" }]}
      prevPage={{ title: "System Bus", path: "/docs/dev/system-bus" }}
      nextPage={{ title: "Contributing", path: "/docs/dev/contributing" }}
    >
      <DocHero
        icon={Package}
        title="UrbanShade User Repository"
        subtitle="The in-simulation package repository for community-created apps, themes, and extensions."
        accentColor="teal"
      />

      <DocAlert variant="info" title="Simulation Feature">
        UUR is an in-simulation feature — packages are conceptual within the UrbanShade OS experience. 
        The submission system uses Supabase for real review tracking.
      </DocAlert>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/30 text-center">
          <Upload className="w-6 h-6 text-teal-400 mx-auto mb-2" />
          <h4 className="font-medium text-teal-100">Publish Apps</h4>
          <p className="text-xs text-teal-500/70 mt-1">Share with the community</p>
        </div>
        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-center">
          <Package className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
          <h4 className="font-medium text-cyan-100">Install Packages</h4>
          <p className="text-xs text-cyan-500/70 mt-1">One-click installation</p>
        </div>
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-center">
          <Shield className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <h4 className="font-medium text-blue-100">Moderated</h4>
          <p className="text-xs text-blue-500/70 mt-1">Safe & reviewed packages</p>
        </div>
      </div>

      <DocSection title="Package Structure" icon={FileCode} accentColor="teal">
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <div className="font-mono text-sm text-slate-300 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400">📁</span> my-awesome-app/
            </div>
            <div className="pl-6 flex items-center gap-2">
              <span className="text-amber-400">📄</span> manifest.json
              <span className="text-xs text-slate-500">← Package metadata</span>
            </div>
            <div className="pl-6 flex items-center gap-2">
              <span className="text-teal-400">📄</span> index.tsx
              <span className="text-xs text-slate-500">← Entry point</span>
            </div>
            <div className="pl-6 flex items-center gap-2">
              <span className="text-slate-500">📄</span> README.md
              <span className="text-xs text-slate-500">← Documentation</span>
            </div>
            <div className="pl-6 flex items-center gap-2">
              <span className="text-slate-500">📁</span> assets/
              <span className="text-xs text-slate-500">← Optional assets</span>
            </div>
          </div>
        </div>
      </DocSection>

      <DocSection title="Package Manifest" icon={BookOpen} accentColor="teal">
        <p className="text-slate-400 mb-4">
          Every package requires a <code className="text-teal-400">manifest.json</code> file:
        </p>
        <DocCode title="manifest.json" code={manifestExample} />
      </DocSection>

      <DocSection title="Package Categories" icon={Zap} accentColor="teal">
        <div className="grid gap-3 md:grid-cols-2">
          {categories.map((cat, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700">
              <code className="text-teal-400 text-sm font-mono">{cat.name}</code>
              <p className="text-slate-400 text-sm mt-1">{cat.description}</p>
              <p className="text-slate-600 text-xs mt-2">Examples: {cat.examples}</p>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Example App Component" icon={FileCode} accentColor="teal">
        <DocCode title="index.tsx" code={componentExample} />
      </DocSection>

      <div className="p-6 rounded-xl bg-gradient-to-br from-teal-500/10 via-slate-800/50 to-cyan-500/10 border border-teal-500/20 space-y-4">
        <h3 className="text-lg font-bold text-teal-100">Ready to Submit?</h3>
        <p className="text-slate-400 text-sm">
          Once your package is ready, submit it through the UUR app in UrbanShade OS.
          All submissions are reviewed by our moderation team before being published.
        </p>
        <Link
          to="/docs/applications"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-400 hover:bg-teal-500/30 transition-all text-sm"
        >
          View Apps Docs →
        </Link>
      </div>
    </DocLayout>
  );
};

export default UURDocs;
