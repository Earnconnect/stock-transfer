// Shared transfer-status presentation (safe for client & server).
export const STATUS_META = {
  PENDING:  { label: "Pending review", tone: "gold",  badge: "bg-amber-50 text-amber-700 ring-amber-600/20", dot: "bg-amber-500" },
  APPROVED: { label: "In transit",     tone: "brand", badge: "bg-brand-50 text-brand-700 ring-brand-600/20", dot: "bg-brand-500" },
  SETTLED:  { label: "Delivered",      tone: "green", badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", dot: "bg-emerald-500" },
  REJECTED: { label: "Rejected",       tone: "rose",  badge: "bg-rose-50 text-rose-700 ring-rose-600/20", dot: "bg-rose-500" },
};

export function statusMeta(status) {
  return STATUS_META[status] || STATUS_META.PENDING;
}
