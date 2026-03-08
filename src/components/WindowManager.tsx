import { Window } from "./Window";
import { App, WindowData } from "@/types/window";
import { FileExplorer } from "./apps/FileExplorer";
import { SystemMonitor } from "./apps/SystemMonitor";
import { PersonnelDirectory } from "./apps/PersonnelDirectory";
import { ActionLogger } from "./apps/ActionLogger";
import { NetworkScanner } from "./apps/NetworkScanner";
import { Terminal } from "./apps/Terminal";
import { TaskManager } from "./apps/TaskManager";
import GlobalChat from "./apps/GlobalChat";
import { IncidentReports } from "./apps/IncidentReports";
import { DatabaseViewer } from "./apps/DatabaseViewer";
import { Browser } from "./apps/Browser";
import { AudioLogs } from "./apps/AudioLogs";
import { SecurityCameras } from "./apps/SecurityCameras";
import { EmergencyProtocols } from "./apps/EmergencyProtocols";
import { FacilityMap } from "./apps/FacilityMap";
import { ResearchNotes } from "./apps/ResearchNotes";
import { PowerGrid } from "./apps/PowerGrid";
import { ContainmentMonitor } from "./apps/ContainmentMonitor";
import { EnvironmentalControl } from "./apps/EnvironmentalControl";
import { Calculator } from "./apps/Calculator";
import { FacilityPlanner } from "./apps/FacilityPlanner";
import { AppStore } from "./apps/AppStore";
import { Notepad } from "./apps/Notepad";
import { Paint } from "./apps/Paint";
import { MusicPlayer } from "./apps/MusicPlayer";
import { Weather } from "./apps/Weather";
import { Clock } from "./apps/Clock";
import { GenericApp } from "./apps/GenericApp";
import { RegistryEditor } from "./apps/RegistryEditor";
import { DiskManager } from "./apps/DiskManager";
import { VPN } from "./apps/VPN";
import { Firewall } from "./apps/Firewall";
import { Downloads } from "./apps/Downloads";
import { PluginStore } from "./apps/PluginStore";
import { CrashApp } from "./apps/CrashApp";
import Settings from "./apps/Settings";
import { VideoPlayer } from "./apps/VideoPlayer";
import { ImageViewer } from "./apps/ImageViewer";
import { PdfReader } from "./apps/PdfReader";
import { FileReader } from "./apps/FileReader";
import { Spreadsheet } from "./apps/Spreadsheet";
import { EmailClient } from "./apps/EmailClient";
import { InstantChat } from "./apps/InstantChat";
import { GenericInstaller } from "./apps/GenericInstaller";
import { AccountSettings } from "./apps/AccountSettings";
import { ImageEditor } from "./apps/ImageEditor";
import { ComputerManagement } from "./apps/ComputerManagement";
import { UURApp } from "./apps/UURApp";
import { GameHub } from "./apps/GameHub";
import { ContainmentGame } from "./apps/ContainmentGame/ContainmentGame";
import { PersonnelCenter } from "./apps/PersonnelCenter";
import { SignalInterceptor } from "./apps/SignalInterceptor";
import { UntitledCardGame } from "./apps/UntitledCardGame";
import { Shop } from "./apps/Shop";
import { CertificateViewer } from "./apps/CertificateViewer";
import { DiceRoller } from "./apps/DiceRoller";
import { ReactionTest } from "./apps/ReactionTest";
import { FortuneApp } from "./apps/FortuneApp";
import { Inventory } from "./apps/Inventory";
import { SystemMessages } from "./apps/SystemMessages";
import { NotificationHistory } from "./NotificationHistory";
import { ToasterSimulator } from "./apps/ToasterSimulator";
import { UrbanshadeInstaller } from "./apps/UrbanshadeInstaller";

interface WindowManagerProps {
  windows: WindowData[];
  onClose: (id: string) => void;
  onFocus: (id: string) => void;
  onMinimize?: (id: string) => void;
  allWindows: WindowData[];
  onCloseWindow: (id: string) => void;
  onCriticalKill: (processName: string, type?: "kernel" | "virus" | "bluescreen" | "memory" | "corruption" | "overload") => void;
  onLockdown?: (protocolName: string) => void;
  onUpdate?: () => void;
}

