import { Terminal, Zap, Code, FileText } from "lucide-react";
import { DocLayout, DocHero, DocSection, DocCode, DocAlert } from "@/components/docs";

const TerminalDocs = () => {
  const commands = [
    { name: "help", description: "Display available commands", usage: "help [command]", example: "help cd" },
    { name: "ls / dir", description: "List directory contents", usage: "ls [path]", example: "ls /home/user/documents" },
    { name: "cd", description: "Change current directory", usage: "cd <path>", example: "cd /system/config" },
    { name: "cat", description: "Display file contents", usage: "cat <filename>", example: "cat readme.txt" },
    { name: "mkdir", description: "Create a new directory", usage: "mkdir <dirname>", example: "mkdir projects" },
    { name: "rm", description: "Remove files or directories", usage: "rm [-r] <path>", example: "rm -r old_folder" },
    { name: "echo", description: "Print text to terminal", usage: "echo <text>", example: "echo Hello World" },
    { name: "clear", description: "Clear terminal screen", usage: "clear", example: "clear" },
    { name: "whoami", description: "Display current user", usage: "whoami", example: "whoami" },
    { name: "sudo", description: "Execute command as admin", usage: "sudo <command>", example: "sudo reboot" }
  ];

  const scriptInterface = `// src/lib/terminalScripts.ts

interface TerminalScript {
  id: string;           // Unique ID (auto-generated)
  name: string;         // Display name
  description?: string; // Optional description
  commands: string[];   // Array of commands to execute in sequence
  createdAt: string;    // ISO timestamp
  lastRun?: string;     // Last execution timestamp
  runCount: number;     // Times executed
}`;

  const scriptApiExample = `import { 
  getScripts, 
  saveScript, 
  updateScript, 
  deleteScript, 
  markScriptRun, 
  getScript 
} from "@/lib/terminalScripts";

// Get all saved scripts (includes defaults if none saved)
const scripts = getScripts();

// Save a new script
const newScript = saveScript({
  name: "Morning Routine",
  description: "Run diagnostics and check status",
  commands: ["neofetch", "uptime", "whoami"]
});

// Update an existing script
updateScript(newScript.id, { 
  name: "Updated Routine",
  commands: ["neofetch", "uptime", "whoami", "echo Done!"]
});

// Mark a script as run (increments runCount, sets lastRun)
markScriptRun(newScript.id);

// Delete a script
deleteScript(newScript.id);`;

  const defaultScriptsExample = `// Built-in default scripts:

{
  id: "system-check",
  name: "System Check",
  description: "Run basic system diagnostics",
  commands: ["neofetch", "uptime", "whoami"]
}

{
  id: "dev-setup",
  name: "Dev Setup", 
  description: "Enable developer mode and open DEF-DEV",
  commands: ["sudo set developer_mode true", "echo \\"Dev mode enabled\\""]
}`;

  return (
    <DocLayout
      title="Terminal Commands"
      description="Built-in terminal commands and the Terminal Scripts system in UrbanShade OS."
      keywords={["terminal", "commands", "cli", "shell", "scripts"]}
      accentColor="teal"
      breadcrumbs={[{ label: "Developer", path: "/docs/dev" }]}
      prevPage={{ title: "Building Apps", path: "/docs/dev/apps" }}
      nextPage={{ title: "System Bus", path: "/docs/dev/system-bus" }}
    >
      <DocHero
        icon={Terminal}
        title="Terminal & Scripts"
        subtitle="Built-in commands and the script runner for saving and executing multi-command sequences."
        accentColor="teal"
      />

      <DocSection title="Built-in Commands" icon={Zap} accentColor="teal">
        <div className="space-y-3">
          {commands.map((cmd, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="px-2 py-1 rounded-lg bg-teal-500/20 text-teal-400 font-mono text-sm">
                      {cmd.name}
                    </code>
                    <span className="text-slate-400 text-sm">{cmd.description}</span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    Usage: <span className="text-cyan-400">{cmd.usage}</span>
                  </div>
                </div>
                <code className="text-xs text-slate-500 font-mono bg-slate-900 px-2 py-1 rounded">
                  {cmd.example}
                </code>
              </div>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Terminal Scripts" icon={FileText} accentColor="teal" id="scripts">
        <p className="text-slate-400 mb-4">
          The script system (<code className="text-teal-400">src/lib/terminalScripts.ts</code>) lets you 
          save, load, and run multi-command scripts. Scripts are persisted to localStorage.
        </p>
        <DocCode title="TerminalScript Interface" code={scriptInterface} />
      </DocSection>

      <DocSection title="Script API" icon={Code} accentColor="teal" id="api">
        <DocCode title="Using the Script Manager" code={scriptApiExample} />
        
        <DocAlert variant="tip" title="Default Scripts">
          If no scripts are saved, <code>getScripts()</code> returns two built-in defaults:
        </DocAlert>
        <DocCode title="Default Scripts" code={defaultScriptsExample} />
      </DocSection>
    </DocLayout>
  );
};

export default TerminalDocs;
