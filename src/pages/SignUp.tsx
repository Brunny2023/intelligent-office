import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ArrowRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const SignUp = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName },
        emailRedirectTo: window.location.origin,
      },
    });

    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Check your email to confirm your account!");
      navigate("/signin");
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
              Soteria<span className="text-svo-gold">.</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-primary-foreground">Create your account</h1>
          <p className="text-primary-foreground/50 text-sm mt-2">Get started with your digital headquarters</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card-strong rounded-2xl p-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-foreground">Full Name</Label>
            <Input
              id="fullName"
              placeholder="John Doe"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
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
            {loading ? "Creating account..." : "Create Account"}
            {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/signin" className="text-svo-gold hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
