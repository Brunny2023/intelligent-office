import { useEffect, useRef, useState } from "react";
import { MockupShell, type MockView } from "@/components/mockups/shell";
import { VIEW_META } from "@/components/mockups/views";

const BASE_W = 1280;
const BASE_H = 800;

/**
 * Static, non-interactive render of a real product dashboard mockup,
 * scaled to fit its container. Used on the Features page so marketing
 * screenshots always match the shipped UI.
 */
export default function MockupPreview({ view, className }: { view: MockView; className?: string }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / BASE_W));
    ro.observe(el);
    setScale(el.clientWidth / BASE_W);
    return () => ro.disconnect();
  }, []);

  const meta = VIEW_META[view];
  const Comp = meta.Component;

  return (
    <div
      ref={wrapRef}
      className={`relative w-full overflow-hidden rounded-2xl border border-border/50 shadow-2xl bg-white ${className ?? ""}`}
      style={{ height: BASE_H * scale }}
      aria-hidden
    >
      <div
        className="absolute top-0 left-0 origin-top-left pointer-events-none select-none"
        style={{ width: BASE_W, height: BASE_H, transform: `scale(${scale})` }}
      >
        <MockupShell
          view={view}
          pageTitle={meta.title}
          pageSubtitle={meta.subtitle}
          headerIcon={meta.Icon ? <meta.Icon className="w-6 h-6 text-svo-gold" /> : undefined}
        >
          <Comp />
        </MockupShell>
      </div>
    </div>
  );
}
