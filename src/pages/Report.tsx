import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Shield, User, Bug, MessageSquare, Loader2, CheckCircle, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ReportType = 'user' | 'bug' | 'content' | 'security' | 'other';

interface ReportForm {
  type: ReportType;
  title: string;
  description: string;
  reportedUsername?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

const Report = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<ReportForm>({
    type: 'bug',
    title: '',
    description: '',
    reportedUsername: '',
    priority: 'medium'
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const reportTypes = [
    { value: 'user', label: 'Report User', icon: User, color: 'text-amber-400' },
    { value: 'bug', label: 'Bug Report', icon: Bug, color: 'text-emerald-400' },
    { value: 'content', label: 'Content', icon: MessageSquare, color: 'text-blue-400' },
    { value: 'security', label: 'Security', icon: Shield, color: 'text-red-400' },
    { value: 'other', label: 'Other', icon: FileText, color: 'text-muted-foreground' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (form.type === 'user' && !form.reportedUsername?.trim()) {
      toast.error("Please enter the username of the user you're reporting");
      return;
    }

    setLoading(true);
    
    try {
      let reportedUserId: string | null = null;
      if (form.type === 'user' && form.reportedUsername) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('username', form.reportedUsername.trim())
          .single();
        
        if (profile) {
          reportedUserId = profile.user_id;
        }
      }

      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user?.id || null,
          reported_user_id: reportedUserId,
          report_type: form.type,
          title: form.title.trim(),
          description: form.description.trim(),
          priority: form.priority,
          status: 'pending'
        });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Report submitted successfully!");
    } catch (err: any) {
      console.error('Failed to submit report:', err);
      toast.error(err.message || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        {/* Background pattern */}
        <div 
          className="fixed inset-0 pointer-events-none opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
        
        <Card className="max-w-md w-full bg-card/50 border-emerald-500/30 backdrop-blur-sm relative z-10">
          <CardContent className="pt-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Report Submitted</h2>
            <p className="text-muted-foreground text-sm">
              Thank you for your report. Our moderation team will review it and take appropriate action.
            </p>
            <div className="flex gap-3 justify-center pt-4">
              <Button variant="outline" onClick={() => navigate('/')}>
                Go Home
              </Button>
              <Button onClick={() => {
                setSubmitted(false);
                setForm({ type: 'bug', title: '', description: '', reportedUsername: '', priority: 'medium' });
              }}>
                Submit Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Background pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-md bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <span className="font-semibold text-sm">Submit Report</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 relative z-10">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Report an Issue</h1>
          <p className="text-muted-foreground text-sm">
            Help us keep UrbanShade safe and working properly.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Report Type */}
          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Report Type</Label>
            <div className="flex flex-wrap gap-2">
              {reportTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setForm({ ...form, type: type.value as ReportType })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-sm ${
                    form.type === type.value
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border/50 bg-card/30 text-muted-foreground hover:border-border hover:bg-card/50'
                  }`}
                >
                  <type.icon className={`w-4 h-4 ${form.type === type.value ? type.color : ''}`} />
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Username field for user reports */}
          {form.type === 'user' && (
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs uppercase tracking-wider text-muted-foreground">
                Reported Username
              </Label>
              <Input
                id="username"
                placeholder="Enter their username"
                value={form.reportedUsername}
                onChange={(e) => setForm({ ...form, reportedUsername: e.target.value })}
                className="bg-card/50 border-border/50 focus:border-primary"
              />
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-xs uppercase tracking-wider text-muted-foreground">
              Title
            </Label>
            <Input
              id="title"
              placeholder="Brief summary of the issue"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="bg-card/50 border-border/50 focus:border-primary"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs uppercase tracking-wider text-muted-foreground">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Please provide as much detail as possible..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="bg-card/50 border-border/50 focus:border-primary min-h-[140px] resize-none"
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground/50 text-right">
              {form.description.length}/2000
            </p>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Priority</Label>
            <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as any })}>
              <SelectTrigger className="bg-card/50 border-border/50 focus:border-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low — Minor issue</SelectItem>
                <SelectItem value="medium">Medium — Standard</SelectItem>
                <SelectItem value="high">High — Urgent</SelectItem>
                <SelectItem value="critical">Critical — Immediate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Report
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Not logged in notice */}
        {!user && (
          <div className="mt-8 p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-400">Not logged in</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You can still submit, but we won't be able to follow up.{' '}
                  <Link to="/" className="text-primary hover:underline">Log in</Link> for the best experience.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Report;
