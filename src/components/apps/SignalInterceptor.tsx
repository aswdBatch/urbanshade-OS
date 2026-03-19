import { useState, useEffect, useRef } from "react";
import { Radio, Volume2, VolumeX, Waves, Signal, AlertTriangle, Lock, Zap, Activity } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Transmission {
  id: string;
  frequency: number;
  timestamp: Date;
  type: "voice" | "data" | "static" | "encrypted" | "anomaly";
  content: string;
  strength: number;
  classified: boolean;
}

const TRANSMISSION_SNIPPETS = {
  voice: [
    "...containment breach in sector 7... all personnel evacuate...",
    "...this is Dr. Chen, requesting immediate backup at Lab A-3...",
    "...security team to the main entrance, we have visitors...",
    "...power fluctuation detected... switching to auxiliary...",
    "...subject 12 is not responding to sedatives... increase dosage...",
    "...maintenance crew report to ventilation shaft B...",
    "...all clear in Zone 4... resuming patrol...",
    "...cafeteria is now closed for decontamination...",
  ],
  data: [
    "[TELEMETRY] Sensor grid: NOMINAL | Power: 94% | Temp: 22.4°C",
    "[SYSTEM] Automated lockdown sequence: STANDBY",
    "[LOG] Personnel count: 247 | Guests: 0 | Subjects: 13",
    "[ALERT] Perimeter sensor 12B: Motion detected",
    "[DATA] Backup complete: 847.2GB transferred",
    "[SYNC] External servers: CONNECTION LOST",
  ],
  static: [
    "▓▓▓░░▓▓▓░▓░░▓▓░░░▓▓▓░░▓",
    "█░█░░░█░█░░░█░░█░█░░█░█",
    "░░▓▓░░░▓░▓▓░░▓▓▓░░░▓▓░░",
    "▓░░░▓▓▓░░▓░░▓░░░▓▓░░▓░▓",
  ],
  encrypted: [
    "[ENCRYPTED] ██████████████████████████",
    "[SCRAMBLED] ▒▒▒ AUTH REQUIRED ▒▒▒",
    "[CLASSIFIED] ACCESS LEVEL 5 REQUIRED",
    "[REDACTED] ████ OMEGA PROTOCOL ████",
  ],
  anomaly: [
    "⚠ UNKNOWN SIGNAL SOURCE DETECTED",
    "⚠ FREQUENCY PATTERN: NON-STANDARD",
    "⚠ POSSIBLE EXTRA-FACILITY ORIGIN",
    "⚠ SIGNAL INTERFERENCE: UNEXPLAINED",
  ],
};

