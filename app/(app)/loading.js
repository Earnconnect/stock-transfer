export default function Loading() {
  return (
    <div className="min-h-[70vh] grid place-items-center bg-grid">
      <div className="flex flex-col items-center gap-5">
        <div className="relative grid place-items-center h-20 w-20">
          <span className="absolute inset-0 rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lift" />
          <span className="absolute -inset-1 rounded-[1.6rem] ring-2 ring-brand-400/40 animate-ping" />
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" className="relative h-9 w-9">
            <path d="M3 12l9-9 9 9M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-brand-600 animate-spin" />
          Loading…
        </div>
      </div>
    </div>
  );
}
