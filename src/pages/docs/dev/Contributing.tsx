import { GitBranch, BookOpen, Code, GitPullRequest, Users, Heart, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { DocLayout, DocHero, DocSection, DocCard, DocAlert, DocCode } from "@/components/docs";

const ContributingDocs = () => {
  const guidelines = [
    {
      title: "Code Style",
      items: [
        "Use TypeScript for all new code",
        "Follow existing naming conventions",
        "Use semantic CSS tokens from the design system",
        "Write meaningful commit messages"
      ]
    },
    {
      title: "Component Guidelines",
      items: [
        "Keep components focused and single-purpose",
        "Use hooks for shared logic",
        "Prefer composition over inheritance",
        "Document props with JSDoc comments"
      ]
    },
    {
      title: "Testing",
      items: [
        "Test new features before submitting",
        "Check for regressions in related areas",
        "Verify responsive behavior",
        "Test in multiple browsers if possible"
      ]
    }
  ];

  const prChecklist = [
    "Code follows project style guidelines",
    "No TypeScript errors or warnings",
    "Feature works as expected",
    "No console errors in browser",
    "PR description explains the changes",
    "Screenshots included for UI changes"
  ];

  const versionBumpChecklist = `// Version bump checklist — do ALL of these:

1. src/lib/version.json
   → Update "version" and "codename"

2. index.html  
   → Update the <title> tag to include new version

3. src/components/ChangelogDialog.tsx
   → Add a new changelog entry for the version`;

  const projectStructure = `src/
├── components/
│   ├── apps/              # Desktop application components
│   ├── ui/                # shadcn/ui primitives
│   ├── shared/            # Shared UI (avatars, spinners, etc.)
│   ├── widgets/           # Desktop widgets
│   ├── docs/              # Documentation layout components
│   ├── defdev/            # DEF-DEV developer tools
│   ├── moderation/        # Moderation panel tabs
│   └── *.tsx              # System components (Desktop, Taskbar, etc.)
├── hooks/                 # 40+ custom React hooks by domain
├── lib/                   # Utilities, registries, and helpers
│   ├── appRegistry.tsx    # Central app definition factory
│   ├── systemBus.ts       # Cross-component event bus
│   ├── persistence.ts     # localStorage state management
│   ├── terminalScripts.ts # Terminal script runner
│   └── version.json       # Current version metadata
├── pages/                 # Route pages (docs, admin, status, etc.)
├── types/                 # Shared TypeScript interfaces
└── integrations/          # Supabase client and generated types`;

  return (
    <DocLayout
      title="Contributing"
      description="How to contribute to UrbanShade OS - project structure, version bumps, and PR workflow."
      keywords={["contributing", "github", "pull request", "project structure", "version"]}
      accentColor="teal"
      breadcrumbs={[{ label: "Developer", path: "/docs/dev" }]}
      prevPage={{ title: "UUR Packages", path: "/docs/dev/uur" }}
      nextPage={{ title: "Developer Docs", path: "/docs/dev" }}
    >
      <DocHero
        icon={GitBranch}
        title="Contributing to UrbanShade OS"
        subtitle="Project structure, version bump workflow, and contribution guidelines."
        accentColor="teal"
      />

      <DocAlert variant="tip" title="Every Contribution Counts">
        <Heart className="w-4 h-4 inline mr-2 text-pink-400" />
        Every contribution, no matter how small, helps make UrbanShade OS better for everyone!
      </DocAlert>

      <DocSection title="Project Structure" icon={FileText} accentColor="teal" id="structure">
        <DocCode title="Directory Layout" code={projectStructure} />
      </DocSection>

      <DocSection title="Version Bump Checklist" icon={BookOpen} accentColor="teal" id="versions">
        <p className="text-slate-400 mb-4">
          When releasing a new version, you must update <strong>three files</strong>:
        </p>
        <DocCode title="Version Bump Steps" code={versionBumpChecklist} />
      </DocSection>

      <DocSection title="Getting Started" icon={BookOpen} accentColor="teal">
        <div className="space-y-3">
          {[
            { step: "1", title: "Fork the repository", desc: "Create your own copy on GitHub" },
            { step: "2", title: "Clone locally", desc: "git clone your-fork-url" },
            { step: "3", title: "Create a branch", desc: "git checkout -b feature/your-feature-name" },
            { step: "4", title: "Make changes", desc: "Write your code and test it" },
            { step: "5", title: "Commit changes", desc: "Use descriptive commit messages" },
            { step: "6", title: "Push & create PR", desc: "Submit your pull request for review" }
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-sm flex-shrink-0">
                {item.step}
              </div>
              <div>
                <h4 className="font-medium text-slate-200">{item.title}</h4>
                <p className="text-sm text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Guidelines" icon={Code} accentColor="teal">
        <div className="grid gap-4 md:grid-cols-3">
          {guidelines.map((section, i) => (
            <div key={i} className="p-5 rounded-xl bg-slate-800/50 border border-slate-700">
              <h4 className="font-semibold text-teal-100 mb-3">{section.title}</h4>
              <ul className="space-y-2">
                {section.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-slate-400">
                    <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Pull Request Checklist" icon={GitPullRequest} accentColor="teal">
        <p className="text-slate-400 text-sm mb-4">Before submitting your PR, please ensure:</p>
        <div className="grid gap-2 md:grid-cols-2">
          {prChecklist.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700">
              <div className="w-5 h-5 rounded border border-teal-500/50 flex items-center justify-center">
                <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <span className="text-sm text-slate-300">{item}</span>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Ways to Contribute" icon={Users} accentColor="teal">
        <div className="grid gap-4 md:grid-cols-2">
          <DocCard title="Bug Fixes" description="Found a bug? Fix it and submit a PR!" icon={AlertCircle} accentColor="red" />
          <DocCard title="New Features" description="Have an idea? Discuss it first, then implement." icon={Code} accentColor="teal" />
          <DocCard title="Documentation" description="Help improve our docs and guides." icon={BookOpen} accentColor="blue" />
          <DocCard title="Testing" description="Help test new features and report issues." icon={CheckCircle} accentColor="green" />
        </div>
      </DocSection>
    </DocLayout>
  );
};

export default ContributingDocs;
