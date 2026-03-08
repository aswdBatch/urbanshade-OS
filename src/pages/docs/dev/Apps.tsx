import { Puzzle, FileCode, Monitor, Layers, Zap } from "lucide-react";
import { DocLayout, DocHero, DocSection, DocCard, DocCode, DocAlert } from "@/components/docs";

const BuildingApps = () => {
  return (
    <DocLayout
      title="Building Apps"
      description="Create desktop applications for UrbanShade OS with React components."
      keywords={["apps", "components", "development", "react", "windows", "appRegistry"]}
      accentColor="blue"
      breadcrumbs={[{ label: "Developer Docs", path: "/docs/dev" }]}
      prevPage={{ title: "Theming", path: "/docs/dev/theming" }}
      nextPage={{ title: "Terminal Commands", path: "/docs/dev/terminal" }}
    >
      <DocHero
        icon={Puzzle}
        title="Building Apps"
        subtitle="Create desktop applications for UrbanShade OS."
        accentColor="blue"
      />

      <DocSection title="Step 1: Create the Component" icon={FileCode} accentColor="blue" id="component">
        <p className="text-slate-400 mb-4">
          Create a React component in <code className="px-2 py-0.5 bg-slate-800 rounded text-cyan-400">src/components/apps/</code>. 
          Every app receives a <code className="text-cyan-400">windowId</code> prop.
        </p>
        <DocCode
          title="src/components/apps/MyApp.tsx"
          code={`import { useState } from "react";

interface MyAppProps {
  windowId: string;
}

export const MyApp = ({ windowId }: MyAppProps) => {
  const [count, setCount] = useState(0);

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 p-4">
        <h1 className="text-xl font-bold">My App</h1>
        <p className="text-muted-foreground">Count: {count}</p>
        <button 
          onClick={() => setCount(c => c + 1)}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded"
        >
          Increment
        </button>
      </div>
    </div>
  );
};`}
        />
      </DocSection>

      <DocSection title="Step 2: Register in appRegistry.tsx" icon={Monitor} accentColor="blue" id="register">
        <p className="text-slate-400 mb-4">
          Add your app to the <code className="text-cyan-400">createAppRegistry</code> factory 
          in <code className="text-cyan-400">src/lib/appRegistry.tsx</code>. This is the single source 
          of truth for all app definitions.
        </p>
        <DocCode
          title="src/lib/appRegistry.tsx"
          code={`import { Rocket } from "lucide-react";

// Add to the createAppRegistry array:
export const createAppRegistry = (openAppById: (id: string) => void): App[] => [
  // ... existing apps ...
  { 
    id: "my-app",
    name: "My App", 
    icon: <Rocket className="w-11 h-11" />,
    run: () => openAppById("my-app"),
    standardInclude: true  // or minimalInclude, or downloadable
  },
];`}
        />
      </DocSection>

      <DocSection title="Step 3: Add Window Rendering" icon={Layers} accentColor="blue" id="window">
        <p className="text-slate-400 mb-4">
          Add a case to the switch statement in <code className="text-cyan-400">src/components/WindowManager.tsx</code> so 
          the window manager knows how to render your app.
        </p>
        <DocCode
          title="src/components/WindowManager.tsx"
          code={`// In the renderAppContent switch:
case "my-app":
  return <MyApp windowId={window.id} />;`}
        />
      </DocSection>

      <DocSection title="App Visibility Flags" icon={Zap} accentColor="blue" id="flags">
        <p className="text-slate-400 mb-4">
          The <code className="text-cyan-400">App</code> interface (from <code className="text-cyan-400">src/types/window.ts</code>) 
          has three mutually exclusive visibility flags:
        </p>
        <div className="space-y-3">
          <DocCard title="minimalInclude" accentColor="blue">
            <p className="mt-2 text-sm text-slate-400">
              App appears on the desktop in <strong>minimal</strong> and standard installations. 
              Reserved for core system apps (Terminal, Settings, File Explorer, Calculator).
            </p>
          </DocCard>
          <DocCard title="standardInclude" accentColor="blue">
            <p className="mt-2 text-sm text-slate-400">
              App appears on the desktop only in <strong>standard</strong> installations. 
              Used for facility-specific or social apps (Cameras, Messages, Personnel Center).
            </p>
          </DocCard>
          <DocCard title="downloadable" accentColor="blue">
            <p className="mt-2 text-sm text-slate-400">
              App does not appear by default. Users install it from the <strong>App Store</strong>. 
              Used for optional tools, games, and utilities (Notepad, Paint, Dice Roller).
            </p>
          </DocCard>
          <DocCard title="searchAliases" accentColor="blue">
            <p className="mt-2 text-sm text-slate-400">
              Optional <code className="text-cyan-400">string[]</code> of keywords so Global Search can 
              find the app by alternate names (e.g., <code className="text-cyan-400">["UCG", "blackjack", "card game"]</code>).
            </p>
          </DocCard>
        </div>
        <DocAlert variant="tip" title="Best Practice">
          Always use semantic design tokens (<code>bg-background</code>, <code>text-foreground</code>) instead of hardcoded colors. 
          Use <code>h-full flex flex-col</code> as your root layout to fill the window properly.
        </DocAlert>
      </DocSection>
    </DocLayout>
  );
};

export default BuildingApps;
