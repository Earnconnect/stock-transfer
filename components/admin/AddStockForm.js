"use client";

import { useState, useTransition } from "react";
import { addStock } from "@/app/actions/admin";

const ASSET_TYPES = [
  { id: "stock", label: "Stock" },
  { id: "etf", label: "ETF" },
  { id: "mutual_fund", label: "Mutual Fund" },
  { id: "bond", label: "Bond" },
  { id: "commodity_etf", label: "Commodity ETF" },
  { id: "collectible", label: "Collectible" },
  { id: "life_insurance", label: "Life Insurance" },
  { id: "crypto", label: "Crypto" },
];

const EMPTY = { symbol: "", name: "", sector: "", assetType: "stock", price: "", change: "", available: "" };

export default function AddStockForm() {
  const [f, setF] = useState(EMPTY);
  const [msg, setMsg] = useState(null);
  const [pending, start] = useTransition();
  const set = (patch) => setF((p) => ({ ...p, ...patch }));

  function submit() {
    setMsg(null);
    start(async () => {
      const res = await addStock(f);
      if (res?.error) setMsg({ error: res.error });
      else { setMsg({ ok: `Added ${f.symbol.toUpperCase()} to the catalog.` }); setF(EMPTY); }
    });
  }

  return (
    <div className="card p-5">
      <h2 className="font-semibold text-slate-900">Add a security</h2>
      <p className="mt-1 text-sm text-slate-500">New securities become available to all users for holdings and transfers.</p>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Field label="Symbol"><input className="field font-mono uppercase" value={f.symbol} onChange={(e) => set({ symbol: e.target.value })} placeholder="TSLA" /></Field>
        <Field label="Name" wide><input className="field" value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="Tesla Inc." /></Field>
        <Field label="Sector"><input className="field" value={f.sector} onChange={(e) => set({ sector: e.target.value })} placeholder="Technology" /></Field>
        <Field label="Asset type">
          <select className="field" value={f.assetType} onChange={(e) => set({ assetType: e.target.value })}>
            {ASSET_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </Field>
        <Field label="Price (USD)"><input type="number" min="0" step="any" className="field" value={f.price} onChange={(e) => set({ price: e.target.value })} placeholder="250.00" /></Field>
        <Field label="24h change %"><input type="number" step="any" className="field" value={f.change} onChange={(e) => set({ change: e.target.value })} placeholder="1.5" /></Field>
        <Field label="Bulk available"><input type="number" min="0" step="1" className="field" value={f.available} onChange={(e) => set({ available: e.target.value })} placeholder="10000" /></Field>
      </div>

      {msg?.error && <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-600/20">{msg.error}</div>}
      {msg?.ok && <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-inset ring-emerald-600/20">{msg.ok}</div>}

      <div className="mt-4 flex justify-end">
        <button onClick={submit} disabled={pending} className="btn-primary">{pending ? "Adding…" : "Add security"}</button>
      </div>
    </div>
  );
}

function Field({ label, wide, children }) {
  return (
    <label className={`block ${wide ? "col-span-2" : ""}`}>
      <span className="block text-xs font-medium text-slate-600 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
