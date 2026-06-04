"use client";

import { useState, useTransition } from "react";
import { updateStock, toggleStock } from "@/app/actions/admin";

export default function StockRowActions({ id, active, price }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(price);
  const [pending, start] = useTransition();

  function savePrice() {
    start(async () => { await updateStock(id, { price: val }); setEditing(false); });
  }
  function toggle() {
    start(async () => { await toggleStock(id, !active); });
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      {editing ? (
        <>
          <input type="number" step="any" min="0" value={val} onChange={(e) => setVal(e.target.value)}
            className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm text-right" />
          <button disabled={pending} onClick={savePrice} className="rounded-md bg-brand-700 px-2 py-1 text-xs font-semibold text-white hover:bg-brand-800 disabled:opacity-50">Save</button>
          <button onClick={() => { setEditing(false); setVal(price); }} className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-500">Cancel</button>
        </>
      ) : (
        <>
          <button onClick={() => setEditing(true)} className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">Edit price</button>
          <button disabled={pending} onClick={toggle}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold disabled:opacity-50 ${active ? "border border-slate-200 text-slate-600 hover:bg-slate-50" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}>
            {active ? "Unlist" : "List"}
          </button>
        </>
      )}
    </div>
  );
}
