import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      navigate("/signin");
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen gradient-hero-bg flex items-center justify-center px-4">
        <div className="glass-card-strong rounded-2xl p-8 text-center max-w-md">
          <h2 className="text-xl font-bold text-foreground mb-2">Invalid Reset Link</h2>
          <p className="text-sm text-muted-foreground mb-4">This link is invalid or has expired.</p>
          <Link to="/forgot-password">
            <Button className="bg-svo-gold text-svo-navy hover:bg-svo-gold/90">
              Request New Link
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero-bg flex items-center justify-center px-4">
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
          <h1 className="text-2xl font-bold text-primary-foreground">Set new password</h1>
        </div>

        <form onSubmit={handleSubmit} className="glass-card-strong rounded-2xl p-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-svo-gold text-svo-navy hover:bg-svo-gold/90 font-semibold"
          >
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
