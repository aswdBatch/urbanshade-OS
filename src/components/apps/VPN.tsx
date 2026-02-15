import { useState, useEffect } from "react";
import { Shield, Power, Globe, Lock, Zap, MapPin, Activity, Skull, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { vpnState } from "@/lib/vpnState";
import { trackDarkVPNConnect } from "@/hooks/useAchievementTriggers";

interface VPNServer {
  id: string;
  name: string;
  country: string;
  city: string;
  latency: number;
  load: number;
}

const SERVERS: VPNServer[] = [
  { id: "us-ny-1", name: "New York #1", country: "USA", city: "New York", latency: 12, load: 45 },
  { id: "us-la-1", name: "Los Angeles #1", country: "USA", city: "Los Angeles", latency: 28, load: 62 },
  { id: "uk-lon-1", name: "London #1", country: "UK", city: "London", latency: 87, load: 38 },
  { id: "de-ber-1", name: "Berlin #1", country: "Germany", city: "Berlin", latency: 95, load: 51 },
  { id: "jp-tok-1", name: "Tokyo #1", country: "Japan", city: "Tokyo", latency: 145, load: 73 },
  { id: "au-syd-1", name: "Sydney #1", country: "Australia", city: "Sydney", latency: 187, load: 29 },
  { id: "sg-sin-1", name: "Singapore #1", country: "Singapore", city: "Singapore", latency: 156, load: 67 },
  { id: "fr-par-1", name: "Paris #1", country: "France", city: "Paris", latency: 92, load: 41 },
];

// Dark web servers - only visible when VPN is connected
const DARK_SERVERS: VPNServer[] = [
  { id: "dark-abyss-1", name: "Abyss Node", country: "???", city: "The Depths", latency: 666, load: 13 },
  { id: "dark-void-1", name: "Void Relay", country: "???", city: "Blacksite", latency: 999, load: 7 },
];

export const VPN = () => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [selectedServer, setSelectedServer] = useState<VPNServer | null>(null);
  const [realIP, setRealIP] = useState("192.168.1.100");
  const [vpnIP, setVpnIP] = useState("");
  const [dataTransferred, setDataTransferred] = useState({ up: 0, down: 0 });

  useEffect(() => {
    if (connected) {
      const interval = setInterval(() => {
        setDataTransferred(prev => ({
          up: prev.up + Math.random() * 0.5,
          down: prev.down + Math.random() * 2
        }));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [connected]);

  const handleConnect = async () => {
    if (!selectedServer) {
      toast.error("Please select a server first!");
      return;
    }

    setConnecting(true);
    toast.loading("Establishing secure connection...");
    
    setTimeout(async () => {
      const mockIP = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      setVpnIP(mockIP);
      setConnected(true);
      setConnecting(false);
      vpnState.setConnected(true, selectedServer.id);
      toast.dismiss();
      toast.success(`Connected to ${selectedServer.name}!`);
      
      // Track dark VPN connection for achievement
      if (selectedServer.id.startsWith("dark-")) {
        await trackDarkVPNConnect();
        setTimeout(() => {
          toast.info("Dark network access enabled. Try visiting depths.urbanshade.local in the browser...", { duration: 5000 });
        }, 1000);
      }
    }, 2000);
  };

  const handleDisconnect = () => {
    setConnected(false);
    setVpnIP("");
    setDataTransferred({ up: 0, down: 0 });
    vpnState.setConnected(false, null);
    toast.success("Disconnected from VPN");
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 50) return "text-primary";
    if (latency < 100) return "text-yellow-500";
    return "text-destructive";
  };

  const getLoadColor = (load: number) => {
    if (load < 50) return "text-primary";
    if (load < 80) return "text-yellow-500";
    return "text-destructive";
  };

  return (
    <div className="flex h-full bg-background overflow-hidden">
      {/* Server List */}
      <div className="w-64 lg:w-80 xl:w-96 shrink-0 border-r border-border flex flex-col">
        <div className="p-3 border-b border-border bg-black/20 shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="font-bold">VPN Servers</h2>
          </div>
        </div>
        
        <div className="p-3 space-y-2 overflow-y-auto flex-1">
          {SERVERS.map(server => (
            <div
              key={server.id}
              onClick={() => !connected && setSelectedServer(server)}
              className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                selectedServer?.id === server.id 
                  ? 'bg-primary/20 border-primary/30' 
                  : 'border-border hover:bg-accent/50'
              } ${connected ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-bold">{server.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {server.city}, {server.country}
                  </div>
                </div>
                <MapPin className="w-4 h-4 text-muted-foreground" />
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  <span className={getLatencyColor(server.latency)}>{server.latency}ms</span>
                </div>
                <div className={getLoadColor(server.load)}>
                  Load: {server.load}%
                </div>
              </div>
            </div>
          ))}
          
          {/* Dark Servers Section */}
          <div className="mt-4 pt-4 border-t border-red-500/20">
            <div className="flex items-center gap-2 mb-3 px-1">
              <Skull className="w-4 h-4 text-red-400" />
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Dark Network</span>
            </div>
            
            {DARK_SERVERS.map(server => (
              <div
                key={server.id}
                onClick={() => !connected && setSelectedServer(server)}
                className={`p-3 rounded-lg cursor-pointer transition-colors border mb-2 ${
                  selectedServer?.id === server.id 
                    ? 'bg-red-500/20 border-red-500/40' 
                    : 'border-red-500/20 hover:bg-red-500/10 bg-red-950/20'
                } ${connected ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-bold text-red-400">{server.name}</div>
                    <div className="text-xs text-red-400/60">
                      {server.city}, {server.country}
                    </div>
                  </div>
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-red-400/70">
                    <Activity className="w-3 h-3" />
                    <span>{server.latency}ms</span>
                  </div>
                  <div className="text-red-400/70">
                    Load: {server.load}%
                  </div>
                </div>
              </div>
            ))}
            
            <p className="text-[10px] text-red-400/50 px-1 mt-2">
              ⚠️ These nodes access restricted networks. Use at your own risk.
            </p>
          </div>
        </div>
      </div>

      {/* VPN Status */}
      <div className="flex-1 p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
              connected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {connected ? (
                <Shield className="w-12 h-12" />
              ) : (
                <Lock className="w-12 h-12" />
              )}
            </div>
            
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">
                {connected ? "SECURED" : "NOT CONNECTED"}
              </h3>
              <p className="text-muted-foreground">
                {connected 
                  ? `Connected to ${selectedServer?.name}` 
                  : "Select a server to connect"}
              </p>
            </div>
          </div>

          {connected ? (
            <>
              <div className="space-y-3">
                <div className="p-4 rounded-lg glass-panel">
                  <div className="text-xs text-muted-foreground mb-1">Your IP Address</div>
                  <div className="font-mono font-bold">{realIP}</div>
                </div>
                
                <div className="p-4 rounded-lg glass-panel">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    VPN IP Address
                  </div>
                  <div className="font-mono font-bold text-primary">{vpnIP}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-lg glass-panel">
                    <div className="text-xs text-muted-foreground mb-1">Upload</div>
                    <div className="font-bold">{dataTransferred.up.toFixed(2)} MB</div>
                  </div>
                  <div className="p-4 rounded-lg glass-panel">
                    <div className="text-xs text-muted-foreground mb-1">Download</div>
                    <div className="font-bold">{dataTransferred.down.toFixed(2)} MB</div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>Connection encrypted with AES-256</span>
                </div>
              </div>

              <Button 
                onClick={handleDisconnect}
                variant="destructive"
                className="w-full"
                size="lg"
              >
                <Power className="w-5 h-5 mr-2" />
                Disconnect
              </Button>
            </>
          ) : (
            <>
              {selectedServer && (
                <div className="p-4 rounded-lg glass-panel text-center">
                  <div className="text-sm text-muted-foreground mb-1">Selected Server</div>
                  <div className="font-bold">{selectedServer.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedServer.city}, {selectedServer.country}
                  </div>
                </div>
              )}

              <Button 
                onClick={handleConnect}
                disabled={!selectedServer || connecting}
                className="w-full"
                size="lg"
              >
                <Zap className="w-5 h-5 mr-2" />
                {connecting ? "Connecting..." : "Connect"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
