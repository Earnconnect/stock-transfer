import { statusMeta } from "@/lib/status";

export default function StatusBadge({ status, size = "sm" }) {
  const m = statusMeta(status);
  const pad = size === "lg" ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset ${m.badge} ${pad}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}
