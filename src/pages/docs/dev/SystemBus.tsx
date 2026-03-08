import { Cpu, Zap, MessageSquare, Radio, Code } from "lucide-react";
import { DocLayout, DocHero, DocSection, DocCode, DocTable, DocAlert } from "@/components/docs";

const SystemBusDocs = () => {
  const events = [
    ["TRIGGER_CRASH", "Trigger a crash screen", "{ crashType: CrashType, process?: string }"],
    ["TRIGGER_BUGCHECK", "Trigger a blue screen / bugcheck", "{ code: string, description: string }"],
    ["TRIGGER_LOCKDOWN", "Activate facility lockdown", "{ protocol: string }"],
    ["ENTER_RECOVERY", "Enter recovery environment", "—"],
    ["TRIGGER_REBOOT", "Reboot the OS", "—"],
    ["TRIGGER_SHUTDOWN", "Shut down the OS", "—"],
    ["OPEN_DEV_MODE", "Open DEF-DEV developer tools", "—"],
    ["CLOSE_ADMIN_PANEL", "Close the admin panel", "—"],
    ["CUSTOM_COMMAND", "Custom user-defined event", "any"],
  ];

  const subscribeExample = `import { systemBus } from "@/lib/systemBus";
import { useEffect } from "react";

// Subscribe to a specific event
useEffect(() => {
  const unsubscribe = systemBus.on("TRIGGER_CRASH", (event) => {
    console.log("Crash triggered:", event.payload);
    // event.type = "TRIGGER_CRASH"
    // event.payload = { crashType, process }
    // event.timestamp = Date
  });

  return () => unsubscribe();
}, []);

// Subscribe to ALL events
useEffect(() => {
  const unsubscribe = systemBus.onAny((event) => {
    console.log("System event:", event.type, event.payload);
  });
  return () => unsubscribe();
}, []);`;

  const emitExample = `import { systemBus } from "@/lib/systemBus";

// Using emit() directly
systemBus.emit("TRIGGER_CRASH", { 
  crashType: "memory", 
  process: "my-app" 
});

// Using convenience methods (recommended)
systemBus.triggerCrash("memory", "my-app");
systemBus.triggerBugcheck("0x0000007E", "SYSTEM_THREAD_EXCEPTION");
systemBus.triggerLockdown("ALPHA");
systemBus.enterRecovery();
systemBus.triggerReboot();
systemBus.triggerShutdown();
systemBus.openDevMode();
systemBus.closeAdminPanel();`;

  const domEventExample = `// SystemBus also dispatches DOM CustomEvents
// Useful for non-React code or cross-frame communication
window.addEventListener("systembus-event", (e) => {
  const event = (e as CustomEvent).detail;
  console.log(event.type, event.payload);
});

// Debug access: systemBus is on window
window.systemBus.triggerReboot();`;

  return (
    <DocLayout
      title="System Bus API"
      description="Typed event bus for inter-component communication in UrbanShade OS."
      keywords={["system bus", "events", "pub/sub", "messaging", "api", "crashes", "reboot"]}
      accentColor="teal"
      breadcrumbs={[{ label: "Developer", path: "/docs/dev" }]}
      prevPage={{ title: "Terminal Commands", path: "/docs/dev/terminal" }}
      nextPage={{ title: "UUR Packages", path: "/docs/dev/uur" }}
    >
      <DocHero
        icon={Cpu}
        title="System Bus API"
        subtitle="A typed pub/sub event bus for triggering system events without direct prop coupling."
        accentColor="teal"
      />

      <div className="flex flex-wrap gap-3 mb-8">
        <div className="px-4 py-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 text-sm">
          <Radio className="w-4 h-4 inline mr-2" />
          Singleton Instance
        </div>
        <div className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm">
          <Zap className="w-4 h-4 inline mr-2" />
          Typed SystemEventType Enum
        </div>
        <div className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm">
          <MessageSquare className="w-4 h-4 inline mr-2" />
          DOM CustomEvent Bridge
        </div>
      </div>

      <DocSection title="Event Types" icon={Zap} accentColor="teal" id="events">
        <p className="text-slate-400 mb-4">
          All events are typed via the <code className="text-teal-400">SystemEventType</code> union. 
          Each event wraps into a <code className="text-teal-400">SystemEvent</code> object with <code className="text-teal-400">type</code>, <code className="text-teal-400">payload</code>, and <code className="text-teal-400">timestamp</code>.
        </p>
        <DocTable
          headers={["Event Type", "Description", "Payload"]}
          rows={events}
        />
      </DocSection>

      <DocSection title="Subscribing to Events" icon={MessageSquare} accentColor="teal" id="subscribe">
        <p className="text-slate-400 mb-4">
          Use <code className="text-teal-400">systemBus.on(type, callback)</code> for specific events 
          or <code className="text-teal-400">systemBus.onAny(callback)</code> for all events. Both return 
          an unsubscribe function.
        </p>
        <DocCode title="Subscribe Examples" code={subscribeExample} />
      </DocSection>

      <DocSection title="Emitting Events" icon={Radio} accentColor="teal" id="emit">
        <p className="text-slate-400 mb-4">
          Use the convenience methods for type-safe event emission. The raw <code className="text-teal-400">emit()</code> method 
          is also available for <code className="text-teal-400">CUSTOM_COMMAND</code> or advanced use.
        </p>
        <DocCode title="Emit Examples" code={emitExample} />
      </DocSection>

      <DocSection title="DOM Events & Debug" icon={Code} accentColor="teal" id="dom">
        <p className="text-slate-400 mb-4">
          Every SystemBus event is also dispatched as a DOM <code className="text-teal-400">CustomEvent</code> on <code className="text-teal-400">window</code>, 
          and the bus instance is exposed globally for debugging.
        </p>
        <DocCode title="DOM Event Bridge" code={domEventExample} />
        
        <DocAlert variant="tip" title="Debug Tip">
          Open your browser console and type <code>window.systemBus.triggerReboot()</code> to test events live.
        </DocAlert>
      </DocSection>
    </DocLayout>
  );
};

export default SystemBusDocs;