export const WindowManager = ({ windows, onClose, onFocus, onMinimize, allWindows, onCloseWindow, onCriticalKill, onLockdown, onUpdate }: WindowManagerProps) => {
  const getAppContent = (appId: string) => {
    switch (appId) {
      case "app-store":
        return <AppStore onInstall={() => {
          // Refresh desktop when apps are installed
          window.dispatchEvent(new Event('storage'));
        }} />;
      case "explorer":
        return <FileExplorer onVirusDetected={() => {
          setTimeout(() => {
            onCriticalKill("VIRUS_INFECTION", "virus");
          }, 3000);
        }} />;
      case "monitor":
        return <SystemMonitor />;
      case "personnel-center":
        return <PersonnelCenter />;
      case "signal-interceptor":
        return <SignalInterceptor />;
      case "logger":
        return <ActionLogger />;
      case "network":
        return <NetworkScanner />;
      case "terminal":
        return <Terminal onCrash={(type) => onCriticalKill("terminal.exe", type)} />;
      case "task-manager":
        return <TaskManager windows={allWindows} onCloseWindow={onCloseWindow} onCriticalKill={onCriticalKill} />;
      case "system-messages":
        return <SystemMessages />;
      case "notification-history":
        return <NotificationHistory />;
      case "messages":
        return <GlobalChat />;
      case "incidents":
        return <IncidentReports />;
      case "database":
        return <DatabaseViewer />;
      case "browser":
        return <Browser />;
      case "audio-logs":
        return <AudioLogs />;
      case "cameras":
        return <SecurityCameras />;
      case "protocols":
        return <EmergencyProtocols onLockdown={onLockdown} />;
      case "map":
        return <FacilityMap />;
      case "research":
        return <ResearchNotes />;
      case "power":
        return <PowerGrid />;
      case "containment":
        return <ContainmentMonitor />;
      case "environment":
        return <EnvironmentalControl />;
      case "calculator":
        return <Calculator />;
      case "planner":
        return <FacilityPlanner />;
      case "downloads":
        return <Downloads />;
      case "plugin-store":
        return <PluginStore />;
      case "containment-game":
        return <ContainmentGame onClose={() => {
          const windowId = windows.find(w => w.app.id === 'containment-game')?.id;
          if (windowId) onCloseWindow(windowId);
        }} />;
      case "crash-app":
        return <CrashApp onCrash={(crashType, process) => onCriticalKill(process || "system.exe", "bluescreen")} />;
      case "settings":
        return <Settings onUpdate={onUpdate} />;
      case "registry":
        return <RegistryEditor />;
      case "disk-manager":
        return <DiskManager />;
      case "vpn":
        return <VPN />;
      case "firewall":
        return <Firewall />;
      case "notepad":
        return <Notepad />;
      case "paint":
        return <Paint />;
      case "music-player":
        return <MusicPlayer />;
      case "weather":
        return <Weather />;
      case "clock":
        return <Clock />;
      case "calendar":
        return <GenericApp title="Event Calendar" description="Schedule and event management system" features={["Create and manage events", "Set reminders and notifications", "Sync with external calendars", "View monthly and weekly layouts"]} />;
      case "notes":
        return <GenericApp title="Advanced Notes" description="Rich text note-taking application" features={["Rich text formatting", "Image and file attachments", "Organize with tags and folders", "Search and filter notes"]} />;
      case "antivirus":
        return <GenericApp title="Virus Scanner" description="Real-time threat detection and removal" features={["Real-time scanning", "Quarantine management", "Scheduled scans", "Automatic updates"]} />;
      case "backup":
        return <GenericApp title="Data Backup" description="Automated backup system" features={["Scheduled backups", "Incremental backups", "Cloud storage support", "One-click restore"]} />;
      case "compression":
        return <GenericApp title="File Compressor" description="Archive and compress files" features={["Multiple format support", "Batch compression", "Encryption options", "Extract archives"]} />;
      case "pdf-reader":
        return <PdfReader />;
      case "file-reader":
        return <FileReader />;
      case "installer":
        return <GenericInstaller onComplete={() => {
          const windowId = windows.find(w => w.app.id === appId)?.id;
          if (windowId) onCloseWindow(windowId);
        }} />;
      case "spreadsheet":
        return <Spreadsheet />;
      case "presentation":
        return <GenericApp title="Slide Maker" description="Create professional presentations" features={["Slide templates", "Animations and transitions", "Media embedding", "Presenter mode"]} />;
      case "music-player":
        return <VideoPlayer />;
      case "video-editor":
        return <GenericApp title="Video Editor" description="Edit and cut video files" features={["Cut and trim clips", "Apply effects and filters", "Add audio tracks", "Export in multiple formats"]} />;
      case "image-viewer":
        return <ImageViewer />;
      case "audio-editor":
        return <GenericApp title="Sound Editor" description="Record and edit audio files" features={["Multi-track recording", "Audio effects", "Noise reduction", "Format conversion"]} />;
      case "game-center":
        return <GameHub />;
      case "ucg":
      case "untitled-card-game":
        return <UntitledCardGame />;
      case "dice-roller":
        return <DiceRoller />;
      case "reaction-test":
        return <ReactionTest />;
      case "fortune":
        return <FortuneApp />;
      case "chat":
        return <InstantChat />;
      case "video-call":
        return <GenericApp title="Video Conference" description="Video calls and meetings" features={["HD video calls", "Screen sharing", "Recording capability", "Virtual backgrounds"]} />;
      case "email-client":
        return <EmailClient />;
      case "ftp":
        return <GenericApp title="FTP Manager" description="File transfer protocol client" features={["Secure FTP/SFTP", "Drag and drop transfers", "Queue management", "Site bookmarks"]} />;
      case "ssh":
        return <GenericApp title="SSH Terminal" description="Secure shell connections" features={["SSH/SFTP support", "Key authentication", "Session management", "Port forwarding"]} />;
      case "packet-analyzer":
        return <GenericApp title="Packet Sniffer" description="Network traffic analysis tool" features={["Capture network packets", "Protocol analysis", "Traffic statistics", "Filter expressions"]} />;
      case "performance":
        return <GenericApp title="Performance Analyzer" description="System diagnostics and optimization" features={["CPU and memory profiling", "Disk performance", "Network analysis", "Optimization recommendations"]} />;
      case "scanner":
        return <GenericApp title="Document Scanner" description="Scan physical documents" features={["High-resolution scanning", "OCR text recognition", "Multi-page documents", "Cloud upload"]} />;
      case "translator":
        return <GenericApp title="Language Translator" description="Multi-language translation service" features={["50+ languages", "Voice translation", "Offline mode", "Phrase book"]} />;
      case "dictionary":
        return <GenericApp title="Digital Dictionary" description="Comprehensive word lookup" features={["Definitions and synonyms", "Pronunciation guide", "Word of the day", "History and etymology"]} />;
      case "encyclopedia":
        return <GenericApp title="Encyclopedia" description="General knowledge database" features={["Millions of articles", "Multimedia content", "Regular updates", "Cross-references"]} />;
      case "map-viewer":
        return <GenericApp title="Map Navigator" description="Interactive mapping system" features={["Detailed maps", "Route planning", "Points of interest", "Offline maps"]} />;
      case "gps":
        return <GenericApp title="GPS Tracker" description="Location tracking system" features={["Real-time location", "Route history", "Geofencing", "Location sharing"]} />;
      case "astronomy":
        return <GenericApp title="Star Chart" description="Celestial object tracking" features={["Star maps", "Planet tracking", "Constellation guides", "Night sky simulation"]} />;
      case "chemistry":
        return <GenericApp title="Chemistry Lab" description="Molecular modeling tools" features={["Periodic table", "Molecule builder", "Reaction simulator", "Chemical equations"]} />;
      case "physics":
        return <GenericApp title="Physics Simulator" description="Physical phenomena modeling" features={["Motion simulation", "Force calculations", "Energy systems", "Wave dynamics"]} />;
      case "biometric":
        return <GenericApp title="Biometric Scanner" description="Fingerprint and iris scanning" features={["Fingerprint authentication", "Iris recognition", "Face detection", "Security logging"]} />;
      case "encryption":
        return <GenericApp title="File Encryptor" description="Military-grade encryption" features={["AES-256 encryption", "Password protection", "Secure deletion", "Batch encryption"]} />;
      case "password-manager":
        return <GenericApp title="Password Vault" description="Secure password storage" features={["Encrypted vault", "Password generator", "Auto-fill forms", "Secure sharing"]} />;
      case "account-settings":
        return <AccountSettings />;
      case "image-editor":
      case "img-editor":
        return <ImageEditor />;
      case "uur-manager":
        return <UURApp onClose={() => {
          const windowId = windows.find(w => w.app.id === "uur-manager")?.id;
          if (windowId) onCloseWindow(windowId);
        }} />;
      case "computer-management":
        return <ComputerManagement />;
      case "shop":
        return <Shop />;
      case "certificate-viewer":
        return <CertificateViewer />;
      case "inventory":
        return <Inventory />;
      case "toaster-simulator":
        return <ToasterSimulator />;
      default:
        return (
          <div className="p-4 text-muted-foreground">
            <p className="font-mono text-sm">
              [{appId.toUpperCase()}] Application interface loading...
            </p>
            <p className="mt-4 text-xs">
              Urbanshade OS v3.1 — Application module
            </p>
          </div>
        );
    }
  };

  return (
    <>
      {windows.filter(w => !w.minimized).map((window) => (
        <Window
          key={window.id}
          title={window.app.name}
          zIndex={window.zIndex}
          onClose={() => onClose(window.id)}
          onFocus={() => onFocus(window.id)}
          onMinimize={() => onMinimize && onMinimize(window.id)}
        >
          {getAppContent(window.app.id)}
        </Window>
      ))}
    </>
  );
};
