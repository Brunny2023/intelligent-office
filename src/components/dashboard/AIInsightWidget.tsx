import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Brain, AlertTriangle, TrendingUp, Sparkles, ArrowRight } from "lucide-react";

const severityStyle: Record<string, { icon: React.ElementType; bg: string; text: string; border: string }> = {
  critical: { icon: AlertTriangle, bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/20" },
  warning: { icon: AlertTriangle, bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-500/20" },
  success: { icon: TrendingUp, bg: "bg-green-500/10", text: "text-green-600", border: "border-green-500/20" },
  info: { icon: Sparkles, bg: "bg-svo-blue/10", text: "text-svo-blue", border: "border-svo-blue/20" },
};

const AIInsightWidget = () => {
  const { org } = useOrganization();
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!org) return;
    (async () => {
      const { data } = await supabase
        .from("ai_insights")
        .select("id, title, content, severity, generated_at")
        .eq("organization_id", org.id)
        .order("generated_at", { ascending: false })
        .limit(3);
      setInsights(data || []);
      setLoading(false);
    })();
  }, [org]);

  return (
    <div className="glass-card-strong rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Brain className="w-4 h-4 text-accent" /> AI Insight
        </h3>
        <Link to="/ai-insights" className="text-xs text-accent hover:underline flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />)}
        </div>
      ) : insights.length === 0 ? (
        <div className="text-center py-6">
          <Brain className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No insights yet.</p>
          <Link to="/ai-insights" className="text-xs text-accent hover:underline mt-2 inline-block">
            Generate insights →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {insights.map((ins, i) => {
            const s = severityStyle[ins.severity] || severityStyle.info;
            const Icon = s.icon;
            return (
              <motion.div
                key={ins.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0, transition: { delay: i * 0.08 } }}
                className={`p-3 rounded-lg ${s.bg} border ${s.border}`}
              >
                <div className={`flex items-center gap-2 ${s.text} font-medium text-xs mb-1`}>
                  <Icon className="w-3.5 h-3.5" /> {ins.title}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{ins.content}</p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AIInsightWidget;