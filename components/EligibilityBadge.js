import { getEligibility, statusMeta } from "@/lib/irs";

export default function EligibilityBadge({ assetType, showReason = false }) {
  const elig = getEligibility(assetType);
  const meta = statusMeta(assetType);
  return (
    <span
      title={elig.reason}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${meta.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
      {showReason && <span className="font-normal text-slate-500"> · {elig.reason}</span>}
    </span>
  );
}