export const SignalInterceptor = () => {
  const [frequency, setFrequency] = useState([108.5]);
  const [volume, setVolume] = useState([50]);
  const [isMuted, setIsMuted] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [transmissions, setTransmissions] = useState<Transmission[]>([]);
  const [signalStrength, setSignalStrength] = useState(0);
  const [activeSignal, setActiveSignal] = useState<string | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const signalIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulate signal strength fluctuation
  useEffect(() => {
    signalIntervalRef.current = setInterval(() => {
      const baseStrength = getBaseSignalStrength(frequency[0]);
      const fluctuation = Math.random() * 20 - 10;
      setSignalStrength(Math.max(0, Math.min(100, baseStrength + fluctuation)));
    }, 200);

    return () => {
      if (signalIntervalRef.current) clearInterval(signalIntervalRef.current);
    };
  }, [frequency]);

  // Generate random transmission when scanning
  useEffect(() => {
    if (isScanning) {
      scanIntervalRef.current = setInterval(() => {
        const transmission = generateTransmission(frequency[0]);
        if (transmission) {
          setTransmissions(prev => [transmission, ...prev].slice(0, 50));
          setActiveSignal(transmission.id);
          setTimeout(() => setActiveSignal(null), 1000);
        }
      }, 2000 + Math.random() * 3000);
    } else {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    }

    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, [isScanning, frequency]);

  const getBaseSignalStrength = (freq: number): number => {
    // Different frequency ranges have different signal strengths
    if (freq >= 88 && freq <= 92) return 75; // Strong voice band
    if (freq >= 100 && freq <= 105) return 85; // Data band
    if (freq >= 118 && freq <= 122) return 40; // Encrypted band
    if (freq >= 130 && freq <= 135) return 25; // Anomaly band
    return 50 + Math.sin(freq * 0.5) * 30;
  };

  const getFrequencyBand = (freq: number): Transmission["type"] => {
    if (freq >= 88 && freq <= 95) return "voice";
    if (freq >= 100 && freq <= 110) return "data";
    if (freq >= 115 && freq <= 125) return "encrypted";
    if (freq >= 130 && freq <= 140) return "anomaly";
    return "static";
  };

  const generateTransmission = (freq: number): Transmission | null => {
    if (Math.random() < 0.3) return null; // 30% chance of no signal

    const type = getFrequencyBand(freq);
    const snippets = TRANSMISSION_SNIPPETS[type];
    const content = snippets[Math.floor(Math.random() * snippets.length)];

    return {
      id: `tx-${Date.now()}`,
      frequency: freq + (Math.random() * 0.4 - 0.2),
      timestamp: new Date(),
      type,
      content,
      strength: getBaseSignalStrength(freq) + Math.random() * 20 - 10,
      classified: type === "encrypted" || type === "anomaly",
    };
  };

  const getTypeColor = (type: Transmission["type"]) => {
    switch (type) {
      case "voice": return "text-green-400 bg-green-500/20 border-green-500/30";
      case "data": return "text-blue-400 bg-blue-500/20 border-blue-500/30";
      case "static": return "text-muted-foreground bg-muted/30 border-border";
      case "encrypted": return "text-red-400 bg-red-500/20 border-red-500/30";
      case "anomaly": return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
    }
  };

  const getTypeIcon = (type: Transmission["type"]) => {
    switch (type) {
      case "voice": return <Volume2 className="w-3.5 h-3.5" />;
      case "data": return <Activity className="w-3.5 h-3.5" />;
      case "static": return <Waves className="w-3.5 h-3.5" />;
      case "encrypted": return <Lock className="w-3.5 h-3.5" />;
      case "anomaly": return <AlertTriangle className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border p-4 bg-muted/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Radio className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Signal Interceptor</h1>
          </div>
          <Badge variant={isScanning ? "default" : "outline"} className={isScanning ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}>
            {isScanning ? "SCANNING" : "IDLE"}
          </Badge>
        </div>

        {/* Frequency Display */}
        <div className="p-4 rounded-lg bg-black/40 border border-border mb-4 font-mono">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">FREQUENCY</span>
            <span className="text-xs text-muted-foreground">BAND: {getFrequencyBand(frequency[0]).toUpperCase()}</span>
          </div>
          <div className="text-4xl font-bold text-primary text-center mb-2">
            {frequency[0].toFixed(1)} <span className="text-lg text-muted-foreground">MHz</span>
          </div>
          
          {/* Signal Strength Bar */}
          <div className="h-2 bg-black/50 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-200"
              style={{ 
                width: `${signalStrength}%`,
                background: signalStrength > 70 ? '#22c55e' : signalStrength > 40 ? '#eab308' : '#ef4444'
              }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
            <span>SIGNAL: {signalStrength.toFixed(0)}%</span>
            <span>{signalStrength > 70 ? 'STRONG' : signalStrength > 40 ? 'MODERATE' : 'WEAK'}</span>
          </div>
        </div>

        {/* Frequency Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>88.0 MHz</span>
            <span>140.0 MHz</span>
          </div>
          <Slider
            value={frequency}
            onValueChange={setFrequency}
            min={88}
            max={140}
            step={0.1}
            className="w-full"
          />
          
          {/* Frequency Bands Legend */}
          <div className="flex flex-wrap gap-2 text-[10px]">
            <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400">88-95: VOICE</span>
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">100-110: DATA</span>
            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400">115-125: ENCRYPTED</span>
            <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">130-140: ANOMALY</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mt-4">
          <Button
            onClick={() => setIsScanning(!isScanning)}
            variant={isScanning ? "destructive" : "default"}
            className="flex-1"
          >
            {isScanning ? (
              <>
                <Signal className="w-4 h-4 mr-2 animate-pulse" />
                Stop Scanning
              </>
            ) : (
              <>
                <Radio className="w-4 h-4 mr-2" />
                Start Scanning
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          
          <div className="flex items-center gap-2 w-32">
            <Slider
              value={volume}
              onValueChange={setVolume}
              min={0}
              max={100}
              step={1}
              disabled={isMuted}
            />
          </div>
        </div>
      </div>

      {/* Transmission Log */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-border bg-muted/10">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Intercepted Transmissions</span>
            <span className="text-xs text-muted-foreground">{transmissions.length} captured</span>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          {transmissions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Radio className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No transmissions intercepted</p>
              <p className="text-xs mt-1">Start scanning to capture signals</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {transmissions.map((tx) => (
                <div
                  key={tx.id}
                  className={`p-3 rounded-lg border transition-all ${getTypeColor(tx.type)} ${
                    activeSignal === tx.id ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getTypeIcon(tx.type)}
                    <span className="text-xs font-medium uppercase">{tx.type}</span>
                    <span className="text-xs opacity-70">{tx.frequency.toFixed(2)} MHz</span>
                    {tx.classified && (
                      <Badge variant="outline" className="text-[9px] px-1 ml-auto">
                        <Lock className="w-2.5 h-2.5 mr-0.5" />
                        CLASSIFIED
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-mono leading-relaxed">{tx.content}</p>
                  <div className="flex items-center justify-between mt-2 text-[10px] opacity-70">
                    <span>{tx.timestamp.toLocaleTimeString()}</span>
                    <span>Signal: {tx.strength.toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};
