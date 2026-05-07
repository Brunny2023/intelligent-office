import { Shield } from "lucide-react";

const Footer = () => (
  <footer className="py-12 bg-svo-charcoal border-t border-border/10">
    <div className="container mx-auto px-4 md:px-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <img src="/myoffice-logo.png" alt="My Office" className="w-7 h-7 object-contain" />
          <span className="text-sm font-bold text-primary-foreground/80 font-['Space_Grotesk']">
            Soteria<span className="text-svo-gold">.</span>
          </span>
        </div>
        <div className="flex items-center gap-6 text-xs text-primary-foreground/40">
          <a href="#" className="hover:text-primary-foreground/70 transition-colors">Privacy</a>
          <a href="#" className="hover:text-primary-foreground/70 transition-colors">Terms</a>
          <a href="#" className="hover:text-primary-foreground/70 transition-colors">Security</a>
          <a href="#" className="hover:text-primary-foreground/70 transition-colors">Contact</a>
        </div>
        <div className="flex flex-col items-center md:items-end gap-1">
          <p className="text-xs text-primary-foreground/30">
            © 2026 Virtual Office. All rights reserved.
          </p>
          <p className="text-xs text-primary-foreground/25">
            Powered by Soteria AI Technologies Limited.
          </p>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
