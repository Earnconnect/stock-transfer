"use client";

import { useEffect, useState } from "react";

// App-launch splash. Rendered server-side so it paints instantly on first load,
// then fades out once the app has mounted (with a short minimum display time so
// it always feels like a real app boot). Does not show on in-app navigations.
export default function Splash() {
  const [hide, setHide] = useState(false);
  const [remove, setRemove] = useState(false);

  useEffect(() => {
    const fade = setTimeout(() => setHide(true), 1000);   // minimum on-screen time
    const drop = setTimeout(() => setRemove(true), 1500); // unmount after the fade
    return () => { clearTimeout(fade); clearTimeout(drop); };
  }, []);

  if (remove) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] grid place-items-center bg-gradient-to-br from-slate-900 via-brand-900 to-brand-800 transition-opacity duration-500 ${hide ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      aria-hidden
    >
      <div className="flex flex-col items-center gap-6 animate-pop">
        <div className="relative grid place-items-center h-24 w-24">
          <span className="absolute -inset-2 rounded-[2rem] ring-2 ring-brand-400/30 animate-ping" />
          <span className="absolute inset-0 rounded-3xl bg-white/10 ring-1 ring-white/20 backdrop-blur" />
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" className="relative h-12 w-12">
            <path d="M3 12l9-9 9 9M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="text-center">
          <div className="text-white font-semibold text-lg tracking-tight">Meridian Transfer</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.25em] text-white/50">Transfer &amp; Custody</div>
        </div>
        <span className="h-5 w-5 rounded-full border-2 border-white/25 border-t-white animate-spin" />
      </div>
    </div>
  );
}
