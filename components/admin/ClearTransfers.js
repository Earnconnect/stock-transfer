"use client";

import { useState, useTransition } from "react";
import { deleteAllTransfers } from "@/app/actions/admin";

export default function ClearTransfers({ count = 0 }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");

  function clearAll() {
    if (!window.confirm(`Delete ALL ${count} transfer records? This permanently removes the entire transfer history and cannot be undone.`)) return;
    setErr("");
    start(async () => {
      const res = await deleteAllTransfers();
      if (res?.error) setErr(res.error);
    });
  }

  if (count === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {err && <span className="text-xs text-rose-600">{err}</span>}
      <button onClick={clearAll} disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        </svg>
        {pending ? "Clearing…" : "Clear all history"}
      </button>
    </div>
  );
}
