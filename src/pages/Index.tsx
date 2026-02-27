import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import ReplacementSection from "@/components/landing/ReplacementSection";
import ValueSection from "@/components/landing/ValueSection";
import FeaturesShowcase from "@/components/landing/FeaturesShowcase";
import ExecutiveSection from "@/components/landing/ExecutiveSection";
import TrustSection from "@/components/landing/TrustSection";
import PricingSection from "@/components/landing/PricingSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSection />
        <ReplacementSection />
        <ValueSection />
        <FeaturesShowcase />
        <ExecutiveSection />
        <TrustSection />
        <PricingSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
