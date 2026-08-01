import { useMemo, useState } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronRight } from "lucide-react";
import { DATA_ROOM_CATEGORIES } from "./dataRoomCategories";
import { DATA_ROOM_CHECKLIST, isChecklistItemSatisfied } from "./dataRoomChecklist";

type Doc = { category: string; title: string; is_active?: boolean };

/** Admin-facing checklist of expected data room documents vs what's uploaded. */
const DataRoomChecklist = ({ docs }: { docs: Doc[] }) => {
  const [open, setOpen] = useState(true);

  const rows = useMemo(
    () =>
      DATA_ROOM_CHECKLIST.map((item) => ({
        ...item,
        done: isChecklistItemSatisfied(item, docs),
      })),
    [docs],
  );

  const requiredTotal = rows.filter((r) => r.required).length;
  const requiredDone = rows.filter((r) => r.required && r.done).length;
  const pct = requiredTotal ? Math.round((requiredDone / requiredTotal) * 100) : 0;

  return (
    <div className="border border-border rounded-md bg-card text-card-foreground">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Upload checklist</p>
          <p className="text-sm mt-1">
            {requiredDone}/{requiredTotal} required documents in place
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-sm tabular-nums text-muted-foreground">{pct}%</span>
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 grid md:grid-cols-2 gap-x-6 gap-y-4">
          {DATA_ROOM_CATEGORIES.map((cat) => {
            const items = rows.filter((r) => r.category === cat.key);
            if (items.length === 0) return null;
            return (
              <div key={cat.key}>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">{cat.label}</p>
                <ul className="space-y-1">
                  {items.map((item) => (
                    <li key={item.label} className="flex items-start gap-2 text-sm">
                      {item.done ? (
                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
                      ) : (
                        <Circle className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                      )}
                      <span className={item.done ? "text-muted-foreground line-through" : ""}>
                        {item.label}
                        {!item.required && (
                          <span className="ml-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                            optional
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DataRoomChecklist;