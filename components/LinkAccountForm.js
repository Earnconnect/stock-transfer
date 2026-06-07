"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BrokerLogo from "@/components/BrokerLogo";
import ProcessingOverlay from "@/components/ProcessingOverlay";
import { Seal, LockIcon } from "@/components/ui";
import { linkAccountAction } from "@/app/actions/account";
import { BROKERAGES, IRA_TYPES, formatMoney } from "@/lib/data";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function LinkAccountForm({ defaultHolder = "", catalog = [] }) {
  const router = useRouter();
  const stockMap = Object.fromEntries(catalog.map((s) => [s.symbol, s]));
  const getStock = (sym) => stockMap[sym];
  const [brokerage, setBrokerage] = useState("");
  const [type, setType] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [holder, setHolder] = useState(defaultHolder);
  const [rows, setRows] = useState([{ symbol: "", shares: "" }]);
  const [error, setError] = useState("");
  const [proc, setProc] = useState({ open: false, step: 0, status: "running" });
  const pending = proc.open;

  const broker = BROKERAGES.find((b) => b.id === brokerage);
  const estValue = rows.reduce((s, r) => {
    const st = getStock(r.symbol);
    return s + (st ? st.price * (Number(r.shares) || 0) : 0);
  }, 0);

  function setRow(i, patch) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function addRow() { setRows((rs) => [...rs, { symbol: "", shares: "" }]); }
  function removeRow(i) { setRows((rs) => rs.filter((_, idx) => idx !== i)); }

  const LINK_STAGES = [
    `Connecting to ${broker?.short || "brokerage"}`,
    "Importing account holdings",
    "Securing read-only connection",
  ];

  async function submit() {
    setError("");
    if (!brokerage) return setError("Choose a brokerage to link.");
    if (!type) return setError("Choose the account type.");
    if (accountNumber.trim().length < 3) return setError("Enter a valid account number.");
    if (holder.trim().length < 2) return setError("Enter the account holder name.");

    setProc({ open: true, step: 0, status: "running" });
    const actionP = linkAccountAction({
      brokerage, type, accountNumber, holder,
      positions: rows.filter((r) => r.symbol && Number(r.shares) > 0),
    });
    for (let i = 0; i < LINK_STAGES.length; i++) { setProc((p) => ({ ...p, step: i })); await wait(650); }
    const res = await actionP;
    if (res?.error) { setProc({ open: false, step: 0, status: "running" }); setError(res.error); return; }
    setProc((p) => ({ ...p, status: "success" }));
    await wait(1050);
    router.push("/ira");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 sm:p-6">
        <h2 className="font-semibold text-slate-900">Account to link</h2>
        <p className="mt-1 text-sm text-slate-500">Connect an existing brokerage account so you can transfer to and from it.</p>

        {/* Brokerage picker */}
        <div className="mt-5">
          <span className="block text-xs font-medium text-slate-600 mb-2">Brokerage <span className="text-rose-500">*</span></span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {BROKERAGES.map((b) => (
              <button key={b.id} type="button" onClick={() => setBrokerage(b.id)}
                className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition ${brokerage === b.id ? "border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/40" : "border-slate-200 hover:bg-slate-50"}`}>
                <BrokerLogo id={b.id} size={32} rounded="rounded-md" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{b.short}</div>
                  <div className="text-[10px] text-slate-400">DTC #{b.dtc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1.5">Account type <span className="text-rose-500">*</span></span>
            <select className="field" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Select type…</option>
              {IRA_TYPES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1.5">Account number <span className="text-rose-500">*</span></span>
            <input className="field font-mono" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="e.g. 5538-91402" />
          </label>
          <label className="block sm:col-span-2">
            <span className="block text-xs font-medium text-slate-600 mb-1.5">Account holder <span className="text-rose-500">*</span></span>
            <input className="field" value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="Full legal name" />
          </label>
        </div>
      </div>

      {/* Holdings */}
      <div className="card p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Current holdings</h2>
            <p className="mt-1 text-sm text-slate-500">Add the positions held in this account (optional, but needed to transfer them).</p>
          </div>
          <div className="text-right">
            <div className="label-xs">Est. value</div>
            <div className="font-semibold text-slate-900 tnum">{formatMoney(estValue)}</div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {rows.map((r, i) => {
            const st = getStock(r.symbol);
            return (
              <div key={i} className="flex items-center gap-2 animate-step" style={{ animationDelay: `${i * 40}ms` }}>
                <select className="field" value={r.symbol} onChange={(e) => setRow(i, { symbol: e.target.value })}>
                  <option value="">Select security…</option>
                  {catalog.map((s) => <option key={s.symbol} value={s.symbol}>{s.symbol} — {s.name}</option>)}
                </select>
                <input type="number" min="0" step="any" className="field w-28" value={r.shares} onChange={(e) => setRow(i, { shares: e.target.value })} placeholder="Shares" />
                <span className="w-24 text-right text-sm text-slate-500 tnum">{st && r.shares ? formatMoney(st.price * Number(r.shares)) : ""}</span>
                <button type="button" onClick={() => removeRow(i)} className="grid place-items-center h-9 w-9 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition" title="Remove">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
                </button>
              </div>
            );
          })}
        </div>
        <button type="button" onClick={addRow} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800">
          <span className="text-lg leading-none">+</span> Add holding
        </button>
      </div>

      {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-600/20">{error}</div>}

      <div className="flex items-center gap-3">
        <Seal tone="slate"><LockIcon /> Read-only connection</Seal>
        {broker && <Seal tone="green">Linking to {broker.short}</Seal>}
        <div className="ml-auto flex items-center gap-2">
          <a href="/ira" className="btn-ghost">Cancel</a>
          <button onClick={submit} disabled={pending} className="btn-primary">{pending ? "Linking…" : "Link account"}</button>
        </div>
      </div>

      <p className="text-[11px] text-slate-400">
        Demonstration only — accounts and holdings you enter are simulated. A production build would connect
        securely via an aggregator (e.g. Plaid or SnapTrade) instead of manual entry.
      </p>

      <ProcessingOverlay
        open={proc.open}
        status={proc.status}
        current={proc.step}
        steps={LINK_STAGES}
        title="Linking your account"
        subtitle="Establishing a secure connection…"
        successTitle="Account linked"
        successSubtitle="Your holdings are now available."
      />
    </div>
  );
}
