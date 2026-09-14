import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="py-12 bg-svo-charcoal border-t border-border/10">
    <div className="container mx-auto px-4 md:px-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <img src="/favicon.png" alt="Intelligent Office" className="w-7 h-7 object-contain" />
          <span className="text-sm font-bold text-primary-foreground/80 font-['Space_Grotesk']">
            Intelligent Office<span className="text-svo-gold">.</span>
          </span>
        </div>
        <div className="flex items-center gap-6 text-xs text-primary-foreground/40">
          <Link to="/features" className="hover:text-primary-foreground/70 transition-colors">Features</Link>
          <Link to="/demo" className="hover:text-primary-foreground/70 transition-colors">Demo</Link>
          <a href="https://github.com/Brunny2023/intelligent-office" className="hover:text-primary-foreground/70 transition-colors">Source</a>
          <a href="mailto:hello@intelligent-office.example" className="hover:text-primary-foreground/70 transition-colors">Contact</a>
        </div>
        <div className="flex flex-col items-center md:items-end gap-1">
          <p className="text-xs text-primary-foreground/30">
            © 2026 the Intelligent Office showcase project. All rights reserved.
          </p>
          <p className="text-xs text-primary-foreground/25">
            A technical showcase for full-stack and AI engineering.
          </p>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
