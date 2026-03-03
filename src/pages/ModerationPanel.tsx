// Moderation Panel v3.3.1 - Panel Polish: avatars, online status, access log filters, DM, trial admin stats
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Shield, Users, AlertTriangle, Ban, Clock, Search, RefreshCw, XCircle, 
  CheckCircle, Skull, FileText, PartyPopper, Activity, Save, Eye, Lock,
  Radio, Zap, Terminal, AlertOctagon, UserX, UserCheck, History,
  Settings, Database, Wifi, Globe, Server, ChevronDown, ChevronRight,
  TriangleAlert, ShieldAlert, ShieldCheck, Filter, Download, Trash2,
  MessageSquare, Bell, Volume2, VolumeX, Cpu, HardDrive, Crown, Megaphone,
  UserCog, Send, Star, Sparkles, Bot, BarChart3, Hash, Flag, KeyRound,
  StickyNote, LogOut, RotateCcw, ShieldQuestion, BadgeCheck, Wrench, Flame
} from "lucide-react";
import { NaviAuthoritiesTab } from "@/components/moderation/NaviAuthoritiesTab";
import { NaviAutonomousPanel } from "@/components/moderation/NaviAutonomousPanel";
import { StatsTab } from "@/components/moderation/StatsTab";
import SupportTicketsTab from "@/components/moderation/SupportTicketsTab";
import { NaviAIChatTab } from "@/components/moderation/NaviAIChatTab";
import ReportsTab from "@/components/moderation/ReportsTab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UserData {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  role: string;
  clearance?: number;
  personnelRank?: "EXR-P" | "LR-P" | "MR-P" | "Staff" | "Security" | "Admin";
  isBanned: boolean;
  banInfo?: {
    action_type: string;
    reason: string;
    expires_at: string | null;
    is_fake: boolean;
  };
  warningsCount: number;
  warnings: Array<{ id: string; reason: string; created_at: string }>;
  created_at: string;
  lastActive?: string;
  isVip?: boolean;
}

interface StatusEntry {
  id: string;
  status: string;
  message: string | null;
}

interface ActivityLog {
  id: string;
  type: "login" | "logout" | "action" | "warning" | "ban" | "system" | "broadcast" | "op";
  user?: string;
  message: string;
  timestamp: Date;
}

interface AdminNote {
  id: string;
  target_user_id: string;
  author_id: string;
  note: string;
  created_at: string;
}

const routeLabels: Record<string, string> = {
  'main': 'Main Site',
  'docs': 'Documentation',
  'def-dev': 'DefDev Mode',
  'entire-site': 'Entire Site (Global)'
};

const personnelRankColors: Record<string, string> = {
  "EXR-P": "text-orange-500 bg-orange-500/20 border-orange-500/30",
  "LR-P": "text-yellow-500 bg-yellow-500/20 border-yellow-500/30",
  "MR-P": "text-amber-400 bg-amber-400/20 border-amber-400/30",
  "Staff": "text-cyan-400 bg-cyan-400/20 border-cyan-400/30",
  "Security": "text-blue-500 bg-blue-500/20 border-blue-500/30",
  "Admin": "text-red-500 bg-red-500/20 border-red-500/30",
};

