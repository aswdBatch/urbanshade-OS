import { Window } from "./Window";
import { WindowData } from "@/types/window";
import { VERSION } from "@/lib/versionInfo";

// Lazy imports for all app components
import { FileExplorer } from "./apps/FileExplorer";
import { SystemMonitor } from "./apps/SystemMonitor";
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

// Helper for GenericApp entries
const generic = (title: string, description: string, features: string[]) => 
  () => <GenericApp title={title} description={description} features={features} />;

export const WindowManager = ({ windows, onClose, onFocus, onMinimize, allWindows, onCloseWindow, onCriticalKill, onLockdown, onUpdate }: WindowManagerProps) => {
  
  // Build the app content map with closures over props
  const appContentMap: Record<string, () => JSX.Element> = {
    "app-store": () => <AppStore onInstall={() => window.dispatchEvent(new Event('storage'))} />,
    "explorer": () => <FileExplorer onVirusDetected={() => setTimeout(() => onCriticalKill("VIRUS_INFECTION", "virus"), 3000)} />,
    "monitor": () => <SystemMonitor />,
    "personnel-center": () => <PersonnelCenter />,
    "signal-interceptor": () => <SignalInterceptor />,
    "logger": () => <ActionLogger />,
    "network": () => <NetworkScanner />,
    "terminal": () => <Terminal onCrash={(type) => onCriticalKill("terminal.exe", type)} />,
    "task-manager": () => <TaskManager windows={allWindows} onCloseWindow={onCloseWindow} onCriticalKill={onCriticalKill} />,
    "system-messages": () => <SystemMessages />,
    "notification-history": () => <NotificationHistory />,
    "messages": () => <GlobalChat />,
    "incidents": () => <IncidentReports />,
    "database": () => <DatabaseViewer />,
    "browser": () => <Browser />,
    "audio-logs": () => <AudioLogs />,
    "cameras": () => <SecurityCameras />,
    "protocols": () => <EmergencyProtocols onLockdown={onLockdown} />,
    "map": () => <FacilityMap />,
    "research": () => <ResearchNotes />,
    "power": () => <PowerGrid />,
    "containment": () => <ContainmentMonitor />,
    "environment": () => <EnvironmentalControl />,
    "calculator": () => <Calculator />,
    "planner": () => <FacilityPlanner />,
    "downloads": () => <Downloads />,
    "plugin-store": () => <PluginStore />,
    "containment-game": () => <ContainmentGame onClose={() => { const wid = windows.find(w => w.app.id === 'containment-game')?.id; if (wid) onCloseWindow(wid); }} />,
    "crash-app": () => <CrashApp onCrash={(_, process) => onCriticalKill(process || "system.exe", "bluescreen")} />,
    "settings": () => <Settings onUpdate={onUpdate} />,
    "registry": () => <RegistryEditor />,
    "disk-manager": () => <DiskManager />,
    "vpn": () => <VPN />,
    "firewall": () => <Firewall />,
    "notepad": () => <Notepad />,
    "paint": () => <Paint />,
    "music-player": () => <MusicPlayer />,
    "weather": () => <Weather />,
    "clock": () => <Clock />,
    "calendar": generic("Event Calendar", "Schedule and event management system", ["Create and manage events", "Set reminders and notifications", "Sync with external calendars", "View monthly and weekly layouts"]),
    "notes": generic("Advanced Notes", "Rich text note-taking application", ["Rich text formatting", "Image and file attachments", "Organize with tags and folders", "Search and filter notes"]),
    "antivirus": generic("Virus Scanner", "Real-time threat detection and removal", ["Real-time scanning", "Quarantine management", "Scheduled scans", "Automatic updates"]),
    "backup": generic("Data Backup", "Automated backup system", ["Scheduled backups", "Incremental backups", "Cloud storage support", "One-click restore"]),
    "compression": generic("File Compressor", "Archive and compress files", ["Multiple format support", "Batch compression", "Encryption options", "Extract archives"]),
    "pdf-reader": () => <PdfReader />,
    "file-reader": () => <FileReader />,
    "installer": () => <GenericInstaller onComplete={() => { const wid = windows.find(w => w.app.id === "installer")?.id; if (wid) onCloseWindow(wid); }} />,
    "spreadsheet": () => <Spreadsheet />,
    "presentation": generic("Slide Maker", "Create professional presentations", ["Slide templates", "Animations and transitions", "Media embedding", "Presenter mode"]),
    "video-player": () => <VideoPlayer />,
    "video-editor": generic("Video Editor", "Edit and cut video files", ["Cut and trim clips", "Apply effects and filters", "Add audio tracks", "Export in multiple formats"]),
    "image-viewer": () => <ImageViewer />,
    "audio-editor": generic("Sound Editor", "Record and edit audio files", ["Multi-track recording", "Audio effects", "Noise reduction", "Format conversion"]),
    "game-center": () => <GameHub />,
    "ucg": () => <UntitledCardGame />,
    "untitled-card-game": () => <UntitledCardGame />,
    "dice-roller": () => <DiceRoller />,
    "reaction-test": () => <ReactionTest />,
    "fortune": () => <FortuneApp />,
    "chat": () => <InstantChat />,
    "video-call": generic("Video Conference", "Video calls and meetings", ["HD video calls", "Screen sharing", "Recording capability", "Virtual backgrounds"]),
    "email-client": () => <EmailClient />,
    "ftp": generic("FTP Manager", "File transfer protocol client", ["Secure FTP/SFTP", "Drag and drop transfers", "Queue management", "Site bookmarks"]),
    "ssh": generic("SSH Terminal", "Secure shell connections", ["SSH/SFTP support", "Key authentication", "Session management", "Port forwarding"]),
    "packet-analyzer": generic("Packet Sniffer", "Network traffic analysis tool", ["Capture network packets", "Protocol analysis", "Traffic statistics", "Filter expressions"]),
    "performance": generic("Performance Analyzer", "System diagnostics and optimization", ["CPU and memory profiling", "Disk performance", "Network analysis", "Optimization recommendations"]),
    "scanner": generic("Document Scanner", "Scan physical documents", ["High-resolution scanning", "OCR text recognition", "Multi-page documents", "Cloud upload"]),
    "translator": generic("Language Translator", "Multi-language translation service", ["50+ languages", "Voice translation", "Offline mode", "Phrase book"]),
    "dictionary": generic("Digital Dictionary", "Comprehensive word lookup", ["Definitions and synonyms", "Pronunciation guide", "Word of the day", "History and etymology"]),
    "encyclopedia": generic("Encyclopedia", "General knowledge database", ["Millions of articles", "Multimedia content", "Regular updates", "Cross-references"]),
    "map-viewer": generic("Map Navigator", "Interactive mapping system", ["Detailed maps", "Route planning", "Points of interest", "Offline maps"]),
    "gps": generic("GPS Tracker", "Location tracking system", ["Real-time location", "Route history", "Geofencing", "Location sharing"]),
    "astronomy": generic("Star Chart", "Celestial object tracking", ["Star maps", "Planet tracking", "Constellation guides", "Night sky simulation"]),
    "chemistry": generic("Chemistry Lab", "Molecular modeling tools", ["Periodic table", "Molecule builder", "Reaction simulator", "Chemical equations"]),
    "physics": generic("Physics Simulator", "Physical phenomena modeling", ["Motion simulation", "Force calculations", "Energy systems", "Wave dynamics"]),
    "biometric": generic("Biometric Scanner", "Fingerprint and iris scanning", ["Fingerprint authentication", "Iris recognition", "Face detection", "Security logging"]),
    "encryption": generic("File Encryptor", "Military-grade encryption", ["AES-256 encryption", "Password protection", "Secure deletion", "Batch encryption"]),
    "password-manager": generic("Password Vault", "Secure password storage", ["Encrypted vault", "Password generator", "Auto-fill forms", "Secure sharing"]),
    "account-settings": () => <AccountSettings />,
    "image-editor": () => <ImageEditor />,
    "img-editor": () => <ImageEditor />,
    "uur-manager": () => <UURApp onClose={() => { const wid = windows.find(w => w.app.id === "uur-manager")?.id; if (wid) onCloseWindow(wid); }} />,
    "computer-management": () => <ComputerManagement />,
    "shop": () => <Shop />,
    "certificate-viewer": () => <CertificateViewer />,
    "inventory": () => <Inventory />,
    "toaster-simulator": () => <ToasterSimulator />,
  };

  const getAppContent = (appId: string) => {
    const factory = appContentMap[appId];
    if (factory) return factory();
    return (
      <div className="p-4 text-muted-foreground">
        <p className="font-mono text-sm">[{appId.toUpperCase()}] Application interface loading...</p>
        <p className="mt-4 text-xs">Urbanshade OS {VERSION.displayVersion} — Application module</p>
      </div>
    );
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
