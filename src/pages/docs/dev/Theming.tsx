import { Palette, Droplets, Sun, Moon, Code, Zap } from "lucide-react";
import { DocLayout, DocHero, DocSection, DocCode, DocAlert, DocCard } from "@/components/docs";

const Theming = () => {
  const rootTokens = `:root {
  --background: 212 75% 4%;
  --foreground: 192 100% 96%;
  --primary: 186 100% 44%;
  --primary-foreground: 210 100% 3%;
  --accent: 186 100% 50%;
  --muted: 210 30% 15%;
  --glow: 186 100% 50%;
  --secondary: 212 40% 10%;
  --destructive: 0 84% 60%;
  --border: 210 30% 18%;
  --card: 212 60% 6%;
  --popover: 212 60% 6%;
  /* ... and more */
}`;

  const lightTokens = `.light {
  --background: 210 20% 98%;
  --foreground: 212 75% 10%;
  --primary: 186 100% 35%;
  /* ... light mode overrides */
}`;

  const usageExample = `// ✅ Correct - uses design tokens
<div className="bg-background text-foreground border-border">
  <button className="bg-primary text-primary-foreground">
    Click me
  </button>
</div>

// ❌ Avoid - hardcoded colors
<div className="bg-slate-900 text-white border-gray-700">
  <button className="bg-cyan-500 text-black">
    Click me
  </button>
</div>`;

  const colors = [
    { name: "Primary", color: "bg-primary", hsl: "186 100% 44%" },
    { name: "Background", color: "bg-background", hsl: "212 75% 4%" },
    { name: "Foreground", color: "bg-foreground", hsl: "192 100% 96%" },
    { name: "Accent", color: "bg-accent", hsl: "186 100% 50%" },
    { name: "Muted", color: "bg-muted", hsl: "210 30% 15%" },
    { name: "Destructive", color: "bg-destructive", hsl: "0 84% 60%" },
    { name: "Secondary", color: "bg-secondary", hsl: "212 40% 10%" },
    { name: "Glow", color: "bg-cyan-400", hsl: "186 100% 50%" }
  ];

  return (
    <DocLayout
      title="Theming & Styling"
      description="Create custom themes for UrbanShade OS using CSS custom properties, useThemeEngine, and the Theme Editor app."
      keywords={["theming", "styling", "css", "design tokens", "dark mode", "light mode", "useThemeEngine"]}
      accentColor="purple"
      breadcrumbs={[{ label: "Developer", path: "/docs/dev" }]}
      prevPage={{ title: "Architecture", path: "/docs/dev/architecture" }}
      nextPage={{ title: "Building Apps", path: "/docs/dev/apps" }}
    >
      <DocHero
        icon={Palette}
        title="Theming & Styling"
        subtitle="Create custom themes using design tokens, the theme engine, and the built-in Theme Editor."
        accentColor="purple"
      />

      <DocSection title="Design Tokens" icon={Droplets} accentColor="purple">
        <p className="text-slate-400 mb-4">
          UrbanShade uses CSS custom properties (variables) in HSL format, defined in <code className="px-2 py-0.5 bg-slate-800 rounded text-purple-400">src/index.css</code>. 
          All colors are referenced through Tailwind semantic classes.
        </p>
        <DocCode title="Root Variables" code={rootTokens} />
      </DocSection>

      <DocSection title="Core Color Palette" icon={Palette} accentColor="purple">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {colors.map((c, i) => (
            <div key={i} className="space-y-2">
              <div className={`h-16 rounded-lg ${c.color} border border-slate-700`} />
              <div>
                <p className="font-medium text-slate-200 text-sm">{c.name}</p>
                <p className="text-xs text-slate-500 font-mono">{c.hsl}</p>
              </div>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Theme Engine & Presets" icon={Zap} accentColor="purple" id="engine">
        <p className="text-slate-400 mb-4">
          Two hooks power the theming system:
        </p>
        <div className="space-y-3">
          <DocCard title="useThemeEngine" accentColor="purple">
            <p className="mt-2 text-sm text-slate-400">
              Manages the active theme, applies CSS variables to the document root, handles theme switching, 
              and persists the user's selection to localStorage.
            </p>
          </DocCard>
          <DocCard title="useThemePresets" accentColor="purple">
            <p className="mt-2 text-sm text-slate-400">
              Provides a library of built-in theme presets (dark, light, high-contrast, and custom facility themes). 
              Used by the Settings app and Theme Editor.
            </p>
          </DocCard>
        </div>
        <p className="text-slate-400 mt-4">
          The <strong>Theme Editor</strong> app (accessible via Settings → Appearance) provides a visual UI 
          for creating custom themes by adjusting CSS variables in real time.
        </p>
      </DocSection>

      <DocSection title="Light & Dark Mode" icon={Sun} accentColor="purple">
        <div className="flex items-center gap-2 mb-4">
          <Sun className="w-5 h-5 text-amber-400" />
          <Moon className="w-5 h-5 text-blue-400" />
        </div>
        <p className="text-slate-400 mb-4">
          The <code className="px-2 py-0.5 bg-slate-800 rounded text-purple-400">.light</code> class provides alternate token values for light mode. Toggle is handled by the Settings app.
        </p>
        <DocCode title="Light Mode Overrides" code={lightTokens} />
      </DocSection>

      <DocSection title="Using Tokens in Components" icon={Code} accentColor="purple">
        <p className="text-slate-400 mb-4">
          Always use Tailwind's semantic classes that reference these tokens:
        </p>
        <DocCode title="Component Usage" code={usageExample} />
        
        <DocAlert variant="tip" title="Best Practice">
          Never use hardcoded color classes like <code>bg-slate-900</code> or <code>text-white</code> in components. 
          Always use semantic tokens like <code>bg-background</code> and <code>text-foreground</code> for proper theme support.
        </DocAlert>
      </DocSection>
    </DocLayout>
  );
};

export default Theming;