const adminRoleBadge: Record<string, { label: string; color: string }> = {
  'creator': { label: 'CREATOR', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  'admin': { label: 'ADMIN', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  'trial_admin': { label: 'TRIAL ADMIN', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
};

// Demo data for non-admin viewers
const DEMO_USERS: UserData[] = [
  {
    id: "demo-1", user_id: "demo-user-1", username: "DemoUser", display_name: "Demo Test User",
    role: "user", clearance: 1, isBanned: false, warningsCount: 0, warnings: [],
    created_at: new Date().toISOString(), isVip: false,
  },
  {
    id: "demo-2", user_id: "demo-user-2", username: "BannedDemo", display_name: "Banned Demo User",
    role: "user", clearance: 1, isBanned: true,
    banInfo: { action_type: "ban", reason: "Demo ban - This is a test account", expires_at: null, is_fake: false },
    warningsCount: 2,
    warnings: [
      { id: "demo-warn-1", reason: "Demo warning 1", created_at: new Date().toISOString() },
      { id: "demo-warn-2", reason: "Demo warning 2", created_at: new Date().toISOString() },
    ],
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(), isVip: false,
  },
  {
    id: "demo-3", user_id: "demo-user-3", username: "WarnedDemo", display_name: "Warned Demo User",
    role: "user", clearance: 2, isBanned: false, warningsCount: 1,
    warnings: [{ id: "demo-warn-3", reason: "Demo warning", created_at: new Date().toISOString() }],
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(), isVip: false,
  },
  {
    id: "demo-4", user_id: "demo-user-4", username: "DemoAdmin", display_name: "Demo Admin User",
    role: "admin", clearance: 5, isBanned: false, warningsCount: 0, warnings: [],
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(), isVip: false,
  },
  {
    id: "demo-5", user_id: "demo-user-5", username: "DemoVIP", display_name: "Demo VIP User",
    role: "user", clearance: 3, isBanned: false, warningsCount: 0, warnings: [],
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(), isVip: true,
  },
];

// =============================================
// Status Card Component
// =============================================
const StatusCard = ({ status, onUpdate }: { status: StatusEntry; onUpdate: (id: string, status: string, message: string | null) => void }) => {
  const [editing, setEditing] = useState(false);
  const [newStatus, setNewStatus] = useState(status.status);
  const [newMessage, setNewMessage] = useState(status.message || '');

  const handleSave = () => {
    onUpdate(status.id, newStatus, newMessage || null);
    setEditing(false);
  };

  const getStatusStyle = (s: string) => {
    switch (s) {
      case 'online': return 'border-cyan-500/50 bg-gradient-to-br from-cyan-950/50 to-slate-950';
      case 'maintenance': return 'border-amber-500/50 bg-gradient-to-br from-amber-950/50 to-slate-950';
      case 'offline': return 'border-red-500/50 bg-gradient-to-br from-red-950/50 to-slate-950';
      default: return 'border-slate-700 bg-slate-900/50';
    }
  };

  const getStatusIcon = (s: string) => {
    switch (s) {
      case 'online': return <Wifi className="w-5 h-5 text-cyan-400" />;
      case 'maintenance': return <Settings className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />;
      case 'offline': return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <Globe className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className={`p-5 rounded-lg border-2 transition-all ${getStatusStyle(status.status)}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {getStatusIcon(status.status)}
          <div>
            <h4 className="font-bold text-lg font-mono">{routeLabels[status.id] || status.id}</h4>
            <span className="text-xs text-slate-500 font-mono">ZONE: {status.id.toUpperCase()}</span>
          </div>
        </div>
        <span className={`px-3 py-1 rounded font-mono text-xs font-bold uppercase tracking-wider ${
          status.status === 'online' ? 'bg-cyan-500/30 text-cyan-400 border border-cyan-500/50' :
          status.status === 'maintenance' ? 'bg-amber-500/30 text-amber-400 border border-amber-500/50' :
          'bg-red-500/30 text-red-400 border border-red-500/50'
        }`}>
          {status.status}
        </span>
      </div>

      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-mono mb-1 block text-slate-400">STATUS</label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger className="bg-slate-900/80 border-slate-700 font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-mono mb-1 block text-slate-400">BROADCAST MESSAGE</label>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Message to broadcast to users..."
              className="bg-slate-900/80 border-slate-700 font-mono"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm" className="gap-1 bg-cyan-600 hover:bg-cyan-500">
              <Save className="w-3 h-3" /> Confirm
            </Button>
            <Button onClick={() => setEditing(false)} size="sm" variant="outline" className="border-slate-600">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {status.message && (
            <p className="text-sm mb-3 text-slate-400 font-mono border-l-2 border-slate-600 pl-3">{status.message}</p>
          )}
          <Button onClick={() => setEditing(true)} size="sm" variant="outline" className="border-slate-600 hover:bg-slate-800">
            <Settings className="w-3 h-3 mr-1" /> Configure
          </Button>
        </div>
      )}
    </div>
  );
};

// =============================================
// User Details Panel (Extended)
// =============================================
const UserDetailsPanel = ({ 
  user, onClose, onWarn, onBan, onUnban, onOp, onDeop, onVip, onRevokeVip, onRemoveWarning, 
  isDemo, isCreator, adminRole, onSetClearance, onForceLogout, onResetPassword, onSetTrialAdmin, onPromoteTrial, onMakeCoCreator
}: { 
  user: UserData; 
  onClose: () => void;
  onWarn: () => void;
  onBan: () => void;
  onUnban: () => void;
  onOp: () => void;
  onDeop: () => void;
  onVip: () => void;
  onRevokeVip: () => void;
  onRemoveWarning: (warningId: string) => void;
  isDemo: boolean;
  isCreator: boolean;
  adminRole: string;
  onSetClearance: (clearance: number) => void;
  onForceLogout: () => void;
  onResetPassword: () => void;
  onSetTrialAdmin: () => void;
  onPromoteTrial: () => void;
  onMakeCoCreator: () => void;
}) => {
  const rank = user.personnelRank || (user.role === 'admin' ? 'Admin' : user.isVip ? 'VIP' : 'Staff');
  const isTrialAdmin = adminRole === 'trial_admin';
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [notesLoading, setNotesLoading] = useState(false);
  const [dmMessage, setDmMessage] = useState('');
  const [dmSending, setDmSending] = useState(false);

  // Fetch notes
  useEffect(() => {
    if (isDemo) return;
    const fetchNotes = async () => {
      setNotesLoading(true);
      try {
        const { data: session } = await supabase.auth.getSession();
        const response = await fetch(
          `https://oukxkpihsyikamzldiek.supabase.co/functions/v1/admin-actions?action=get_notes&target_user_id=${user.user_id}`,
          { headers: { 'Authorization': `Bearer ${session.session?.access_token}`, 'Content-Type': 'application/json' } }
        );
        const result = await response.json();
        setNotes(result.notes || []);
      } catch (e) { console.error('Failed to load notes:', e); }
      finally { setNotesLoading(false); }
    };
    fetchNotes();
  }, [user.user_id, isDemo]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      const response = await supabase.functions.invoke('admin-actions', {
        body: { action: 'add_note', targetUserId: user.user_id, note: newNote }
      });
      if (response.error) throw response.error;
      if (response.data?.note) setNotes(prev => [response.data.note, ...prev]);
      setNewNote('');
      toast.success('Note added');
    } catch { toast.error('Failed to add note'); }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await supabase.functions.invoke('admin-actions', { body: { action: 'delete_note', noteId } });
      setNotes(prev => prev.filter(n => n.id !== noteId));
      toast.success('Note deleted');
    } catch { toast.error('Failed to delete note'); }
  };

  const handleSendDM = async () => {
    if (!dmMessage.trim()) return;
    setDmSending(true);
    try {
      const response = await supabase.functions.invoke('admin-actions', {
        body: { action: 'navi_message', message: dmMessage, priority: 'info', target: user.user_id }
      });
      if (response.error) throw response.error;
      toast.success(`NAVI message sent to @${user.username}`);
      setDmMessage('');
    } catch { toast.error('Failed to send message'); }
    finally { setDmSending(false); }
  };
  
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-slate-950 border-l-2 border-cyan-500/30 shadow-2xl shadow-cyan-500/10 z-[99999] flex flex-col">
      {isDemo && (
        <div className="px-4 py-2 bg-amber-500/20 border-b border-amber-500/30">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono">
            <Eye className="w-3 h-3" /> DEMO MODE - Actions won't affect cloud
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono text-cyan-400">PERSONNEL FILE</span>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            <XCircle className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold ${personnelRankColors[rank]}`}>
            {user.username[0].toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-lg">{user.display_name || user.username}</h3>
            <p className="text-sm text-slate-500 font-mono">@{user.username}</p>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono mt-1 border ${personnelRankColors[rank]}`}>
              {rank}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            {user.isVip && (
              <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-xs font-mono flex items-center gap-1 border border-purple-500/30">
                <Star className="w-3 h-3" /> VIP
              </span>
            )}
            {user.isBanned && (
              <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs font-mono flex items-center gap-1 border border-red-500/30">
                <Ban className="w-3 h-3" /> BANNED
                {user.banInfo?.is_fake && <PartyPopper className="w-3 h-3" />}
              </span>
            )}
            {user.warningsCount > 0 && (
              <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 text-xs font-mono flex items-center gap-1 border border-amber-500/30">
                <AlertTriangle className="w-3 h-3" /> {user.warningsCount} WARNINGS
              </span>
            )}
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded bg-slate-900/50 border border-slate-800">
              <div className="text-xs text-slate-500 font-mono mb-1">CLEARANCE</div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-cyan-400">LEVEL {user.clearance || 1}</span>
                {!isTrialAdmin && (
                  <Select value={String(user.clearance || 1)} onValueChange={(v) => onSetClearance(parseInt(v))}>
                    <SelectTrigger className="h-6 w-14 text-xs bg-slate-800 border-slate-700 p-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {[1,2,3,4,5].map(c => <SelectItem key={c} value={String(c)}>L{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <div className="p-3 rounded bg-slate-900/50 border border-slate-800">
              <div className="text-xs text-slate-500 font-mono mb-1">USER ID</div>
              <div className="font-mono text-sm truncate">{user.user_id.slice(0, 8)}...</div>
            </div>
            <div className="p-3 rounded bg-slate-900/50 border border-slate-800 col-span-2">
              <div className="text-xs text-slate-500 font-mono mb-1">REGISTERED</div>
              <div className="font-mono text-sm">{new Date(user.created_at).toLocaleString()}</div>
            </div>
          </div>

          {/* Extended Actions */}
          {!isTrialAdmin && (
            <div className="space-y-2">
              <h4 className="text-xs font-mono text-slate-400 flex items-center gap-2">
                <Settings className="w-3 h-3" /> MANAGEMENT
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" className="border-slate-700 text-xs gap-1" onClick={onForceLogout}>
                  <LogOut className="w-3 h-3" /> Force Logout
                </Button>
                <Button size="sm" variant="outline" className="border-slate-700 text-xs gap-1" onClick={onResetPassword}>
                  <RotateCcw className="w-3 h-3" /> Reset Pass
                </Button>
              </div>
            </div>
          )}

          {/* Warnings history */}
          {user.warnings.length > 0 && (
            <div>
              <h4 className="text-xs font-mono text-slate-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-3 h-3" /> WARNING HISTORY
              </h4>
              <div className="space-y-2">
                {user.warnings.slice(0, 5).map((w, i) => (
                  <div key={w.id || i} className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-sm group relative">
                    <p className="text-amber-300">{w.reason}</p>
                    <p className="text-xs text-slate-500 mt-1">{new Date(w.created_at).toLocaleDateString()}</p>
                    <Button
                      onClick={(e) => { e.stopPropagation(); onRemoveWarning(w.id); }}
                      size="sm" variant="ghost"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ban info */}
          {user.banInfo && (
            <div className="p-3 rounded bg-red-500/10 border border-red-500/30">
              <h4 className="text-xs font-mono text-red-400 mb-2 flex items-center gap-2">
                <Ban className="w-3 h-3" /> BAN DETAILS
              </h4>
              <p className="text-sm text-red-300 mb-2">{user.banInfo.reason}</p>
              <div className="text-xs text-slate-500 space-y-1">
                <p>Type: {user.banInfo.action_type}{user.banInfo.is_fake && ' (FAKE)'}</p>
                {user.banInfo.expires_at && <p>Expires: {new Date(user.banInfo.expires_at).toLocaleString()}</p>}
              </div>
            </div>
          )}

          {/* Admin Notes */}
          {!isDemo && (
            <div>
              <h4 className="text-xs font-mono text-slate-400 mb-2 flex items-center gap-2">
                <StickyNote className="w-3 h-3" /> ADMIN NOTES
              </h4>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    className="bg-slate-900 border-slate-700 text-sm font-mono"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  />
                  <Button size="sm" onClick={handleAddNote} className="bg-cyan-600 hover:bg-cyan-500" disabled={!newNote.trim()}>
                    <Send className="w-3 h-3" />
                  </Button>
                </div>
                {notesLoading ? (
                  <p className="text-xs text-slate-500 font-mono">Loading notes...</p>
                ) : notes.length === 0 ? (
                  <p className="text-xs text-slate-500 font-mono">No notes yet</p>
                ) : (
                  notes.map(n => (
                    <div key={n.id} className="p-2 rounded bg-slate-900/50 border border-slate-800 text-sm group relative">
                      <p className="text-slate-300 font-mono text-xs">{n.note}</p>
                      <p className="text-xs text-slate-600 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                      <Button
                        onClick={() => handleDeleteNote(n.id)}
                        size="sm" variant="ghost"
                        className="absolute top-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Send DM */}
      {!isDemo && (
        <div className="p-4 border-t border-slate-800">
          <h4 className="text-xs font-mono text-slate-400 mb-2 flex items-center gap-2">
            <Bot className="w-3 h-3" /> SEND NAVI MESSAGE
          </h4>
          <div className="flex gap-2">
            <Input
              value={dmMessage}
              onChange={(e) => setDmMessage(e.target.value)}
              placeholder="Message to this user..."
              className="bg-slate-900 border-slate-700 text-sm font-mono"
              onKeyDown={(e) => e.key === 'Enter' && handleSendDM()}
            />
            <Button size="sm" onClick={handleSendDM} disabled={!dmMessage.trim() || dmSending} className="bg-cyan-600 hover:bg-cyan-500">
              <Send className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        {user.role !== 'admin' && user.role !== 'creator' ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={onWarn} className="bg-amber-600 hover:bg-amber-500 gap-1">
                <AlertTriangle className="w-4 h-4" /> Warn
              </Button>
              {user.isBanned ? (
                <Button onClick={onUnban} className="bg-green-600 hover:bg-green-500 gap-1">
                  <CheckCircle className="w-4 h-4" /> Unban
                </Button>
              ) : (
                <Button onClick={onBan} className="bg-red-600 hover:bg-red-500 gap-1">
                  <Ban className="w-4 h-4" /> Ban
                </Button>
              )}
            </div>
            
            {/* VIP (not for trial admins) */}
            {!isTrialAdmin && (
              !user.isVip ? (
                <Button onClick={onVip} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 gap-2">
                  <Star className="w-4 h-4" /> Grant VIP Status
                </Button>
              ) : (
                <Button onClick={onRevokeVip} className="w-full bg-slate-600 hover:bg-slate-500 gap-2">
                  <Star className="w-4 h-4" /> Revoke VIP Status
                </Button>
              )
            )}
            
            {/* OP (not for trial admins) */}
            {!isTrialAdmin && (
              <Button onClick={onOp} className="w-full bg-purple-600 hover:bg-purple-500 gap-2">
                <Crown className="w-4 h-4" /> Grant Admin (OP)
              </Button>
            )}

            {/* Trial Admin grant (full admins/creators only) */}
            {!isTrialAdmin && user.role !== 'trial_admin' && (
              <Button onClick={onSetTrialAdmin} variant="outline" className="w-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10 gap-2">
                <ShieldQuestion className="w-4 h-4" /> Grant Trial Admin
              </Button>
            )}

            {/* Promote trial admin (full admins/creators only) */}
            {!isTrialAdmin && user.role === 'trial_admin' && (
              <Button onClick={onPromoteTrial} className="w-full bg-orange-600 hover:bg-orange-500 gap-2">
                <BadgeCheck className="w-4 h-4" /> Promote to Full Admin
              </Button>
            )}

            {/* Revoke trial admin (full admins/creators only) */}
            {!isTrialAdmin && user.role === 'trial_admin' && (
              <Button onClick={onDeop} variant="outline" className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 gap-2">
                <UserCog className="w-4 h-4" /> Revoke Trial Admin
              </Button>
            )}
          </>
        ) : (
          (isDemo || isCreator || adminRole === 'co_creator') && (
            <div className="space-y-2">
              <Button onClick={onDeop} className="w-full bg-orange-600 hover:bg-orange-500 gap-2">
                <UserCog className="w-4 h-4" /> Demote Admin (De-OP)
              </Button>
              {isCreator && user.role === 'admin' && (
                <Button onClick={onMakeCoCreator} className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 gap-2">
                  <Crown className="w-4 h-4" /> Promote to Co-Creator
                </Button>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
};

// =============================================
// Activity Feed
// =============================================
const ActivityFeed = ({ activities }: { activities: ActivityLog[] }) => {
  const getActivityIcon = (type: ActivityLog["type"]) => {
    switch (type) {
      case "login": return <UserCheck className="w-3 h-3 text-green-400" />;
      case "logout": return <UserX className="w-3 h-3 text-slate-400" />;
      case "warning": return <AlertTriangle className="w-3 h-3 text-amber-400" />;
      case "ban": return <Ban className="w-3 h-3 text-red-400" />;
      case "system": return <Terminal className="w-3 h-3 text-cyan-400" />;
      case "broadcast": return <Megaphone className="w-3 h-3 text-purple-400" />;
      case "op": return <Crown className="w-3 h-3 text-yellow-400" />;
      default: return <Activity className="w-3 h-3 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-1 font-mono text-xs">
      {activities.map(act => (
        <div key={act.id} className="flex items-center gap-2 p-2 rounded bg-slate-900/50 border border-slate-800/50">
          {getActivityIcon(act.type)}
          <span className="flex-1 truncate">{act.message}</span>
          <span className="text-slate-600">{act.timestamp.toLocaleTimeString()}</span>
        </div>
      ))}
    </div>
  );
};

// Sidebar Navigation Item
const SidebarNavItem = ({ icon: Icon, label, count, active, onClick, color = 'cyan' }: { 
  icon: any; label: string; count?: number; active: boolean; onClick: () => void;
  color?: 'cyan' | 'purple' | 'blue' | 'amber' | 'red';
}) => {
  const colorClasses = {
    cyan: active ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'hover:bg-cyan-500/10 hover:text-cyan-400',
    purple: active ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' : 'hover:bg-purple-500/10 hover:text-purple-400',
    blue: active ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'hover:bg-blue-500/10 hover:text-blue-400',
    amber: active ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : 'hover:bg-amber-500/10 hover:text-amber-400',
    red: active ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'hover:bg-red-500/10 hover:text-red-400',
  };
  
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border border-transparent ${
        active ? colorClasses[color] : `text-slate-400 ${colorClasses[color]}`
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && (
        <span className={`text-xs font-mono ${active ? '' : 'text-slate-500'}`}>{count}</span>
      )}
    </button>
  );
};

// =============================================
// PIN Prompt Screen
// =============================================
const PinPromptScreen = ({ onVerified, hasPin }: { onVerified: () => void; hasPin: boolean }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSetup, setIsSetup] = useState(!hasPin);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(3);

  const handleVerify = async () => {
    if (pin.length < 4) return;
    setLoading(true);
    setError('');
    try {
      const response = await supabase.functions.invoke('admin-actions', {
        body: { action: 'verify_pin', pin }
      });
      if (response.data?.verified) {
        onVerified();
      } else {
        setAttemptsLeft(response.data?.attemptsLeft ?? 0);
        if (response.data?.locked) {
          setError('Account locked for 15 minutes due to too many failed attempts.');
        } else {
          setError(`Invalid PIN. ${response.data?.attemptsLeft ?? 0} attempts remaining.`);
        }
        setPin('');
      }
    } catch (e) {
      setError('Failed to verify PIN');
    } finally { setLoading(false); }
  };

  const handleSetup = async () => {
    if (pin.length < 4 || pin !== confirmPin) {
      setError('PINs must match and be 4-6 digits');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await supabase.functions.invoke('admin-actions', {
        body: { action: 'set_pin', pin }
      });
      if (response.error) throw response.error;
      toast.success('PIN set successfully');
      onVerified();
    } catch (e) {
      setError('Failed to set PIN');
    } finally { setLoading(false); }
  };

  const handleSkip = () => {
    onVerified();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="max-w-sm w-full p-8 rounded-xl bg-slate-900/50 border-2 border-cyan-500/30 shadow-2xl shadow-cyan-500/10">
        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            <KeyRound className="w-12 h-12 text-cyan-400" />
            <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full" />
          </div>
          <h2 className="text-xl font-bold font-mono text-cyan-400">
            {isSetup ? 'SET UP PIN' : 'ENTER PIN'}
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-1">
            {isSetup ? 'Create a 4-6 digit PIN for panel access' : 'Enter your moderation PIN to continue'}
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={pin} onChange={setPin}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {isSetup && (
            <>
              <p className="text-xs text-slate-500 font-mono text-center">Confirm PIN:</p>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={confirmPin} onChange={setConfirmPin}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </>
          )}

          {error && (
            <p className="text-xs text-red-400 font-mono text-center">{error}</p>
          )}

          <Button 
            onClick={isSetup ? handleSetup : handleVerify}
            disabled={loading || pin.length < 4}
            className="w-full bg-cyan-600 hover:bg-cyan-500 font-mono"
          >
            {loading ? 'Processing...' : isSetup ? 'Set PIN' : 'Verify'}
          </Button>

          {isSetup && (
            <Button onClick={handleSkip} variant="ghost" className="w-full text-slate-500 text-xs font-mono">
              Skip for now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================
// Security Tab Component
// =============================================
const SecurityTab = ({ isCreator, users }: { isCreator: boolean; users: UserData[] }) => {
  const [hasPin, setHasPin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [settingPin, setSettingPin] = useState(false);
  const [roster, setRoster] = useState<any[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);

  useEffect(() => {
    const checkPin = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        const response = await fetch(
          `https://oukxkpihsyikamzldiek.supabase.co/functions/v1/admin-actions?action=check_pin_status`,
          { headers: { 'Authorization': `Bearer ${session.session?.access_token}`, 'Content-Type': 'application/json' } }
        );
        const result = await response.json();
        setHasPin(result.hasPin);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    checkPin();
    fetchRoster();
  }, []);

  const fetchRoster = async () => {
    setRosterLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(
        `https://oukxkpihsyikamzldiek.supabase.co/functions/v1/admin-actions?action=admin_roster`,
        { headers: { 'Authorization': `Bearer ${session.session?.access_token}`, 'Content-Type': 'application/json' } }
      );
      const result = await response.json();
      setRoster(result.roster || []);
    } catch (e) { console.error(e); }
    finally { setRosterLoading(false); }
  };

  const handleSetPin = async () => {
    if (newPin.length < 4 || newPin !== confirmNewPin) {
      toast.error('PINs must match and be 4-6 digits');
      return;
    }
    setSettingPin(true);
    try {
      const response = await supabase.functions.invoke('admin-actions', {
        body: { action: 'set_pin', pin: newPin }
      });
      if (response.error) throw response.error;
      toast.success('PIN updated');
      setHasPin(true);
      setNewPin('');
      setConfirmNewPin('');
    } catch { toast.error('Failed to set PIN'); }
    finally { setSettingPin(false); }
  };

  const handleRemovePin = async () => {
    try {
      const response = await supabase.functions.invoke('admin-actions', {
        body: { action: 'remove_pin' }
      });
      if (response.error) throw response.error;
      toast.success('PIN removed');
      setHasPin(false);
    } catch { toast.error('Failed to remove PIN'); }
  };

  const handleForceResetPin = async (targetUserId: string, username: string) => {
    if (!confirm(`Force reset PIN for @${username}? They will need to set up a new PIN.`)) return;
    try {
      const response = await supabase.functions.invoke('admin-actions', {
        body: { action: 'force_reset_pin', targetUserId }
      });
      if (response.error) throw response.error;
      toast.success(`PIN reset for @${username}`);
      fetchRoster();
    } catch { toast.error('Failed to reset PIN'); }
  };

  if (loading) return <p className="text-slate-500 font-mono text-sm">Loading security settings...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold font-mono text-cyan-400 flex items-center gap-2">
        <KeyRound className="w-5 h-5" /> Security Settings
      </h2>
      
      {/* PIN Management */}
      <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-mono font-bold text-sm">Moderation PIN</h3>
            <p className="text-xs text-slate-500 font-mono">Required to access the moderation panel</p>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-mono border ${hasPin ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
            {hasPin ? 'ENABLED' : 'DISABLED'}
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">{hasPin ? 'Change PIN' : 'Set new PIN'} (4-6 digits)</label>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={newPin} onChange={setNewPin}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>
          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">Confirm PIN</label>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={confirmNewPin} onChange={setConfirmNewPin}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSetPin} disabled={settingPin || newPin.length < 4} className="bg-cyan-600 hover:bg-cyan-500 gap-1 flex-1">
              <Save className="w-3 h-3" /> {hasPin ? 'Update PIN' : 'Set PIN'}
            </Button>
            {hasPin && (
              <Button onClick={handleRemovePin} variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Admin Roster */}
      <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-mono font-bold text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" /> Admin Roster
          </h3>
          <Button size="sm" variant="ghost" onClick={fetchRoster} className="text-slate-400">
            <RefreshCw className={`w-3 h-3 ${rosterLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {rosterLoading ? (
          <p className="text-xs text-slate-500 font-mono">Loading roster...</p>
        ) : roster.length === 0 ? (
          <p className="text-xs text-slate-500 font-mono">No admins found</p>
        ) : (
          <div className="space-y-2">
            {roster.map((admin: any) => (
              <div key={admin.user_id} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold ${
                    admin.role === 'creator' ? 'bg-yellow-500/20 text-yellow-400' :
                    admin.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                    'bg-orange-500/20 text-orange-400'
                  }`}>
                    {(admin.username || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{admin.display_name || admin.username}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        adminRoleBadge[admin.role]?.color || 'bg-slate-800 text-slate-400'
                      }`}>
                        {adminRoleBadge[admin.role]?.label || admin.role?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-slate-500 font-mono">@{admin.username}</span>
                      <span className={`text-[10px] font-mono ${admin.has_pin ? 'text-green-400' : 'text-slate-600'}`}>
                        PIN: {admin.has_pin ? '✓' : '✗'}
                      </span>
                      <span className={`text-[10px] font-mono ${admin.is_online ? 'text-green-400' : 'text-slate-600'}`}>
                        {admin.is_online ? '● Online' : '○ Offline'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {isCreator && admin.role !== 'creator' && (
                  <div className="flex gap-1">
                    {admin.has_pin && (
                      <Button size="sm" variant="ghost" onClick={() => handleForceResetPin(admin.user_id, admin.username)} 
                        className="text-red-400 hover:bg-red-500/10 text-xs h-7 px-2">
                        Reset PIN
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Info */}
      <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800">
        <h3 className="font-mono font-bold text-sm mb-2">Security Info</h3>
        <ul className="text-xs text-slate-500 font-mono space-y-1">
          <li>• PIN is hashed server-side (SHA-256)</li>
          <li>• 3 failed attempts = 15 minute lockout</li>
          <li>• PIN is required on every panel access</li>
          <li>• Only you can set/change/remove your PIN</li>
          <li>• Access attempts are logged to the audit trail</li>
        </ul>
      </div>
    </div>
  );
};

// =============================================
// Access Log Tab Component
// =============================================
const AccessLogTab = () => {
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(
        `https://oukxkpihsyikamzldiek.supabase.co/functions/v1/admin-actions?action=access_logs&limit=200`,
        { headers: { 'Authorization': `Bearer ${session.session?.access_token}`, 'Content-Type': 'application/json' } }
      );
      const result = await response.json();
      setAccessLogs(result.accessLogs || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const getActionStyle = (action: string) => {
    switch (action) {
      case 'pin_verify_success': return { label: 'PIN OK', color: 'bg-green-500/20 text-green-400 border-green-500/30' };
      case 'pin_verify_fail': return { label: 'PIN FAIL', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
      case 'pin_set': return { label: 'PIN SET', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
      case 'pin_removed': return { label: 'PIN DEL', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      case 'force_pin_reset': return { label: 'FORCE RST', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
      case 'delete_all_pins': return { label: 'ALL PINS DEL', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
      default: return { label: action.toUpperCase(), color: 'bg-slate-800 text-slate-400 border-slate-700' };
    }
  };

  const filteredLogs = accessLogs.filter(log => {
    const matchesSearch = !searchQuery || 
      (log.username?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.action?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const logDate = new Date(log.created_at);
      const diffHours = (Date.now() - logDate.getTime()) / (1000 * 60 * 60);
      if (dateFilter === '1h') matchesDate = diffHours <= 1;
      else if (dateFilter === '24h') matchesDate = diffHours <= 24;
      else if (dateFilter === '7d') matchesDate = diffHours <= 168;
    }
    return matchesSearch && matchesAction && matchesDate;
  });

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `access-logs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold font-mono text-cyan-400 flex items-center gap-2">
          <Activity className="w-5 h-5" /> Access Log
        </h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleExport} className="border-slate-700 gap-1">
            <Download className="w-3 h-3" /> Export
          </Button>
          <Button size="sm" variant="outline" onClick={fetchLogs} className="border-slate-700 gap-1">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by user or action..."
            className="pl-10 bg-slate-900/50 border-slate-700 font-mono text-sm"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-44 bg-slate-900/50 border-slate-700 text-sm">
            <SelectValue placeholder="Action type" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="pin_verify_success">PIN OK</SelectItem>
            <SelectItem value="pin_verify_fail">PIN FAIL</SelectItem>
            <SelectItem value="pin_set">PIN SET</SelectItem>
            <SelectItem value="pin_removed">PIN DEL</SelectItem>
            <SelectItem value="force_pin_reset">FORCE RST</SelectItem>
            <SelectItem value="delete_all_pins">ALL PINS DEL</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-36 bg-slate-900/50 border-slate-700 text-sm">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="1h">Last Hour</SelectItem>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
          </SelectContent>
        </Select>
        <span className="self-center text-xs font-mono text-slate-500">
          {filteredLogs.length} entries
        </span>
      </div>

      {loading ? (
        <p className="text-slate-500 font-mono text-sm animate-pulse">Loading access logs...</p>
      ) : filteredLogs.length === 0 ? (
        <p className="text-slate-500 font-mono text-sm text-center py-8">No access logs found</p>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((log: any) => {
            const style = getActionStyle(log.action);
            return (
              <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800 font-mono text-sm">
                <span className="text-xs text-slate-500 min-w-[140px]">
                  {new Date(log.created_at).toLocaleString()}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${style.color}`}>
                  {style.label}
                </span>
                <span className="text-slate-300 text-xs">@{log.username}</span>
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <span className="text-[10px] text-slate-600 truncate">
                    {JSON.stringify(log.metadata)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// =============================================
// Creator Tools Tab Component
// =============================================
const CreatorToolsTab = ({ onRefreshUsers }: { onRefreshUsers: () => void }) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const executeCreatorAction = async (action: string, confirmMsg: string) => {
    if (!confirm(confirmMsg)) return;
    setActionLoading(action);
    try {
      const response = await supabase.functions.invoke('admin-actions', {
        body: { action }
      });
      if (response.error) throw response.error;
      toast.success(`${action.replace(/_/g, ' ')} completed`);
      onRefreshUsers();
    } catch (e: any) {
      toast.error(e?.message || `Failed: ${action}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold font-mono text-yellow-400 flex items-center gap-2">
        <Crown className="w-5 h-5" /> Creator Tools
      </h2>

      {/* System Overrides */}
      <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 space-y-4">
        <h3 className="font-mono font-bold text-sm flex items-center gap-2">
          <Wrench className="w-4 h-4 text-cyan-400" /> System Overrides
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            onClick={() => executeCreatorAction('clear_all_bans', '⚠️ Clear ALL active bans? This cannot be undone.')}
            disabled={actionLoading === 'clear_all_bans'}
            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-2 justify-start"
          >
            <Ban className="w-4 h-4" /> Clear All Bans
          </Button>
          <Button 
            variant="outline"
            onClick={() => executeCreatorAction('clear_all_warnings', '⚠️ Clear ALL active warnings? This cannot be undone.')}
            disabled={actionLoading === 'clear_all_warnings'}
            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-2 justify-start"
          >
            <AlertTriangle className="w-4 h-4" /> Clear All Warnings
          </Button>
          <Button 
            variant="outline"
            onClick={() => executeCreatorAction('reset_navi_defaults', '⚠️ Reset ALL NAVI settings to defaults?')}
            disabled={actionLoading === 'reset_navi_defaults'}
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 gap-2 justify-start"
          >
            <Bot className="w-4 h-4" /> Reset NAVI Defaults
          </Button>
          <Button 
            variant="outline"
            onClick={() => executeCreatorAction('revoke_all_trial_admins', '⚠️ Revoke ALL trial admin roles?')}
            disabled={actionLoading === 'revoke_all_trial_admins'}
            className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 gap-2 justify-start"
          >
            <UserCog className="w-4 h-4" /> Revoke All Trial Admins
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="p-4 rounded-lg bg-red-950/20 border-2 border-red-500/30 space-y-4">
        <h3 className="font-mono font-bold text-sm flex items-center gap-2 text-red-400">
          <Flame className="w-4 h-4" /> Danger Zone
        </h3>
        <p className="text-xs text-slate-500 font-mono">
          These actions are irreversible and affect all admins. Use with extreme caution.
        </p>
        <div className="space-y-2">
          <Button 
            variant="outline"
            onClick={() => executeCreatorAction('delete_all_pins', '🚨 DELETE ALL ADMIN PINs? Every admin will need to re-setup their PIN.')}
            disabled={actionLoading === 'delete_all_pins'}
            className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 gap-2 justify-start"
          >
            <KeyRound className="w-4 h-4" /> Delete All Admin PINs
          </Button>
        </div>
      </div>
    </div>
  );
};

// =============================================
// MAIN COMPONENT
// =============================================
const ModerationPanel = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [isCoCreator, setIsCoCreator] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [adminRole, setAdminRole] = useState<string>('admin');
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("users");
  const [logs, setLogs] = useState<any[]>([]);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // PIN state
  const [pinVerified, setPinVerified] = useState(false);
  const [pinCheckDone, setPinCheckDone] = useState(false);
  const [hasPinSet, setHasPinSet] = useState(false);
  
  // Bulk selection state
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [showBulkWarnDialog, setShowBulkWarnDialog] = useState(false);
  const [showBulkBanDialog, setShowBulkBanDialog] = useState(false);
  const [bulkWarnReason, setBulkWarnReason] = useState("");
  const [bulkBanReason, setBulkBanReason] = useState("");
  const [bulkBanDuration, setBulkBanDuration] = useState<"1h" | "24h" | "7d" | "30d" | "perm">("24h");
  
  // Logs filtering state
  const [logActionFilter, setLogActionFilter] = useState<string>("all");
  const [logDateFilter, setLogDateFilter] = useState<string>("all");
  const [logSearch, setLogSearch] = useState("");
  
  // Status management
  const [statuses, setStatuses] = useState<StatusEntry[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  
  // Activity feed
  const [activities, setActivities] = useState<ActivityLog[]>([
    { id: "1", type: "system", message: "NAVI: Moderation panel accessed", timestamp: new Date() },
    { id: "2", type: "system", message: "NAVI: Security scan completed - no threats", timestamp: new Date(Date.now() - 60000) },
  ]);
  
  // Lockdown controls
  const [lockdownActive, setLockdownActive] = useState(false);
  const [lockdownZone, setLockdownZone] = useState<string>("all");
  
  // Action dialogs
  const [showWarnDialog, setShowWarnDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showLockdownDialog, setShowLockdownDialog] = useState(false);
  const [showOpDialog, setShowOpDialog] = useState(false);
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);
  const [showVipDialog, setShowVipDialog] = useState(false);
  const [showNaviMessageDialog, setShowNaviMessageDialog] = useState(false);
  const [showRemoveWarningDialog, setShowRemoveWarningDialog] = useState(false);
  const [selectedWarningId, setSelectedWarningId] = useState<string | null>(null);
  const [removeWarningReason, setRemoveWarningReason] = useState("");
  const [warnReason, setWarnReason] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState<"1h" | "24h" | "7d" | "30d" | "perm">("24h");
  const [isFakeBan, setIsFakeBan] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [naviMessage, setNaviMessage] = useState("");
  const [naviTarget, setNaviTarget] = useState<"all" | "online" | "admins" | "vips">("all");
  const [naviPriority, setNaviPriority] = useState<"info" | "warning" | "critical">("info");
  
  // Test Emergency state
  const [activeTestEmergency, setActiveTestEmergency] = useState<any>(null);
  const [testEmergencyCooldown, setTestEmergencyCooldown] = useState<Date | null>(null);
  const [testEmergencyLoading, setTestEmergencyLoading] = useState(false);

  const isTrialAdmin = adminRole === 'trial_admin';

  // Check admin status and fetch data
  useEffect(() => {
    const checkAdminAndFetch = async () => {
      setIsLoading(true);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsDemoMode(true);
          setUsers(DEMO_USERS);
          setPinCheckDone(true);
          setPinVerified(true);
          setIsLoading(false);
          return;
        }

        const response = await supabase.functions.invoke('admin-actions', { method: 'GET' });

        if (response.error) {
          if (response.error.message?.includes('403') || response.error.message?.includes('Access denied')) {
            setIsDemoMode(true);
            setUsers(DEMO_USERS);
            setPinCheckDone(true);
            setPinVerified(true);
            toast.info("Demo mode - actions won't affect cloud");
            setIsLoading(false);
            return;
          }
          throw response.error;
        }

        setIsAdmin(true);
        setIsCreator(response.data.isCreator || false);
        setIsCoCreator(response.data.isCoCreator || false);
        setAdminRole(response.data.adminRole || 'admin');
        setUsers(response.data.users || []);
        
        // Check PIN status
        const pinResponse = await fetch(
          `https://oukxkpihsyikamzldiek.supabase.co/functions/v1/admin-actions?action=check_pin_status`,
          { headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' } }
        );
        const pinResult = await pinResponse.json();
        setHasPinSet(pinResult.hasPin);
        
        if (pinResult.hasPin) {
          if (pinResult.isLocked) {
            toast.error('PIN locked for 15 minutes due to failed attempts');
          }
          setPinVerified(false);
        } else {
          // No PIN set - show setup prompt
          setPinVerified(false);
        }
        setPinCheckDone(true);
        
        setActivities(prev => [{
          id: Date.now().toString(), type: "system",
          message: `Admin authenticated (${response.data.adminRole}) - ${response.data.users?.length || 0} users loaded`,
          timestamp: new Date()
        }, ...prev]);
        
      } catch (error: any) {
        console.error("Admin check error:", error);
        setIsDemoMode(true);
        setUsers(DEMO_USERS);
        setPinCheckDone(true);
        setPinVerified(true);
        toast.info("Demo mode enabled");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAndFetch();
  }, [navigate]);

  // Fetch site lock status on load
  useEffect(() => {
    const fetchLockStatus = async () => {
      if (isDemoMode) return;
      try {
        const { data } = await supabase
          .from('site_locks')
          .select('is_locked, lock_reason')
          .eq('id', 'global')
          .maybeSingle();
        
        if (data?.is_locked) {
          setLockdownActive(true);
        }
      } catch (e) {
        console.warn("Could not fetch site lock status:", e);
      }
    };
    fetchLockStatus();
  }, [isDemoMode]);

  // Fetch test emergency status
  const fetchTestEmergencyStatus = async () => {
    if (isDemoMode) return;
    try {
      const response = await supabase.functions.invoke('admin-actions', {
        body: { action: 'get_active_test_emergency' }
      });
      if (response.data?.emergency) setActiveTestEmergency(response.data.emergency);
      else setActiveTestEmergency(null);
      
      const cooldownResponse = await supabase.functions.invoke('admin-actions', {
        body: { action: 'get_test_emergency_cooldown' }
      });
      if (cooldownResponse.data?.onCooldown) setTestEmergencyCooldown(new Date(cooldownResponse.data.nextAvailable));
      else setTestEmergencyCooldown(null);
    } catch (error) { console.error("Test emergency status error:", error); }
  };

  useEffect(() => {
    if (!isDemoMode && isAdmin && pinVerified) fetchTestEmergencyStatus();
  }, [isDemoMode, isAdmin, pinVerified]);

  const fetchUsers = async () => {
    try {
      const response = await supabase.functions.invoke('admin-actions', { method: 'GET' });
      if (response.data?.users) {
        setUsers(response.data.users);
        setActivities(prev => [{ id: Date.now().toString(), type: "system", message: "User data refreshed", timestamp: new Date() }, ...prev]);
      }
    } catch (error) { console.error("Fetch error:", error); }
  };

  const fetchLogs = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(
        `https://oukxkpihsyikamzldiek.supabase.co/functions/v1/admin-actions?action=logs`,
        { headers: { 'Authorization': `Bearer ${session.session?.access_token}`, 'Content-Type': 'application/json' } }
      );
      const result = await response.json();
      if (result?.logs) setLogs(result.logs);
    } catch (error) { console.error("Fetch logs error:", error); }
  };

  const fetchStatuses = async () => {
    setStatusLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('site_status')
        .select('id, status, message')
        .order('id');
      
      if (error) throw error;
      setStatuses(data || []);
    } catch (error) {
      console.error("Fetch status error:", error);
      toast.error("Failed to fetch site status");
    } finally {
      setStatusLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string, message: string | null) => {
    try {
      const { error } = await (supabase as any)
        .from('site_status')
        .update({ status, message, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      toast.success(`Zone ${id} status updated`);
      setActivities(prev => [{
        id: Date.now().toString(),
        type: "system",
        message: `Zone ${id} set to ${status.toUpperCase()}`,
        timestamp: new Date()
      }, ...prev]);
      fetchStatuses();
    } catch (error) {
      console.error("Update status error:", error);
      toast.error("Failed to update status");
    }
  };

  // =============================================
  // ACTION HANDLERS
  // =============================================

  const handleWarn = async () => {
    if (!selectedUser || !warnReason) return;
    
    try {
      const response = await supabase.functions.invoke('admin-actions', {
        method: 'POST',
        body: { action: 'warn', targetUserId: selectedUser.user_id, reason: warnReason }
      });

      if (response.error) throw response.error;
      
      toast.success(`Warning issued to ${selectedUser.username}`);
      setActivities(prev => [{
        id: Date.now().toString(),
        type: "warning",
        user: selectedUser.username,
        message: `Warning issued to @${selectedUser.username}: ${warnReason}`,
        timestamp: new Date()
      }, ...prev]);
      setShowWarnDialog(false);
      setWarnReason("");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to issue warning");
    }
  };

  const handleBan = async () => {
    if (!selectedUser || !banReason) return;
    
    try {
      const response = await supabase.functions.invoke('admin-actions', {
        method: 'POST',
        body: { 
          action: 'ban',
          targetUserId: selectedUser.user_id, 
          reason: banReason,
          duration: banDuration !== 'perm' ? banDuration : null,
          isPermanent: banDuration === 'perm',
          isFake: isFakeBan
        }
      });

      if (response.error) throw response.error;
      
      toast.success(`${isFakeBan ? 'Fake ban' : 'Ban'} issued to ${selectedUser.username}`);
      setActivities(prev => [{
        id: Date.now().toString(),
        type: "ban",
        user: selectedUser.username,
        message: `${isFakeBan ? 'FAKE BAN' : 'BAN'}: @${selectedUser.username} - ${banReason}`,
        timestamp: new Date()
      }, ...prev]);
      setShowBanDialog(false);
      setBanReason("");
      setIsFakeBan(false);
      setShowUserDetails(false);
      fetchUsers();
    } catch (error) {
      toast.error("Failed to ban user");
    }
  };

  const handleUnban = async (userId: string) => {
    try {
      const response = await supabase.functions.invoke('admin-actions', {
        method: 'POST',
        body: { action: 'unban', targetUserId: userId }
      });

      if (response.error) throw response.error;
      
      const user = users.find(u => u.user_id === userId);
      toast.success("User unbanned");
      setActivities(prev => [{
        id: Date.now().toString(),
        type: "system",
        message: `Unban: @${user?.username || 'Unknown'}`,
        timestamp: new Date()
      }, ...prev]);
      fetchUsers();
    } catch (error) {
      toast.error("Failed to unban user");
    }
  };

  const handleLockdown = async () => {
    setShowLockdownDialog(false);
    
    if (isDemoMode) {
      setLockdownActive(true);
      toast.success(`[DEMO] Lockdown initiated for zone: ${lockdownZone}`);
      setActivities(prev => [{
        id: Date.now().toString(), type: "system",
        message: `🚨 LOCKDOWN INITIATED - Zone: ${lockdownZone.toUpperCase()}`,
        timestamp: new Date()
      }, ...prev]);
      return;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const { error } = await supabase
        .from('site_locks')
        .upsert({
          id: 'global',
          is_locked: true,
          lock_reason: `Zone: ${lockdownZone}`,
          locked_at: new Date().toISOString(),
          locked_by: session.session.user.id
        }, { onConflict: 'id' });

      if (error) throw error;

      setLockdownActive(true);
      toast.success(`Lockdown initiated for zone: ${lockdownZone}`);
      setActivities(prev => [{
        id: Date.now().toString(), type: "system",
        message: `🚨 LOCKDOWN INITIATED - Zone: ${lockdownZone.toUpperCase()}`,
        timestamp: new Date()
      }, ...prev]);
    } catch (error) {
      console.error("Failed to lock site:", error);
      toast.error("Failed to initiate lockdown");
    }
  };

  const handleLiftLockdown = async () => {
    if (isDemoMode) {
      setLockdownActive(false);
      toast.success("[DEMO] Lockdown lifted");
      setActivities(prev => [{
        id: Date.now().toString(), type: "system",
        message: "Lockdown lifted - normal operations resumed",
        timestamp: new Date()
      }, ...prev]);
      return;
    }

    try {
      const { error } = await supabase
        .from('site_locks')
        .upsert({
          id: 'global',
          is_locked: false,
          lock_reason: null,
          locked_at: null,
          locked_by: null
        }, { onConflict: 'id' });

      if (error) throw error;

      setLockdownActive(false);
      toast.success("Lockdown lifted");
      setActivities(prev => [{
        id: Date.now().toString(), type: "system",
        message: "Lockdown lifted - normal operations resumed",
        timestamp: new Date()
      }, ...prev]);
    } catch (error) {
      console.error("Failed to lift lockdown:", error);
      toast.error("Failed to lift lockdown");
    }
  };

  // Handle OP (grant admin)
  const handleOp = async () => {
    if (!selectedUser) return;
    
    if (isDemoMode) {
      // Demo mode - just show local effect
      const updatedUsers = users.map(u => 
        u.id === selectedUser.id ? { ...u, role: 'admin' } : u
      );
      setUsers(updatedUsers);
      toast.success(`[DEMO] OP granted to ${selectedUser.username}`);
      setActivities(prev => [{
        id: Date.now().toString(),
        type: "op",
        user: selectedUser.username,
        message: `[DEMO] OP granted to @${selectedUser.username}`,
        timestamp: new Date()
      }, ...prev]);
      setShowOpDialog(false);
      setShowUserDetails(false);
      return;
    }
    
    try {
      const response = await supabase.functions.invoke('admin-actions', {
        method: 'POST',
        body: { action: 'op', targetUserId: selectedUser.user_id }
      });

      if (response.error) throw response.error;
      
      toast.success(`Admin granted to ${selectedUser.username}`);
      setActivities(prev => [{
        id: Date.now().toString(),
        type: "op",
        user: selectedUser.username,
        message: `👑 OP granted to @${selectedUser.username}`,
        timestamp: new Date()
      }, ...prev]);
      setShowOpDialog(false);
      setShowUserDetails(false);
      fetchUsers();
    } catch (error) {
      toast.error("Failed to grant admin");
    }
  };

  // Handle global broadcast
  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }
    
    if (isDemoMode) {
      toast.success(`[DEMO] Broadcast sent: "${broadcastMessage}"`);
      setActivities(prev => [{
        id: Date.now().toString(),
        type: "broadcast",
        message: `[DEMO] 📢 BROADCAST: ${broadcastMessage}`,
        timestamp: new Date()
      }, ...prev]);
      setShowBroadcastDialog(false);
      setBroadcastMessage("");
      return;
    }
    
    try {
      const response = await supabase.functions.invoke('admin-actions', {
        method: 'POST',
        body: { action: 'broadcast', message: broadcastMessage }
      });

      if (response.error) throw response.error;
      
      // Show as custom notification instead of toast
      toast("Admin message", {
        description: broadcastMessage,
        duration: 10000,
      });
      
      setActivities(prev => [{
        id: Date.now().toString(),
        type: "broadcast",
        message: `📢 GLOBAL BROADCAST: ${broadcastMessage}`,
        timestamp: new Date()
      }, ...prev]);
      setShowBroadcastDialog(false);
      setBroadcastMessage("");
    } catch (error) {
      toast.error("Failed to send broadcast");
    }
  };

  // Handle NAVI direct message announcement
  const handleNaviMessage = async () => {
    if (!naviMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }
    
    if (isDemoMode) {
      toast.success(`[DEMO] NAVI message sent to ${naviTarget}: "${naviMessage}"`);
      setActivities(prev => [{
        id: Date.now().toString(),
        type: "broadcast",
        message: `[DEMO] 🤖 NAVI [${naviPriority.toUpperCase()}] to ${naviTarget}: ${naviMessage}`,
        timestamp: new Date()
      }, ...prev]);
      setShowNaviMessageDialog(false);
      setNaviMessage("");
      return;
    }
    
    try {
      const response = await supabase.functions.invoke('admin-actions', {
        method: 'POST',
        body: { 
          action: 'navi_message',
          message: naviMessage,
          priority: naviPriority,
          target: naviTarget
        }
      });

      if (response.error) throw response.error;
      
      toast.success("NAVI message sent!");
      setActivities(prev => [{
        id: Date.now().toString(),
        type: "broadcast",
        message: `🤖 NAVI [${naviPriority.toUpperCase()}] to ${naviTarget}: ${naviMessage}`,
        timestamp: new Date()
      }, ...prev]);
      setShowNaviMessageDialog(false);
      setNaviMessage("");
    } catch (error) {
      console.error("NAVI message error:", error);
      toast.error("Failed to send NAVI message");
    }
  };

  // Demo mode action wrappers
  const handleDemoWarn = () => {
    if (!selectedUser || !warnReason) return;
    
    const updatedUsers = users.map(u => 
      u.id === selectedUser.id 
        ? { ...u, warningsCount: u.warningsCount + 1, warnings: [...u.warnings, { id: `demo-${Date.now()}`, reason: warnReason, created_at: new Date().toISOString() }] } 
        : u
    );
    setUsers(updatedUsers);
    toast.success(`[DEMO] Warning issued to ${selectedUser.username}`);
    setActivities(prev => [{
      id: Date.now().toString(),
      type: "warning",
      user: selectedUser.username,
      message: `[DEMO] Warning: @${selectedUser.username} - ${warnReason}`,
      timestamp: new Date()
    }, ...prev]);
    setShowWarnDialog(false);
    setWarnReason("");
  };

  const handleDemoBan = () => {
    if (!selectedUser || !banReason) return;
    
    const updatedUsers = users.map(u => 
      u.id === selectedUser.id 
        ? { ...u, isBanned: true, banInfo: { action_type: 'ban', reason: banReason, expires_at: null, is_fake: isFakeBan } } 
        : u
    );
    setUsers(updatedUsers);
    toast.success(`[DEMO] ${isFakeBan ? 'Fake ban' : 'Ban'} issued to ${selectedUser.username}`);
    setActivities(prev => [{
      id: Date.now().toString(),
      type: "ban",
      user: selectedUser.username,
      message: `[DEMO] ${isFakeBan ? 'FAKE BAN' : 'BAN'}: @${selectedUser.username} - ${banReason}`,
      timestamp: new Date()
    }, ...prev]);
    setShowBanDialog(false);
    setBanReason("");
    setIsFakeBan(false);
    setShowUserDetails(false);
  };

  const handleDemoUnban = (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    const updatedUsers = users.map(u => 
      u.user_id === userId ? { ...u, isBanned: false, banInfo: undefined } : u
    );
    setUsers(updatedUsers);
    toast.success(`[DEMO] User unbanned`);
    setActivities(prev => [{
      id: Date.now().toString(),
      type: "system",
      user: user?.username,
      message: `[DEMO] Unban: @${user?.username || 'Unknown'}`,
      timestamp: new Date()
    }, ...prev]);
  };

  // Handle de-op (demote admin) - real and demo
  const handleDeop = async () => {
    if (!selectedUser) return;
    
    if (isDemoMode) {
      const updatedUsers = users.map(u => 
        u.id === selectedUser.id ? { ...u, role: 'user' } : u
      );
      setUsers(updatedUsers);
      toast.success(`[DEMO] Admin demoted: ${selectedUser.username}`);
      setActivities(prev => [{
        id: Date.now().toString(),
        type: "system",
        user: selectedUser.username,
        message: `[DEMO] Admin demoted: @${selectedUser.username} is now a regular user`,
        timestamp: new Date()
      }, ...prev]);
      setShowUserDetails(false);
      return;
    }
    
    try {
      const response = await supabase.functions.invoke('admin-actions', {
        method: 'POST',
        body: { action: 'deop', targetUserId: selectedUser.user_id }
      });

      if (response.error) throw response.error;
      
      toast.success(`Admin demoted: ${selectedUser.username}`);
      setActivities(prev => [{
        id: Date.now().toString(),
        type: "system",
        user: selectedUser.username,
        message: `👑 Admin demoted: @${selectedUser.username} is now a regular user`,
        timestamp: new Date()
      }, ...prev]);
      setShowUserDetails(false);
      fetchUsers();
    } catch (error: any) {
      console.error("Deop error:", error);
      toast.error(error?.message || "Failed to demote admin");
    }
  };

  // Handle VIP grant
  const handleVip = async () => {
    if (!selectedUser) return;
    
    if (isDemoMode) {
      const updatedUsers = users.map(u => 
        u.id === selectedUser.id ? { ...u, isVip: true } : u
      );
      setUsers(updatedUsers);
      toast.success(`[DEMO] VIP status granted to ${selectedUser.username}`);
      setActivities(prev => [{
        id: Date.now().toString(),
        type: "op",
        user: selectedUser.username,
        message: `[DEMO] ⭐ VIP granted to @${selectedUser.username}`,
        timestamp: new Date()
      }, ...prev]);
      setShowVipDialog(false);
      setShowUserDetails(false);
      return;
    }
    
    try {
      const response = await supabase.functions.invoke('admin-actions', {
        method: 'POST',
        body: { 
          action: 'grant_vip',
          targetUserId: selectedUser.user_id,
          reason: 'Granted by admin'
        }
      });

      if (response.error) throw response.error;
      
      toast.success(`VIP status granted to ${selectedUser.username}`);
      setActivities(prev => [{
        id: Date.now().toString(),
        type: "op",
        user: selectedUser.username,
        message: `⭐ VIP granted to @${selectedUser.username}`,
        timestamp: new Date()
      }, ...prev]);
      setShowVipDialog(false);
      setShowUserDetails(false);
      fetchUsers();
    } catch (error) {
      console.error("Grant VIP error:", error);
      toast.error("Failed to grant VIP status");
    }
  };

  // Handle VIP revoke
  const handleRevokeVip = async () => {
    if (!selectedUser) return;
    
    if (isDemoMode) {
      const updatedUsers = users.map(u => 
        u.id === selectedUser.id ? { ...u, isVip: false } : u
      );
      setUsers(updatedUsers);
      toast.success(`[DEMO] VIP status revoked from ${selectedUser.username}`);
      setActivities(prev => [{
        id: Date.now().toString(),
        type: "system",
        user: selectedUser.username,
        message: `[DEMO] VIP revoked: @${selectedUser.username}`,
        timestamp: new Date()
      }, ...prev]);
      setShowUserDetails(false);
      return;
    }
    
    try {
      const response = await supabase.functions.invoke('admin-actions', {
        method: 'POST',
        body: { 
          action: 'revoke_vip',
          targetUserId: selectedUser.user_id
        }
      });

      if (response.error) throw response.error;
      
      toast.success(`VIP status revoked from ${selectedUser.username}`);
      setActivities(prev => [{
        id: Date.now().toString(),
        type: "system",
        user: selectedUser.username,
        message: `VIP revoked: @${selectedUser.username}`,
        timestamp: new Date()
      }, ...prev]);
      setShowUserDetails(false);
      fetchUsers();
    } catch (error) {
      console.error("Revoke VIP error:", error);
      toast.error("Failed to revoke VIP status");
    }
  };

  // Extended management handlers
  const handleSetClearance = async (clearance: number) => {
    if (!selectedUser) return;
    if (isDemoMode) { toast.success(`[DEMO] Clearance set to ${clearance}`); return; }
    try {
      const response = await supabase.functions.invoke('admin-actions', { body: { action: 'set_clearance', targetUserId: selectedUser.user_id, clearance } });
      if (response.error) throw response.error;
      toast.success(`Clearance set to Level ${clearance}`);
      fetchUsers();
    } catch { toast.error('Failed to set clearance'); }
  };

  const handleForceLogout = async () => {
    if (!selectedUser) return;
    if (isDemoMode) { toast.success('[DEMO] Force logout'); return; }
    try {
      const response = await supabase.functions.invoke('admin-actions', { body: { action: 'force_logout', targetUserId: selectedUser.user_id } });
      if (response.error) throw response.error;
      toast.success(`Force logged out ${selectedUser.username}`);
    } catch { toast.error('Failed to force logout'); }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    if (isDemoMode) { toast.success('[DEMO] Password reset sent'); return; }
    try {
      const response = await supabase.functions.invoke('admin-actions', { body: { action: 'reset_password', targetUserId: selectedUser.user_id } });
      if (response.error) throw response.error;
      toast.success(`Password reset sent for ${selectedUser.username}`);
    } catch { toast.error('Failed to reset password'); }
  };

  const handleSetTrialAdmin = async () => {
    if (!selectedUser) return;
    if (isDemoMode) { toast.success(`[DEMO] Trial admin granted to ${selectedUser.username}`); return; }
    try {
      const response = await supabase.functions.invoke('admin-actions', { body: { action: 'set_trial_admin', targetUserId: selectedUser.user_id } });
      if (response.error) throw response.error;
      toast.success(`Trial admin granted to ${selectedUser.username}`);
      setShowUserDetails(false); fetchUsers();
    } catch { toast.error('Failed to grant trial admin'); }
  };

  const handleMakeCoCreator = async () => {
    if (!selectedUser) return;
    if (isDemoMode) { toast.success(`[DEMO] Promoted ${selectedUser.username} to co-creator`); return; }
    try {
      const response = await supabase.functions.invoke('admin-actions', { body: { action: 'promote_to_creator', targetUserId: selectedUser.user_id } });
      if (response.error) throw response.error;
      toast.success(`${selectedUser.username} is now a co-creator! 👑`);
      setShowUserDetails(false); fetchUsers();
    } catch { toast.error('Failed to promote to co-creator'); }
  };

  const handlePromoteTrial = async () => {
    if (!selectedUser) return;
    if (isDemoMode) { toast.success(`[DEMO] Promoted ${selectedUser.username} to full admin`); return; }
    try {
      const response = await supabase.functions.invoke('admin-actions', { body: { action: 'promote_trial', targetUserId: selectedUser.user_id } });
      if (response.error) throw response.error;
      toast.success(`Promoted ${selectedUser.username} to full admin`);
      setShowUserDetails(false); fetchUsers();
    } catch { toast.error('Failed to promote'); }
  };

  // Test emergency handlers
  const handleStartTestEmergency = async () => {
    if (isDemoMode) { toast.info("[DEMO] Test emergency would be started"); return; }
    setTestEmergencyLoading(true);
    try {
      const response = await supabase.functions.invoke('admin-actions', {
        body: { action: 'start_test_emergency' }
      });

      if (response.error) throw response.error;
      
      if (response.data?.error) {
        toast.error(response.data.message || "Cannot start test emergency");
        if (response.data.nextAvailable) {
          setTestEmergencyCooldown(new Date(response.data.nextAvailable));
        }
        return;
      }
      
      setActiveTestEmergency(response.data.emergency);
      toast.success(`Test emergency started! ${response.data.notifiedAdmins} admins notified.`);
      setActivities(prev => [{
        id: Date.now().toString(),
        type: "broadcast",
        message: `🚨 TEST EMERGENCY STARTED - ${response.data.notifiedAdmins} mods notified`,
        timestamp: new Date()
      }, ...prev]);
    } catch (error: any) {
      console.error("Start test emergency error:", error);
      toast.error(error?.message || "Failed to start test emergency");
    } finally {
      setTestEmergencyLoading(false);
    }
  };

  const handleEndTestEmergency = async () => {
    if (!activeTestEmergency || isDemoMode) return;
    
    setTestEmergencyLoading(true);
    try {
      const response = await supabase.functions.invoke('admin-actions', {
        body: { action: 'end_test_emergency', emergencyId: activeTestEmergency.id }
      });

      if (response.error) throw response.error;
      
      setActiveTestEmergency(null);
      toast.success("Test emergency ended");
      setActivities(prev => [{
        id: Date.now().toString(),
        type: "system",
        message: `✅ TEST EMERGENCY ENDED - Drill complete`,
        timestamp: new Date()
      }, ...prev]);
      fetchTestEmergencyStatus();
    } catch (error: any) {
      console.error("End test emergency error:", error);
      toast.error(error?.message || "Failed to end test emergency");
    } finally {
      setTestEmergencyLoading(false);
    }
  };

  // Bulk action handlers
  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredUsers.map(u => u.user_id)));
    }
  };

  const handleBulkWarn = async () => {
    if (!bulkWarnReason.trim() || selectedUserIds.size === 0) return;
    if (isDemoMode) {
      const updatedUsers = users.map(u => 
        selectedUserIds.has(u.user_id)
          ? { ...u, warningsCount: u.warningsCount + 1, warnings: [...u.warnings, { id: `demo-${Date.now()}-${u.id}`, reason: bulkWarnReason, created_at: new Date().toISOString() }] }
          : u
      );
      setUsers(updatedUsers);
      toast.success(`[DEMO] Warned ${selectedUserIds.size} users`);
    } else {
      try {
        const response = await supabase.functions.invoke('admin-actions', {
          body: { action: 'bulk_warn', targetUserIds: Array.from(selectedUserIds), reason: bulkWarnReason }
        });
        if (response.error) throw response.error;
        toast.success(`Warned ${selectedUserIds.size} users`);
        fetchUsers();
      } catch { toast.error("Bulk warn failed"); }
    }
    setActivities(prev => [{ id: Date.now().toString(), type: "warning", message: `Bulk warned ${selectedUserIds.size} users: ${bulkWarnReason}`, timestamp: new Date() }, ...prev]);
    setShowBulkWarnDialog(false);
    setBulkWarnReason("");
    setSelectedUserIds(new Set());
  };

  const handleBulkBan = async () => {
    if (!bulkBanReason.trim() || selectedUserIds.size === 0) return;
    if (isDemoMode) {
      const updatedUsers = users.map(u => 
        selectedUserIds.has(u.user_id)
          ? { ...u, isBanned: true, banInfo: { action_type: 'ban', reason: bulkBanReason, expires_at: null, is_fake: false } }
          : u
      );
      setUsers(updatedUsers);
      toast.success(`[DEMO] Banned ${selectedUserIds.size} users`);
    } else {
      try {
        const response = await supabase.functions.invoke('admin-actions', {
          body: { action: 'bulk_ban', targetUserIds: Array.from(selectedUserIds), reason: bulkBanReason, duration: bulkBanDuration !== 'perm' ? bulkBanDuration : null, isPermanent: bulkBanDuration === 'perm' }
        });
        if (response.error) throw response.error;
        toast.success(`Banned ${selectedUserIds.size} users`);
        fetchUsers();
      } catch { toast.error("Bulk ban failed"); }
    }
    setActivities(prev => [{ id: Date.now().toString(), type: "ban", message: `Bulk banned ${selectedUserIds.size} users: ${bulkBanReason}`, timestamp: new Date() }, ...prev]);
    setShowBulkBanDialog(false);
    setBulkBanReason("");
    setSelectedUserIds(new Set());
  };

  const handleBulkVip = async () => {
    if (selectedUserIds.size === 0) return;
    if (isDemoMode) {
      const updatedUsers = users.map(u => selectedUserIds.has(u.user_id) ? { ...u, isVip: true } : u);
      setUsers(updatedUsers);
      toast.success(`[DEMO] VIP granted to ${selectedUserIds.size} users`);
    } else {
      try {
        const response = await supabase.functions.invoke('admin-actions', {
          body: { action: 'bulk_vip', targetUserIds: Array.from(selectedUserIds) }
        });
        if (response.error) throw response.error;
        toast.success(`VIP granted to ${selectedUserIds.size} users`);
        fetchUsers();
      } catch { toast.error("Bulk VIP failed"); }
    }
    setSelectedUserIds(new Set());
  };

  // Filtered logs
  const filteredLogs = logs.filter(log => {
    const matchesAction = logActionFilter === 'all' || log.action_type === logActionFilter;
    const matchesSearch = !logSearch || (log.reason?.toLowerCase().includes(logSearch.toLowerCase()));
    let matchesDate = true;
    if (logDateFilter !== 'all') {
      const logDate = new Date(log.created_at);
      const now = new Date();
      const diffHours = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60);
      if (logDateFilter === '1h') matchesDate = diffHours <= 1;
      else if (logDateFilter === '24h') matchesDate = diffHours <= 24;
      else if (logDateFilter === '7d') matchesDate = diffHours <= 168;
      else if (logDateFilter === '30d') matchesDate = diffHours <= 720;
    }
    return matchesAction && matchesSearch && matchesDate;
  });

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = filterRole === "all" || u.role === filterRole;
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "banned" && u.isBanned) ||
      (filterStatus === "active" && !u.isBanned) ||
      (filterStatus === "warned" && u.warningsCount > 0);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <Cpu className="w-16 h-16 text-cyan-500 mx-auto mb-4 animate-pulse" />
            <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full" />
          </div>
          <p className="text-cyan-400 font-mono text-sm">NAVI: Verifying credentials...</p>
          <p className="text-slate-600 font-mono text-xs mt-2">Accessing Hadal Blacksite Control</p>
        </div>
      </div>
    );
  }

  // PIN gate (only for real admins, not demo)
  if (!isDemoMode && pinCheckDone && !pinVerified) {
    return <PinPromptScreen onVerified={() => setPinVerified(true)} hasPin={hasPinSet} />;
  }

  // Get ban duration options based on role
  const banDurationOptions = isTrialAdmin 
    ? (['1h', '24h'] as const) 
    : (['1h', '24h', '7d', '30d', 'perm'] as const);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-[#0a0f1a] to-slate-950 text-foreground">
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="bg-amber-500/20 border-b-2 border-amber-500/30 px-6 py-4">
          <div className="max-w-[1800px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Eye className="w-6 h-6 text-amber-400" />
              <div>
                <h3 className="font-bold text-amber-400 font-mono">DEMO MODE</h3>
                <p className="text-sm text-amber-300/70 font-mono">Changes are local only - not synced to cloud</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded bg-amber-500/30 text-amber-400 font-mono text-xs">NOT AUTHENTICATED</span>
          </div>
        </div>
      )}
      
      {/* Hadal Blacksite Header */}
      <div className="border-b-2 border-cyan-500/20 bg-gradient-to-r from-slate-950 via-cyan-950/20 to-slate-950">
        <div className="max-w-[1800px] mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Shield className="w-10 h-10 text-cyan-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold font-mono text-cyan-400">MODERATION PANEL</h1>
                  {adminRole && adminRoleBadge[adminRole] && !isDemoMode && (
                    <span className={`px-2 py-0.5 rounded text-xs font-mono border ${adminRoleBadge[adminRole].color}`}>
                      {adminRoleBadge[adminRole].label}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 font-mono">Hadal Blacksite Control System v3.3.1</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* NAVI Message Button */}
              {!isTrialAdmin && (
                <Button 
                  onClick={() => setShowNaviMessageDialog(true)}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 gap-2"
                >
                  <Bot className="w-4 h-4" /> NAVI Message
                </Button>
              )}
              
              {/* Broadcast Button */}
              {!isTrialAdmin && (
                <Button 
                  onClick={() => setShowBroadcastDialog(true)}
                  variant="outline" 
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 gap-2"
                >
                  <Megaphone className="w-4 h-4" /> Broadcast
                </Button>
              )}
              
              {/* Lock Site Status */}
              {!isTrialAdmin && (
                lockdownActive ? (
                  <Button 
                    onClick={handleLiftLockdown}
                    className="bg-red-600 hover:bg-red-500 gap-2 animate-pulse"
                  >
                    <Lock className="w-4 h-4" /> SITE LOCKED
                  </Button>
                ) : (
                  <Button 
                    onClick={() => setShowLockdownDialog(true)}
                    variant="outline" 
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 gap-2"
                  >
                    <AlertOctagon className="w-4 h-4" /> Lock Site
                  </Button>
                )
              )}
              
              {/* Online users count */}
              <span className="text-xs font-mono text-green-400 flex items-center gap-1.5 px-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                {users.filter(u => u.lastActive && (Date.now() - new Date(u.lastActive).getTime()) < 15 * 60 * 1000).length} online
              </span>
              <Button variant="outline" onClick={isDemoMode ? () => setUsers(DEMO_USERS) : fetchUsers} className="gap-2 border-slate-700">
                <RefreshCw className="w-4 h-4" /> Refresh
              </Button>
              <Button variant="ghost" onClick={() => navigate("/")} className="text-slate-400">
                <XCircle className="w-4 h-4 mr-1" /> Exit
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-6 py-6 flex gap-6">
        {/* Sidebar Navigation */}
        <div className="w-56 flex-shrink-0">
          <div className="sticky top-6 p-2 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
            <div className="px-3 py-2 text-xs font-mono text-slate-500 uppercase tracking-wider">Users</div>
            
            <SidebarNavItem icon={Users} label="Personnel" count={users.length} active={activeTab === 'users'} onClick={() => setActiveTab('users')} color="cyan" />
            <SidebarNavItem icon={Flag} label="Reports" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} color="amber" />
            <SidebarNavItem icon={MessageSquare} label="Support Tickets" active={activeTab === 'support'} onClick={() => setActiveTab('support')} color="purple" />
            
            <div className="px-3 py-2 text-xs font-mono text-slate-500 uppercase tracking-wider mt-3">System</div>
            
            <SidebarNavItem icon={Server} label="Zone Control" active={activeTab === 'status'} onClick={() => { setActiveTab('status'); fetchStatuses(); }} color="cyan" />
            <SidebarNavItem icon={Shield} label="Authorities" active={activeTab === 'authorities'} onClick={() => setActiveTab('authorities')} color="purple" />
            <SidebarNavItem icon={BarChart3} label="Stats" active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} color="blue" />
            <SidebarNavItem icon={FileText} label="Mod Logs" active={activeTab === 'logs'} onClick={() => { setActiveTab('logs'); fetchLogs(); }} color="cyan" />
            <SidebarNavItem icon={Activity} label="Access Log" active={activeTab === 'access-log'} onClick={() => setActiveTab('access-log')} color="cyan" />
            <SidebarNavItem icon={KeyRound} label="Security" active={activeTab === 'security'} onClick={() => setActiveTab('security')} color="amber" />
            
            {/* NAVI section (hidden for trial admins) */}
            {!isTrialAdmin && (
              <>
                <div className="px-3 py-2 text-xs font-mono text-slate-500 uppercase tracking-wider mt-3">NAVI</div>
                <SidebarNavItem icon={Bot} label="NAVI Config" active={activeTab === 'navi-config'} onClick={() => setActiveTab('navi-config')} color="amber" />
                <SidebarNavItem icon={Hash} label="Chat" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} color="cyan" />
                <SidebarNavItem icon={Zap} label="Test Emergency" active={activeTab === 'test-emergency'} onClick={() => { setActiveTab('test-emergency'); fetchTestEmergencyStatus(); }} color="red" />
              </>
            )}

            {/* Creator section */}
            {isCreator && (
              <>
                <div className="px-3 py-2 text-xs font-mono text-yellow-500 uppercase tracking-wider mt-3">Creator</div>
                <SidebarNavItem icon={Crown} label="Creator Tools" active={activeTab === 'creator-tools'} onClick={() => setActiveTab('creator-tools')} color="amber" />
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Personnel Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="flex gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search personnel..."
                    className="pl-10 bg-slate-900/50 border-slate-700 font-mono"
                  />
                </div>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-40 bg-slate-900/50 border-slate-700">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="trial_admin">Trial Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40 bg-slate-900/50 border-slate-700">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="banned">Banned</SelectItem>
                    <SelectItem value="warned">With Warnings</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => {
                    const data = JSON.stringify(users, null, 2);
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'personnel-export.json';
                    a.click();
                  }}
                  variant="outline"
                  className="border-slate-700 gap-2"
                >
                  <Download className="w-4 h-4" /> Export
                </Button>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-5 gap-4">
                {[
                  { icon: Users, value: users.length, label: "TOTAL", color: "text-cyan-400" },
                  { icon: Ban, value: users.filter(u => u.isBanned).length, label: "BANNED", color: "text-red-400" },
                  { icon: AlertTriangle, value: users.reduce((acc, u) => acc + u.warningsCount, 0), label: "WARNINGS", color: "text-amber-400" },
                  { icon: ShieldCheck, value: users.filter(u => !u.isBanned && u.warningsCount === 0).length, label: "CLEAN", color: "text-green-400" },
                  { icon: Shield, value: users.filter(u => u.role === 'admin' || u.role === 'trial_admin').length, label: "STAFF", color: "text-purple-400" },
                ].map((stat, i) => (
                  <div key={i} className="p-4 rounded-lg bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800">
                    <div className="flex items-center gap-3">
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                      <div>
                        <div className={`text-2xl font-bold ${stat.color} font-mono`}>{stat.value}</div>
                        <div className="text-xs text-slate-500 font-mono">{stat.label}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Select All + Bulk Actions Bar */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-600 bg-slate-900"
                  />
                  <span className="font-mono text-xs">
                    {selectedUserIds.size > 0 ? `${selectedUserIds.size} selected` : 'Select All'}
                  </span>
                </label>
                {selectedUserIds.size > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedUserIds(new Set())} className="text-slate-400 text-xs">
                    Clear Selection
                  </Button>
                )}
              </div>

              {/* Floating Bulk Actions Bar */}
              {selectedUserIds.size >= 2 && (
                <div className="sticky top-0 z-10 p-3 rounded-lg bg-cyan-950/80 backdrop-blur border-2 border-cyan-500/40 flex items-center justify-between animate-in slide-in-from-top-2">
                  <span className="text-cyan-400 font-mono text-sm font-bold">
                    {selectedUserIds.size} USERS SELECTED
                  </span>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => setShowBulkWarnDialog(true)} className="bg-amber-600 hover:bg-amber-500 gap-1">
                      <AlertTriangle className="w-3 h-3" /> Warn All ({selectedUserIds.size})
                    </Button>
                    <Button size="sm" onClick={() => setShowBulkBanDialog(true)} className="bg-red-600 hover:bg-red-500 gap-1">
                      <Ban className="w-3 h-3" /> Ban All ({selectedUserIds.size})
                    </Button>
                    {!isTrialAdmin && (
                      <Button size="sm" onClick={handleBulkVip} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 gap-1">
                        <Star className="w-3 h-3" /> VIP All ({selectedUserIds.size})
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setSelectedUserIds(new Set())} className="text-slate-400">
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* User List */}
              <div className="space-y-2">
                {filteredUsers.map(user => (
                  <div 
                    key={user.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-[1.01] ${
                      selectedUserIds.has(user.user_id) ? 'ring-2 ring-cyan-500/50' : ''
                    } ${
                      user.isBanned 
                        ? 'bg-gradient-to-r from-red-950/30 to-slate-950 border-red-500/30 hover:border-red-500/50' 
                        : user.warningsCount > 0
                        ? 'bg-gradient-to-r from-amber-950/20 to-slate-950 border-amber-500/20 hover:border-amber-500/40'
                        : 'bg-slate-900/50 border-slate-800 hover:border-cyan-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.has(user.user_id)}
                          onChange={(e) => { e.stopPropagation(); toggleUserSelection(user.user_id); }}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-slate-600 bg-slate-900 flex-shrink-0"
                        />
                        <div 
                          className="flex items-center gap-4 flex-1"
                          onClick={() => { setSelectedUser(user); setShowUserDetails(true); }}
                        >
                          {/* Avatar with online indicator */}
                          <div className="relative">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold overflow-hidden ${
                              user.role === 'admin' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                              user.role === 'trial_admin' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                              user.role === 'moderator' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                              'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            }`}>
                              {user.username[0].toUpperCase()}
                            </div>
                            {/* Online status dot */}
                            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${
                              user.lastActive && (Date.now() - new Date(user.lastActive).getTime()) < 15 * 60 * 1000
                                ? 'bg-green-500' : 'bg-slate-600'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{user.display_name || user.username}</span>
                              <span className="text-xs text-slate-500 font-mono">@{user.username}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className={`px-2 py-0.5 rounded text-xs font-mono border ${
                                user.role === 'admin' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                user.role === 'trial_admin' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                                user.role === 'moderator' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                                'bg-slate-800 text-slate-400 border-slate-700'
                              }`}>
                                {user.role === 'trial_admin' ? 'TRIAL ADMIN' : user.role?.toUpperCase() || 'USER'}
                              </span>
                              {user.clearance && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                  L{user.clearance}
                                </span>
                              )}
                              {user.isBanned && (
                                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-xs font-mono flex items-center gap-1 border border-red-500/30">
                                  <Ban className="w-3 h-3" /> BANNED
                                </span>
                              )}
                              {user.warningsCount > 0 && (
                                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs font-mono flex items-center gap-1 border border-amber-500/30">
                                  <AlertTriangle className="w-3 h-3" /> {user.warningsCount}
                                </span>
                              )}
                              {user.isVip && (
                                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-xs font-mono flex items-center gap-1 border border-purple-500/30">
                                  <Star className="w-3 h-3" /> VIP
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 flex-shrink-0" onClick={() => { setSelectedUser(user); setShowUserDetails(true); }}>
                        <div className="text-right">
                          <span className="text-xs text-slate-500 font-mono block">
                            {new Date(user.created_at).toLocaleDateString()}
                          </span>
                          {user.lastActive && (
                            <span className="text-[10px] text-slate-600 font-mono block">
                              Last seen {(() => {
                                const diff = Date.now() - new Date(user.lastActive).getTime();
                                if (diff < 60000) return 'just now';
                                if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
                                if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
                                return `${Math.floor(diff / 86400000)}d ago`;
                              })()}
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              {/* Filters Row */}
              <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder="Search by reason..."
                    className="pl-10 bg-slate-900/50 border-slate-700 font-mono text-sm"
                  />
                </div>
                <Select value={logActionFilter} onValueChange={setLogActionFilter}>
                  <SelectTrigger className="w-44 bg-slate-900/50 border-slate-700 text-sm">
                    <SelectValue placeholder="Action type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="warn">Warnings</SelectItem>
                    <SelectItem value="temp_ban">Temp Bans</SelectItem>
                    <SelectItem value="perm_ban">Perm Bans</SelectItem>
                    <SelectItem value="unban">Unbans</SelectItem>
                    <SelectItem value="ip_ban">IP Bans</SelectItem>
                    <SelectItem value="warning_removed">Removed Warnings</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={logDateFilter} onValueChange={setLogDateFilter}>
                  <SelectTrigger className="w-36 bg-slate-900/50 border-slate-700 text-sm">
                    <SelectValue placeholder="Time range" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="1h">Last Hour</SelectItem>
                    <SelectItem value="24h">Last 24h</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
                <span className="self-center text-xs font-mono text-slate-500">
                  {filteredLogs.length} entries
                </span>
              </div>

              {/* Log entries */}
              <div className="space-y-2">
                {filteredLogs.map(log => (
                  <div key={log.id} className={`p-3 rounded-lg border font-mono text-sm ${
                    log.action_type === 'perm_ban' ? 'bg-red-950/30 border-red-500/30' :
                    log.action_type === 'temp_ban' ? 'bg-orange-950/30 border-orange-500/30' :
                    log.action_type === 'warn' ? 'bg-amber-950/20 border-amber-500/20' :
                    log.action_type === 'unban' ? 'bg-green-950/20 border-green-500/20' :
                    'bg-slate-900/50 border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          log.action_type === 'perm_ban' ? 'bg-red-500/20 text-red-400' :
                          log.action_type === 'temp_ban' ? 'bg-orange-500/20 text-orange-400' :
                          log.action_type === 'warn' ? 'bg-amber-500/20 text-amber-400' :
                          log.action_type === 'unban' ? 'bg-green-500/20 text-green-400' :
                          'bg-slate-800 text-slate-400'
                        }`}>{log.action_type?.toUpperCase()}</span>
                        <span className="text-slate-300">{log.reason || 'No reason'}</span>
                        {log.is_fake && <span className="text-purple-400 text-xs">(FAKE)</span>}
                      </div>
                      <span className="text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      {log.target_user_id && <span>Target: {log.target_user_id.slice(0, 8)}...</span>}
                      {log.created_by && <span>By: {log.admin_username || log.created_by.slice(0, 8) + '...'}</span>}
                    </div>
                  </div>
                ))}
                {filteredLogs.length === 0 && <p className="text-center text-slate-500 font-mono text-sm py-8">No logs found</p>}
              </div>
            </div>
          )}

          {/* Zone Control Tab */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold font-mono text-cyan-400 flex items-center gap-2"><Server className="w-5 h-5" /> Zone Control</h2>
              {statusLoading ? (
                <p className="text-slate-500 font-mono text-sm animate-pulse">Loading zones...</p>
              ) : statuses.length === 0 ? (
                <p className="text-slate-500 font-mono text-sm">No zones configured</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {statuses.map(s => <StatusCard key={s.id} status={s} onUpdate={updateStatus} />)}
                </div>
              )}
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <ReportsTab isDemo={isDemoMode} />
          )}

          {/* Support Tickets Tab */}
          {activeTab === 'support' && (
            <SupportTicketsTab isDemo={isDemoMode} />
          )}

          {/* Authorities Tab */}
          {activeTab === 'authorities' && (
            <NaviAuthoritiesTab isDemo={isDemoMode} />
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <StatsTab users={users} />
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <SecurityTab isCreator={isCreator} users={users} />
          )}

          {/* Access Log Tab */}
          {activeTab === 'access-log' && (
            <AccessLogTab />
          )}

          {/* Creator Tools Tab */}
          {activeTab === 'creator-tools' && isCreator && (
            <CreatorToolsTab onRefreshUsers={fetchUsers} />
          )}

          {/* NAVI Config Tab (formerly Autonomous) */}
          {activeTab === 'navi-config' && (
            <NaviAutonomousPanel />
          )}

          {/* Chat Tab - NAVI AI */}
          {activeTab === 'chat' && (
            <NaviAIChatTab isDemoMode={isDemoMode} />
          )}

          {/* Test Emergency Tab */}
          {activeTab === 'test-emergency' && (
            <div className="space-y-6">
              <div className="p-6 rounded-lg bg-gradient-to-br from-red-950/30 to-slate-900 border border-red-500/30">
                <h3 className="text-xl font-bold text-red-400 mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5" /> Test Emergency Drill
                </h3>
                <p className="text-sm text-slate-400 mb-4">
                  Start a test emergency to drill the moderation team. All admins/mods will be notified automatically via NAVI. 
                  Fake data will be generated for testing purposes. Limited to once per 12 hours per admin.
                </p>
                
                {testEmergencyCooldown && new Date() < testEmergencyCooldown && (
                  <div className="p-3 rounded bg-amber-500/10 border border-amber-500/30 mb-4">
                    <p className="text-amber-400 text-sm">
                      ⏳ On cooldown until: {testEmergencyCooldown.toLocaleString()}
                    </p>
                  </div>
                )}
                
                {activeTestEmergency ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded bg-red-500/10 border border-red-500/50 animate-pulse">
                      <p className="font-bold text-red-400">🚨 TEST EMERGENCY ACTIVE</p>
                      <p className="text-xs text-slate-400 mt-1">ID: {activeTestEmergency.id}</p>
                      <p className="text-xs text-slate-400">Started: {new Date(activeTestEmergency.started_at).toLocaleString()}</p>
                    </div>
                    
                    {activeTestEmergency.fake_data && (
                      <div className="p-4 rounded bg-slate-800/50 border border-slate-700">
                        <h4 className="font-bold text-slate-300 mb-2">Fake Data (Test Only)</h4>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div className="p-2 rounded bg-slate-900"><span className="text-slate-500">Signups:</span> <span className="text-cyan-400">{activeTestEmergency.fake_data.signups_spike}</span></div>
                          <div className="p-2 rounded bg-slate-900"><span className="text-slate-500">Failed Logins:</span> <span className="text-amber-400">{activeTestEmergency.fake_data.failed_logins}</span></div>
                          <div className="p-2 rounded bg-slate-900"><span className="text-slate-500">Spam:</span> <span className="text-red-400">{activeTestEmergency.fake_data.messages_spam}</span></div>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">Threat Level: <span className="text-red-400 uppercase">{activeTestEmergency.fake_data.threat_level}</span></p>
                      </div>
                    )}
                    
                    <Button onClick={handleEndTestEmergency} disabled={testEmergencyLoading} className="bg-green-600 hover:bg-green-500">
                      {testEmergencyLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      End Test Emergency
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={handleStartTestEmergency} 
                    disabled={testEmergencyLoading || (testEmergencyCooldown && new Date() < testEmergencyCooldown)}
                    className="bg-red-600 hover:bg-red-500"
                  >
                    {testEmergencyLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                    Start Test Emergency
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Activity feed moved to Access Log tab */}
      </div>

      {/* User Details Panel */}
      {showUserDetails && selectedUser && (
        <UserDetailsPanel
          user={selectedUser}
          onClose={() => { setShowUserDetails(false); setSelectedUser(null); }}
          onWarn={() => setShowWarnDialog(true)}
          onBan={() => setShowBanDialog(true)}
          onUnban={() => isDemoMode ? handleDemoUnban(selectedUser.user_id) : handleUnban(selectedUser.user_id)}
          onOp={() => setShowOpDialog(true)}
          onDeop={handleDeop}
          onVip={() => setShowVipDialog(true)}
          onRevokeVip={handleRevokeVip}
          onRemoveWarning={(warningId) => { setSelectedWarningId(warningId); setShowRemoveWarningDialog(true); }}
          isDemo={isDemoMode}
          isCreator={isCreator}
          adminRole={adminRole}
          onSetClearance={handleSetClearance}
          onForceLogout={handleForceLogout}
          onResetPassword={handleResetPassword}
          onSetTrialAdmin={handleSetTrialAdmin}
          onPromoteTrial={handlePromoteTrial}
          onMakeCoCreator={handleMakeCoCreator}
        />
      )}

      {/* Warn Dialog */}
      <Dialog open={showWarnDialog} onOpenChange={setShowWarnDialog}>
        <DialogContent className="bg-slate-950 border-amber-500/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400 font-mono">
              <AlertTriangle className="w-5 h-5" />
              ISSUE WARNING
            </DialogTitle>
            <DialogDescription className="font-mono text-slate-400">
              Warning will be logged and added to {selectedUser?.username}'s record.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={warnReason}
            onChange={(e) => setWarnReason(e.target.value)}
            placeholder="Enter warning reason..."
            rows={3}
            className="bg-slate-900 border-slate-700 font-mono"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWarnDialog(false)} className="border-slate-700">Cancel</Button>
            <Button onClick={isDemoMode ? handleDemoWarn : handleWarn} className="bg-amber-600 hover:bg-amber-500">
              {isDemoMode && '[DEMO] '}Issue Warning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent className="bg-slate-950 border-red-500/30 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400 font-mono">
              <Ban className="w-5 h-5" />
              BAN USER
            </DialogTitle>
            <DialogDescription className="font-mono text-slate-400">
              Banning {selectedUser?.username} will revoke all access.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-mono mb-2 block text-slate-400">DURATION</label>
              <div className="flex flex-wrap gap-2">
                {banDurationOptions.map(d => (
                  <Button
                    key={d}
                    variant={banDuration === d ? "default" : "outline"}
                    size="sm"
                    onClick={() => setBanDuration(d)}
                    className={banDuration === d ? "bg-red-600" : "border-slate-700"}
                  >
                    {d === 'perm' ? 'PERMANENT' : d.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
            
            <Textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Enter ban reason..."
              rows={3}
              className="bg-slate-900 border-slate-700 font-mono"
            />

            <label className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 cursor-pointer">
              <input
                type="checkbox"
                checked={isFakeBan}
                onChange={(e) => setIsFakeBan(e.target.checked)}
                className="w-4 h-4"
              />
              <div>
                <div className="font-medium text-purple-400 flex items-center gap-2 font-mono">
                  <PartyPopper className="w-4 h-4" /> FAKE BAN (Prank)
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  Shows ban message but reveals "GET PRANKED!" on click
                </p>
              </div>
            </label>

            {/* Ban Preview */}
            {banReason && (
              <div>
                <label className="text-sm font-mono mb-2 block text-slate-400 flex items-center gap-2">
                  <Eye className="w-3 h-3" /> BAN MESSAGE PREVIEW
                </label>
                <div className="p-4 rounded-lg bg-red-950/50 border-2 border-red-500/50">
                  <div className="flex items-center gap-3 mb-3">
                    <Ban className="w-8 h-8 text-red-500" />
                    <div>
                      <h4 className="font-bold text-red-400 font-mono">ACCESS DENIED</h4>
                      <p className="text-xs text-red-400/70 font-mono">Your account has been suspended</p>
                    </div>
                  </div>
                  <div className="p-3 rounded bg-slate-950/50 border border-slate-800">
                    <p className="text-sm text-slate-300 font-mono mb-2">
                      <strong>Reason:</strong> {banReason}
                    </p>
                    <p className="text-xs text-slate-500 font-mono">
                      <strong>Duration:</strong> {banDuration === 'perm' ? 'Permanent' : banDuration}
                    </p>
                  </div>
                  {isFakeBan && (
                    <p className="text-xs text-purple-400 mt-2 font-mono flex items-center gap-1">
                      <PartyPopper className="w-3 h-3" /> User can click to reveal it's a prank!
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)} className="border-slate-700">Cancel</Button>
            <Button onClick={isDemoMode ? handleDemoBan : handleBan} className="bg-red-600 hover:bg-red-500">
              {isDemoMode && '[DEMO] '}{isFakeBan ? 'Fake Ban' : 'Ban User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lock Site Dialog */}
      <Dialog open={showLockdownDialog} onOpenChange={setShowLockdownDialog}>
        <DialogContent className="bg-slate-950 border-red-500/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400 font-mono">
              <AlertOctagon className="w-5 h-5 animate-pulse" />
              LOCK SITE
            </DialogTitle>
            <DialogDescription className="font-mono text-slate-400">
              Emergency site lock - restricts all access until lifted.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-mono mb-2 block text-slate-400">TARGET ZONE</label>
              <Select value={lockdownZone} onValueChange={setLockdownZone}>
                <SelectTrigger className="bg-slate-900 border-slate-700 font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="all">Entire Site (Global Lock)</SelectItem>
                  <SelectItem value="main">Main Site Only</SelectItem>
                  <SelectItem value="docs">Documentation</SelectItem>
                  <SelectItem value="def-dev">DefDev Mode</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-sm text-red-300 font-mono">
                ⚠️ EMERGENCY LOCK: When active, users attempting to access the site will see a "Site Under Lock" message. 
                Only admins can lift the lock. Use this for emergencies only.
              </p>
            </div>
            
            {isDemoMode && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-xs text-amber-400 font-mono flex items-center gap-2">
                  <Eye className="w-3 h-3" /> DEMO MODE: This won't actually lock the site
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLockdownDialog(false)} className="border-slate-700">Cancel</Button>
            <Button onClick={handleLockdown} className="bg-red-600 hover:bg-red-500 gap-2">
              <Lock className="w-4 h-4" /> CONFIRM LOCK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OP (Grant Admin) Dialog */}
      <Dialog open={showOpDialog} onOpenChange={setShowOpDialog}>
        <DialogContent className="bg-slate-950 border-purple-500/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-400 font-mono">
              <Crown className="w-5 h-5" />
              GRANT ADMIN (OP)
            </DialogTitle>
            <DialogDescription className="font-mono text-slate-400">
              This will give {selectedUser?.username} full admin privileges.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <p className="text-sm text-purple-300 font-mono">
              👑 WARNING: This action grants full moderation access. Only grant admin to trusted users.
            </p>
          </div>

          {isDemoMode && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p className="text-xs text-amber-400 font-mono flex items-center gap-2">
                <Eye className="w-3 h-3" /> DEMO MODE: This action won't affect the cloud
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOpDialog(false)} className="border-slate-700">Cancel</Button>
            <Button onClick={handleOp} className="bg-purple-600 hover:bg-purple-500 gap-2">
              <Crown className="w-4 h-4" /> {isDemoMode && '[DEMO] '}Grant Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Global Broadcast Dialog */}
      <Dialog open={showBroadcastDialog} onOpenChange={setShowBroadcastDialog}>
        <DialogContent className="bg-slate-950 border-cyan-500/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-cyan-400 font-mono">
              <Megaphone className="w-5 h-5" />
              GLOBAL NOTIFICATION
            </DialogTitle>
            <DialogDescription className="font-mono text-slate-400">
              Send a message to all UrbanShade users
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-mono mb-2 block text-slate-400">MESSAGE</label>
              <Textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="sup yall :D"
                rows={4}
                className="bg-slate-900 border-slate-700 font-mono"
                maxLength={500}
              />
              <div className="text-xs text-slate-500 mt-1 text-right">
                {broadcastMessage.length}/500
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <p className="text-xs text-cyan-400 font-mono">
                📢 This message will appear as a notification to all online users
              </p>
            </div>

            {isDemoMode && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-xs text-amber-400 font-mono flex items-center gap-2">
                  <Eye className="w-3 h-3" /> DEMO MODE: This action won't actually broadcast
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBroadcastDialog(false)} className="border-slate-700">Cancel</Button>
            <Button onClick={handleBroadcast} className="bg-cyan-600 hover:bg-cyan-500 gap-2">
              <Send className="w-4 h-4" /> {isDemoMode && '[DEMO] '}Broadcast
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* VIP Grant Dialog */}
      <Dialog open={showVipDialog} onOpenChange={setShowVipDialog}>
        <DialogContent className="bg-slate-950 border-purple-500/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-400 font-mono">
              <Star className="w-5 h-5" />
              GRANT VIP STATUS
            </DialogTitle>
            <DialogDescription className="font-mono text-slate-400">
              Grant VIP privileges to {selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30">
              <h4 className="font-bold text-purple-400 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> VIP Benefits
              </h4>
              <ul className="text-sm text-slate-300 space-y-1 font-mono">
                <li>• Cloud priority processing</li>
                <li>• VIP badge next to name</li>
                <li>• Skip advanced check when messaging Aswd</li>
                <li>• Overall priority in queues</li>
              </ul>
            </div>

            {isDemoMode && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-xs text-amber-400 font-mono flex items-center gap-2">
                  <Eye className="w-3 h-3" /> DEMO MODE: This action won't affect the cloud
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVipDialog(false)} className="border-slate-700">Cancel</Button>
            <Button onClick={handleVip} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 gap-2">
              <Star className="w-4 h-4" /> {isDemoMode && '[DEMO] '}Grant VIP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NAVI Direct Message Dialog */}
      <Dialog open={showNaviMessageDialog} onOpenChange={setShowNaviMessageDialog}>
        <DialogContent className="bg-slate-950 border-cyan-500/50 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-cyan-400 font-mono">
              <Bot className="w-5 h-5" />
              NAVI DIRECT MESSAGE
            </DialogTitle>
            <DialogDescription className="font-mono text-slate-400">
              Send a message directly to users' inboxes as NAVI
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-mono mb-2 block text-slate-400">TARGET AUDIENCE</label>
              <div className="flex flex-wrap gap-2">
                {([
                  { value: 'all', label: 'All Users', icon: '👥' },
                  { value: 'online', label: 'Online Only', icon: '🟢' },
                  { value: 'admins', label: 'Admins', icon: '🛡️' },
                  { value: 'vips', label: 'VIPs', icon: '⭐' },
                ] as const).map(t => (
                  <Button
                    key={t.value}
                    variant={naviTarget === t.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNaviTarget(t.value)}
                    className={naviTarget === t.value ? "bg-cyan-600" : "border-slate-700"}
                  >
                    {t.icon} {t.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-mono mb-2 block text-slate-400">PRIORITY LEVEL</label>
              <div className="flex gap-2">
                {([
                  { value: 'info', label: 'Info', color: 'cyan' },
                  { value: 'warning', label: 'Warning', color: 'amber' },
                  { value: 'critical', label: 'Critical', color: 'red' },
                ] as const).map(p => (
                  <Button
                    key={p.value}
                    variant={naviPriority === p.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNaviPriority(p.value)}
                    className={naviPriority === p.value 
                      ? p.color === 'cyan' ? "bg-cyan-600" : p.color === 'amber' ? "bg-amber-600" : "bg-red-600"
                      : "border-slate-700"}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-mono mb-2 block text-slate-400">MESSAGE</label>
              <Textarea
                value={naviMessage}
                onChange={(e) => setNaviMessage(e.target.value)}
                placeholder="Enter your NAVI announcement..."
                rows={4}
                className="bg-slate-900 border-slate-700 font-mono"
                maxLength={500}
              />
              <div className="text-xs text-slate-500 mt-1 text-right">
                {naviMessage.length}/500
              </div>
            </div>

            {/* Preview */}
            {naviMessage && (
              <div>
                <label className="text-sm font-mono mb-2 block text-slate-400 flex items-center gap-2">
                  <Eye className="w-3 h-3" /> MESSAGE PREVIEW
                </label>
                <div className={`p-4 rounded-lg border-2 ${
                  naviPriority === 'critical' ? 'bg-red-950/30 border-red-500/50' :
                  naviPriority === 'warning' ? 'bg-amber-950/30 border-amber-500/50' :
                  'bg-cyan-950/30 border-cyan-500/50'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cyan-400">NAVI</span>
                        <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                          Bot
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">System Announcement</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 font-mono">{naviMessage}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                      naviPriority === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      naviPriority === 'warning' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    }`}>
                      {naviPriority.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-500">→ {naviTarget === 'all' ? 'All Users' : naviTarget === 'online' ? 'Online Users' : naviTarget === 'admins' ? 'Admins' : 'VIPs'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <p className="text-xs text-cyan-400 font-mono">
                🤖 This message will appear directly in users' inboxes from NAVI. Great for time-sensitive updates!
              </p>
            </div>

            {isDemoMode && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-xs text-amber-400 font-mono flex items-center gap-2">
                  <Eye className="w-3 h-3" /> DEMO MODE: This action won't actually send messages
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNaviMessageDialog(false)} className="border-slate-700">Cancel</Button>
            <Button onClick={handleNaviMessage} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 gap-2">
              <Bot className="w-4 h-4" /> {isDemoMode && '[DEMO] '}Send NAVI Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Warning Dialog */}
      <Dialog open={showRemoveWarningDialog} onOpenChange={setShowRemoveWarningDialog}>
        <DialogContent className="bg-slate-950 border-amber-500/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400 font-mono">
              <Trash2 className="w-5 h-5" />
              REMOVE WARNING
            </DialogTitle>
            <DialogDescription className="font-mono text-slate-400">
              You must provide a reason for removing this warning.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={removeWarningReason}
            onChange={(e) => setRemoveWarningReason(e.target.value)}
            placeholder="Enter reason for removal (required)..."
            rows={3}
            className="bg-slate-900 border-slate-700 font-mono"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowRemoveWarningDialog(false); setRemoveWarningReason(""); }} className="border-slate-700">Cancel</Button>
            <Button 
              onClick={async () => {
                if (!selectedWarningId || !removeWarningReason.trim()) {
                  toast.error("Please provide a reason");
                  return;
                }
                if (isDemoMode) {
                  // Demo mode - just update local state
                  if (selectedUser) {
                    const updatedUsers = users.map(u => 
                      u.id === selectedUser.id 
                        ? { ...u, warningsCount: Math.max(0, u.warningsCount - 1), warnings: u.warnings.filter(w => w.id !== selectedWarningId) } 
                        : u
                    );
                    setUsers(updatedUsers);
                    setSelectedUser({ ...selectedUser, warningsCount: Math.max(0, selectedUser.warningsCount - 1), warnings: selectedUser.warnings.filter(w => w.id !== selectedWarningId) });
                  }
                  toast.success("[DEMO] Warning removed");
                } else {
                  try {
                    const response = await supabase.functions.invoke('admin-actions', {
                      body: { action: 'remove_warning', warningId: selectedWarningId, reason: removeWarningReason }
                    });
                    if (response.error) throw response.error;
                    toast.success("Warning removed");
                    fetchUsers();
                  } catch (error) {
                    toast.error("Failed to remove warning");
                  }
                }
                setShowRemoveWarningDialog(false);
                setRemoveWarningReason("");
                setSelectedWarningId(null);
              }} 
              disabled={!removeWarningReason.trim()}
              className="bg-amber-600 hover:bg-amber-500"
            >
              Remove Warning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Warn Dialog */}
      <Dialog open={showBulkWarnDialog} onOpenChange={setShowBulkWarnDialog}>
        <DialogContent className="bg-slate-950 border-amber-500/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400 font-mono">
              <AlertTriangle className="w-5 h-5" />
              BULK WARNING — {selectedUserIds.size} USERS
            </DialogTitle>
            <DialogDescription className="font-mono text-slate-400">
              Issue the same warning to all {selectedUserIds.size} selected users.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={bulkWarnReason}
            onChange={(e) => setBulkWarnReason(e.target.value)}
            placeholder="Enter warning reason..."
            rows={3}
            className="bg-slate-900 border-slate-700 font-mono"
          />
          {isDemoMode && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p className="text-xs text-amber-400 font-mono flex items-center gap-2">
                <Eye className="w-3 h-3" /> DEMO MODE: This action won't affect the cloud
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkWarnDialog(false)} className="border-slate-700">Cancel</Button>
            <Button onClick={handleBulkWarn} disabled={!bulkWarnReason.trim()} className="bg-amber-600 hover:bg-amber-500">
              {isDemoMode && '[DEMO] '}Warn {selectedUserIds.size} Users
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Ban Dialog */}
      <Dialog open={showBulkBanDialog} onOpenChange={setShowBulkBanDialog}>
        <DialogContent className="bg-slate-950 border-red-500/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400 font-mono">
              <Ban className="w-5 h-5" />
              BULK BAN — {selectedUserIds.size} USERS
            </DialogTitle>
            <DialogDescription className="font-mono text-slate-400">
              Ban all {selectedUserIds.size} selected users with the same reason.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={bulkBanReason}
            onChange={(e) => setBulkBanReason(e.target.value)}
            placeholder="Enter ban reason..."
            rows={3}
            className="bg-slate-900 border-slate-700 font-mono"
          />
          <div>
            <label className="text-sm font-mono mb-2 block text-slate-400">DURATION</label>
            <Select value={bulkBanDuration} onValueChange={(v: any) => setBulkBanDuration(v)}>
              <SelectTrigger className="bg-slate-900 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="1h">1 Hour</SelectItem>
                <SelectItem value="24h">24 Hours</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="perm">Permanent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isDemoMode && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p className="text-xs text-amber-400 font-mono flex items-center gap-2">
                <Eye className="w-3 h-3" /> DEMO MODE: This action won't affect the cloud
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkBanDialog(false)} className="border-slate-700">Cancel</Button>
            <Button onClick={handleBulkBan} disabled={!bulkBanReason.trim()} className="bg-red-600 hover:bg-red-500">
              {isDemoMode && '[DEMO] '}Ban {selectedUserIds.size} Users
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModerationPanel;
