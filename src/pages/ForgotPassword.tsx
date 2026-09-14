import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
  };

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
          <h1 className="text-2xl font-bold text-primary-foreground">Reset your password</h1>
          <p className="text-primary-foreground/50 text-sm mt-2">We'll send you a reset link</p>
        </div>

        <div className="glass-card-strong rounded-2xl p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-svo-gold/10 flex items-center justify-center mx-auto">
                <Mail className="w-7 h-7 text-svo-gold" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Check your email</h3>
              <p className="text-sm text-muted-foreground">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <Link to="/signin">
                <Button variant="ghost" className="mt-4">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to sign in
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-svo-gold text-svo-navy hover:bg-svo-gold/90 font-semibold"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link to="/signin" className="text-svo-gold hover:underline font-medium">
                  <ArrowLeft className="w-3 h-3 inline mr-1" /> Back to sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
