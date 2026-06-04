"use client";

import SuccessCheck from "@/components/SuccessCheck";

// A polished full-screen overlay that walks through a list of stages with a
// spinner, then resolves to an animated success checkmark.
//   status: "running" | "success"
//   current: index of the in-progress stage (stages before it render as done)
export default function ProcessingOverlay({ open, title, subtitle, successTitle, successSubtitle, steps = [], current = 0, status = "running" }) {
  if (!open) return null;
  const success = status === "success";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/55 backdrop-blur-sm animate-fade p-4">
      <div className="card w-full max-w-sm p-7 text-center animate-pop">
        <div className="grid place-items-center mb-4">
          {success ? <SuccessCheck /> : <Spinner />}
        </div>

        <h3 className="text-lg font-semibold text-slate-900">{success ? successTitle || "Complete" : title}</h3>
        {(success ? successSubtitle : subtitle) && (
          <p className="mt-1 text-sm text-slate-500">{success ? successSubtitle : subtitle}</p>
        )}

        {/* indeterminate bar while running */}
        {!success && (
          <div className="relative mt-5 h-1 w-full overflow-hidden rounded-full bg-slate-100 progress-indeterminate" />
        )}

        <ul className="mt-5 space-y-2.5 text-left">
          {steps.map((label, i) => {
            const done = success || i < current;
            const active = !success && i === current;
            return (
              <li key={label} className={`flex items-center gap-3 text-sm ${done ? "text-slate-700" : active ? "text-slate-900" : "text-slate-400"}`}>
                <StepIcon done={done} active={active} />
                <span className={active ? "font-medium" : ""}>{label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span className="relative grid place-items-center h-16 w-16">
      <span className="absolute inset-0 rounded-full border-4 border-slate-100" />
      <span className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-600 animate-spin" />
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6 text-brand-600">
        <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 1 1 8 0v4" />
      </svg>
    </span>
  );
}

function StepIcon({ done, active }) {
  if (done) {
    return (
      <span className="grid place-items-center h-5 w-5 rounded-full bg-emerald-500 text-white shrink-0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3"><path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
    );
  }
  if (active) {
    return (
      <span className="grid place-items-center h-5 w-5 shrink-0">
        <span className="h-4 w-4 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
      </span>
    );
  }
  return <span className="grid place-items-center h-5 w-5 shrink-0"><span className="h-2 w-2 rounded-full bg-slate-300" /></span>;
}
