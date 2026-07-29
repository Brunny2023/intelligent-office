import { motion } from "framer-motion";

export default function FollowUpsRail({ items, onPick }: { items: string[]; onPick: (q: string) => void }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Likely next questions</div>
      <div className="flex flex-wrap gap-2">
        {items.slice(0, 6).map((q, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onPick(q)}
            className="px-3 py-1.5 rounded-full text-xs bg-white/5 hover:bg-white/10 text-white/80 border border-white/10"
          >
            {q}
          </motion.button>
        ))}
      </div>
    </div>
  );
}