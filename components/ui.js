// Lightweight presentational primitives shared across pages.

export function Card({ className = "", children }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      {action}
    </div>
  );
}

export function Stat({ label, value, hint, accent }) {
  return (
    <div className="card-pad relative overflow-hidden">
      {accent && <span className="absolute inset-x-0 top-0 h-0.5 bg-brand-600" />}
      <div className="label-xs truncate">{label}</div>
      <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-semibold text-slate-900 tnum truncate">{value}</div>
      {hint && <div className="mt-1 text-[11px] sm:text-xs text-slate-400 truncate">{hint}</div>}
    </div>
  );
}

// Small trust/seal chip, e.g. "256-bit TLS", "SIPC", "ACATS".
export function Seal({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-600 ring-slate-500/15",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    brand: "bg-brand-50 text-brand-700 ring-brand-600/20",
    gold: "bg-amber-50 text-amber-800 ring-amber-600/20",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function LockIcon({ className = "h-3.5 w-3.5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 1 1 8 0v4" />
    </svg>
  );
}

export function ShieldCheck({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3l7 4v5c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V7l7-4z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
