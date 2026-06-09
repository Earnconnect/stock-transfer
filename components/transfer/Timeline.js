import { stagesFor, progressFor } from "@/lib/settlement";
import { getBrokerage } from "@/lib/data";

function fmt(d) {
  if (!d) return null;
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}
function estimate(base, days) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Renders the 4-stage ACATS progress for a transfer.
export default function Timeline({ transfer }) {
  const rejected = transfer.status === "REJECTED";
  const internal = transfer.method === "INTERNAL";
  const stages = stagesFor(transfer);
  const progress = progressFor(transfer);
  const srcShort = getBrokerage(transfer.source?.brokerage)?.short || "delivering firm";
  const destShort = getBrokerage(transfer.destBrokerage)?.short || "receiving firm";

  // Actual timestamps where we have them, estimates otherwise.
  const stamps = {
    SUBMITTED: fmt(transfer.createdAt),
    APPROVED: fmt(transfer.approvedAt),
    SETTLED: fmt(transfer.settledAt),
  };

  if (rejected) {
    return (
      <div className="rounded-lg bg-rose-50 p-4 ring-1 ring-inset ring-rose-600/20">
        <div className="flex items-center gap-2 text-sm font-semibold text-rose-800">
          <span className="grid place-items-center h-5 w-5 rounded-full bg-rose-500 text-white text-xs">✕</span>
          Transfer rejected
        </div>
        <p className="mt-1 text-xs text-rose-700">
          {transfer.note || "This transfer was rejected by the delivering firm and no assets were moved."}
        </p>
        <div className="mt-2 text-[11px] text-rose-600">Rejected {fmt(transfer.rejectedAt) || ""}</div>
      </div>
    );
  }

  return (
    <ol className="relative ml-3">
      {stages.map((s, i) => {
        const done = i < progress;
        const active = i === progress; // next pending stage = "in progress"
        const note =
          s.key === "APPROVED" ? `${srcShort} validates positions` :
          s.key === "SETTLED" ? `Assets delivered to ${destShort}` : s.note;
        const when =
          s.key === "SUBMITTED" ? stamps.SUBMITTED :
          s.key === "APPROVED" ? (stamps.APPROVED || `Est. ${estimate(transfer.createdAt, 1)}`) :
          s.key === "REGISTERED" ? (done ? "Completed" : `Est. ${estimate(transfer.createdAt, 2)}`) :
          s.key === "SETTLED" ? (stamps.SETTLED || `Est. ${estimate(transfer.createdAt, 3)}`) : null;

        return (
          <li key={s.key} className="relative pl-7 pb-6 last:pb-0 animate-step" style={{ animationDelay: `${i * 110}ms` }}>
            {i < stages.length - 1 && (
              <span className={`absolute left-[7px] top-4 bottom-0 w-0.5 ${done ? "bg-emerald-400" : "bg-slate-200"}`} />
            )}
            <span className={`absolute left-0 top-1 grid place-items-center h-3.5 w-3.5 rounded-full ring-4 ${
              done ? "bg-emerald-500 ring-emerald-100" : active ? "bg-brand-500 ring-brand-100 animate-pulse" : "bg-slate-300 ring-slate-100"
            }`} />
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-sm font-medium ${done ? "text-slate-900" : active ? "text-brand-800" : "text-slate-500"}`}>
                  {s.title}{active && <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-brand-600">In progress</span>}
                </div>
                <div className="text-xs text-slate-400">{note}</div>
              </div>
              <div className="text-xs text-slate-400 whitespace-nowrap">{when}</div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
