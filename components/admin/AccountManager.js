"use client";

import { useState, useTransition } from "react";
import { addFunds, addHolding, removeHolding } from "@/app/actions/admin";

function money(n) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function AccountManager({ account, catalog }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [symbol, setSymbol] = useState("");
  const [shares, setShares] = useState("");
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  const run = (fn) => { setMsg(""); start(async () => { const r = await fn(); if (r?.error) setMsg(r.error); }); };

  return (
    <>
      <button onClick={() => setOpen((o) => !o)} className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">
        {open ? "Close" : "Manage"}
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-4 text-left">
          {msg && <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-inset ring-rose-600/20">{msg}</div>}

          {/* Funds */}
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-1.5">Funds · current cash {money(account.cashBalance)}</div>
            <div className="flex items-center gap-2">
              <input type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (use − to withdraw)" className="field" />
              <button disabled={pending} onClick={() => run(async () => { const r = await addFunds(account.id, Number(amount)); if (!r?.error) setAmount(""); return r; })}
                className="btn-primary !px-4 !py-2 text-xs whitespace-nowrap">Apply</button>
            </div>
            <div className="mt-1.5 flex gap-1.5">
              {[1000, 5000, 25000].map((v) => (
                <button key={v} disabled={pending} onClick={() => run(() => addFunds(account.id, v))} className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50">+{money(v)}</button>
              ))}
            </div>
          </div>

          {/* Add holding */}
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-1.5">Add holding</div>
            <div className="flex items-center gap-2">
              <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="field">
                <option value="">Select security…</option>
                {catalog.map((s) => <option key={s.symbol} value={s.symbol}>{s.symbol} — {s.name}</option>)}
              </select>
              <input type="number" min="0" step="any" value={shares} onChange={(e) => setShares(e.target.value)} placeholder="Shares" className="field w-28" />
              <button disabled={pending} onClick={() => run(async () => { const r = await addHolding(account.id, symbol, Number(shares)); if (!r?.error) { setSymbol(""); setShares(""); } return r; })}
                className="btn-primary !px-4 !py-2 text-xs">Add</button>
            </div>
          </div>

          {/* Existing holdings with remove */}
          {account.positions.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-1.5">Holdings</div>
              <ul className="space-y-1">
                {account.positions.map((p) => (
                  <li key={p.id} className="flex items-center justify-between rounded-md bg-white px-3 py-1.5 ring-1 ring-slate-200">
                    <span className="text-sm text-slate-700"><span className="font-medium">{p.symbol}</span> · {p.shares} sh</span>
                    <button disabled={pending} onClick={() => run(() => removeHolding(p.id))} className="text-xs font-medium text-rose-600 hover:text-rose-700">Remove</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </>
  );
}
