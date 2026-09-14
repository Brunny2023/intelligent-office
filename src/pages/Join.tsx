import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, KeyRound, ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { getDeviceFingerprint, getClientAgent } from "@/lib/deviceFingerprint";

interface TokenPreview {
  valid: boolean;
  organization_name?: string;
  organization_slug?: string;
  role?: string;
  expires_at?: string;
  rate_limited?: boolean;
  reason?: string;
}

const CODE_RE = /^[0-9A-F]{12}$/;

const Join = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [params] = useSearchParams();
  const [code, setCode] = useState((params.get("code") || "").toUpperCase());
  const [preview, setPreview] = useState<TokenPreview | null>(null);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);

  const locked = lockedUntil !== null && Date.now() < lockedUntil;

  const verify = async (raw: string) => {
    const value = raw.trim().toUpperCase();
    if (!value) { toast.error("Enter your access token"); return null; }
    if (!CODE_RE.test(value)) {
      toast.error("Access tokens are 12 characters (0-9, A-F)");
      return null;
    }
    if (locked) {
      toast.error("Too many attempts. Please wait a few minutes before trying again.");
      return null;
    }
    setChecking(true);
    const { data, error } = await supabase.rpc("lookup_access_token", {
      _code: value,
      _fingerprint: getDeviceFingerprint(),
      _user_agent: getClientAgent(),
    });
    setChecking(false);
    if (error) { toast.error(error.message); return null; }
    const result = data as unknown as TokenPreview;
    setPreview(result);
    if (result?.rate_limited) {
      setLockedUntil(Date.now() + 15 * 60 * 1000);
      toast.error(result.reason || "Too many attempts. Please wait 15 minutes.");
      return result;
    }
    if (!result?.valid) {
      setAttempts(a => a + 1);
      toast.error("This access token is invalid, already used, or expired");
    } else {
      setAttempts(0);
    }
    return result;
  };

  useEffect(() => {
    const initial = params.get("code");
    if (initial) verify(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const redeem = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc("redeem_access_token", {
      _code: code.trim().toUpperCase(),
      _fingerprint: getDeviceFingerprint(),
      _user_agent: getClientAgent(),
    });
    setBusy(false);
    const result = data as any;
    if (error || result?.error) {
      if (result?.rate_limited) setLockedUntil(Date.now() + 15 * 60 * 1000);
      toast.error(error?.message || result.error);
      return;
    }
    toast.success(`Welcome to ${preview?.organization_name || "your organization"}!`);
    navigate("/dashboard");
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) { toast.error("Please fill in all fields"); return; }
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.fullName }, emailRedirectTo: `${window.location.origin}/join?code=${code.trim().toUpperCase()}` },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (data.session) {
      await redeem();
    } else {
      toast.success("Check your email to confirm your account, then reopen this link to join.");
    }
  };

  const valid = preview?.valid;

  return (
    <div className="min-h-screen gradient-hero-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-svo-gold flex items-center justify-center">
              <Shield className="w-5 h-5 text-svo-navy" />
            </div>
            <span className="text-xl font-bold font-['Space_Grotesk'] text-primary-foreground">
              Intelligent Office<span className="text-svo-gold">.</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-primary-foreground">Join your organization</h1>
          <p className="text-primary-foreground/50 text-sm mt-2">
            Enter the single-use access token issued by your Admin or HR team.
          </p>
        </div>

        <div className="glass-card-strong rounded-2xl p-8 space-y-5">
          <div className="space-y-2">
            <Label className="text-foreground">Access Token</Label>
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); setPreview(null); }}
                placeholder="A1B2C3D4E5F6"
                className="h-11 rounded-xl font-mono tracking-widest"
              />
              <Button type="button" variant="secondary" className="h-11 rounded-xl" disabled={checking} onClick={() => verify(code)}>
                {checking ? "…" : "Verify"}
              </Button>
            </div>
            {locked && (
              <p className="text-xs text-destructive">
                Too many failed attempts from this device. Verification is paused for 15 minutes and your
                organization's administrators have been alerted.
              </p>
            )}
            {!locked && attempts >= 3 && (
              <p className="text-xs text-muted-foreground">
                {attempts} failed attempts. Repeated failures will temporarily lock this device.
              </p>
            )}
          </div>

          {valid && (
            <div className="rounded-xl border border-svo-gold/30 bg-svo-gold/5 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CheckCircle2 className="w-4 h-4 text-svo-gold" />
                {preview?.organization_name}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                You'll join as <span className="capitalize font-medium text-foreground">{preview?.role}</span>. This token can be used once and then expires.
              </p>
            </div>
          )}

          {valid && !locked && !authLoading && (
            user ? (
              <Button className="w-full h-11 rounded-xl bg-accent text-accent-foreground" disabled={busy} onClick={redeem}>
                <KeyRound className="w-4 h-4 mr-1" /> Join {preview?.organization_name}
              </Button>
            ) : (
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Full Name</Label>
                  <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="h-11 rounded-xl" placeholder="Jane Doe" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Work Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11 rounded-xl" placeholder="jane@company.com" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Password</Label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="h-11 rounded-xl pr-10" placeholder="At least 8 characters" />
                    <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-3 text-muted-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-11 rounded-xl bg-accent text-accent-foreground" disabled={busy}>
                  Create account & join <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Already have an account? <Link to={`/signin?next=/join?code=${code}`} className="text-accent hover:underline">Sign in</Link>, then reopen this link.
                </p>
              </form>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Join;
