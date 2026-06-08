"use client";

import { useState, useTransition } from "react";
import { setInsurancePlan } from "@/app/actions/admin";

export default function InsurancePlanEditor({ plan }) {
  const [price, setPrice] = useState(String(plan.price));
  const [active, setActive] = useState(plan.active);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");

  const dirty = Number(price) !== plan.price || active !== plan.active;

  function save() {
    setMsg("");
    start(async () => {
      const res = await setInsurancePlan(plan.id, price, active);
      setMsg(res?.error ? res.error : "Saved");
      if (!res?.error) setTimeout(() => setMsg(""), 2000);
    });
  }

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-slate-900">{plan.name}</div>
          <p className="mt-0.5 text-xs text-slate-500 max-w-md">{plan.blurb}</p>
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-slate-600 shrink-0">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
          {active ? "Active" : "Hidden"}
        </label>
      </div>

      <div className="mt-4 flex items-end gap-3">
        <label className="block">
          <span className="block text-xs font-medium text-slate-600 mb-1.5">Price (USD)</span>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
            <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="field pl-6 w-36" />
          </div>
        </label>
        <button onClick={save} disabled={pending || !dirty} className="btn-primary">{pending ? "Saving…" : "Save"}</button>
        {msg && <span className={`text-xs font-medium ${msg === "Saved" ? "text-emerald-600" : "text-rose-600"}`}>{msg}</span>}
      </div>
    </div>
  );
}
