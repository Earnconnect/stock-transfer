"use client";

import { useMemo, useState } from "react";
import EligibilityBadge from "@/components/EligibilityBadge";
import BrokerLogo from "@/components/BrokerLogo";
import ProcessingOverlay from "@/components/ProcessingOverlay";
import { Seal } from "@/components/ui";
import { withdrawAction } from "@/app/actions/withdraw";
import { getBrokerage, getIraType, formatMoney, formatMoneyExact } from "@/lib/data";

const WD_STAGES = ["Processing distribution", "Calculating IRS withholding & penalty", "Filing Form 1099-R with the IRS"];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function breakdown(gross, isEarly) {
  const penaltyRate = isEarly ? 0.1 : 0;
  const taxRate = 0.1;
  const penalty = gross * penaltyRate;
  const tax = gross * taxRate;
  return { gross, penaltyRate, penalty, taxRate, tax, net: gross - penalty - tax };
}

export default function WithdrawForm({ accounts = [] }) {
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [cash, setCash] = useState("");
  const [picked, setPicked] = useState({});
  const [isEarly, setEarly] = useState(true);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [proc, setProc] = useState({ open: false, step: 0, status: "running" });
  const submitting = proc.open;

  const account = accounts.find((a) => a.id === accountId) || accounts[0];

  const liquidatedValue = useMemo(
    () => (account?.positions || []).filter((p) => picked[p.symbol]).reduce((s, p) => s + p.price * p.shares, 0),
    [account, picked]
  );
  const cashNum = Math.min(Number(cash) || 0, account?.cashBalance || 0);
  const gross = cashNum + liquidatedValue;
  const b = breakdown(gross, isEarly);

  if (!account) {
    return <div className="card-pad text-center text-sm text-slate-400 py-16">You have no accounts to withdraw from.</div>;
  }

  function toggle(sym) { setPicked((p) => ({ ...p, [sym]: !p[sym] })); }

  async function submit() {
    setError("");
    setProc({ open: true, step: 0, status: "running" });
    const actionP = withdrawAction({
      accountId: account.id,
      cashAmount: cashNum,
      symbols: Object.keys(picked).filter((k) => picked[k]),
      isEarly,
    });
    for (let i = 0; i < WD_STAGES.length; i++) { setProc((p) => ({ ...p, step: i })); await wait(680); }
    const res = await actionP;
    if (res?.error) { setProc({ open: false, step: 0, status: "running" }); setError(res.error); return; }
    setProc((p) => ({ ...p, status: "success" }));
    await wait(1050);
    setProc({ open: false, step: 0, status: "running" });
    setReceipt(res);
  }

  if (receipt) return <Receipt receipt={receipt} account={account} isEarly={isEarly} onReset={() => { setReceipt(null); setCash(""); setPicked({}); }} />;

  const broker = getBrokerage(account.brokerage);

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      {/* left: selection */}
      <div className="lg:col-span-3 space-y-4">
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900">From account</h2>
          <select className="field mt-3" value={accountId} onChange={(e) => { setAccountId(e.target.value); setPicked({}); setCash(""); }}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.label} · ••••{a.accountNumber.slice(-4)} · {formatMoney(a.cashBalance)} cash</option>
            ))}
          </select>

          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Withdraw cash (available {formatMoney(account.cashBalance)})</label>
            <input type="number" min="0" step="any" className="field" value={cash} onChange={(e) => setCash(e.target.value)} placeholder="0.00" />
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-slate-900">Liquidate holdings (optional)</h2>
          <p className="mt-1 text-sm text-slate-500">Selected positions are sold and included in the distribution.</p>
          <div className="mt-3 space-y-2">
            {account.positions.length === 0 && <div className="text-sm text-slate-400">No holdings in this account.</div>}
            {account.positions.map((p) => (
              <label key={p.symbol} className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition ${picked[p.symbol] ? "border-brand-300 bg-brand-50/30" : "border-slate-200 hover:bg-slate-50"}`}>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={!!picked[p.symbol]} onChange={() => toggle(p.symbol)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                  <div>
                    <div className="font-semibold text-slate-900">{p.symbol} <span className="font-normal text-slate-400">· {p.shares} sh</span></div>
                    <div className="text-xs text-slate-400">{p.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <EligibilityBadge assetType={p.assetType} />
                  <span className="font-medium text-slate-900 w-24 text-right tnum">{formatMoney(p.price * p.shares)}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <label className="card p-4 flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={isEarly} onChange={(e) => setEarly(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
          <span className="text-sm text-slate-600">
            <span className="font-medium text-slate-800">This is an early withdrawal (account holder is under age 59½).</span><br />
            The IRS applies a <strong>10% additional tax</strong> on early distributions (IRC § 72(t)), reported on Form 5329.
          </span>
        </label>
      </div>

      {/* right: IRS breakdown */}
      <div className="lg:col-span-2">
        <div className="card overflow-hidden sticky top-20">
          <div className="bg-gradient-to-br from-slate-900 to-brand-900 px-5 py-4 text-white">
            <div className="flex items-center gap-2">
              <BrokerLogo id={account.brokerage} size={28} rounded="rounded-md" />
              <div className="text-sm font-medium">{broker?.short} {getIraType(account.type)?.name}</div>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <Row k="Gross distribution" v={formatMoneyExact(b.gross)} strong />
            <Row k="Federal tax withholding (10%)" v={`– ${formatMoneyExact(b.tax)}`} muted />
            <Row k={`IRS early-withdrawal penalty (${Math.round(b.penaltyRate * 100)}%)`} v={`– ${formatMoneyExact(b.penalty)}`} muted danger={isEarly} />
            <div className="border-t border-slate-200 pt-3">
              <Row k="Net to client" v={formatMoneyExact(b.net)} big />
            </div>

            <div className="rounded-lg bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800 ring-1 ring-inset ring-amber-600/20">
              A <strong>Form 1099-R</strong> reporting this distribution is filed with the IRS. Early withdrawals
              incur a 10% additional tax plus ordinary income tax. This is not tax advice.
            </div>

            {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-600/20">{error}</div>}

            <button onClick={submit} disabled={submitting || gross <= 0} className="btn-primary w-full">
              {submitting ? "Processing…" : `Withdraw ${formatMoney(b.net)}`}
            </button>
          </div>
        </div>
      </div>
    </div>

    <ProcessingOverlay
      open={proc.open}
      status={proc.status}
      current={proc.step}
      steps={WD_STAGES}
      title="Processing your withdrawal"
      subtitle="Filing the IRS distribution report…"
      successTitle="Withdrawal processed"
      successSubtitle="Funds are on the way."
    />
    </>
  );
}

function Receipt({ receipt, account, isEarly, onReset }) {
  return (
    <div className="space-y-4 max-w-2xl animate-fade-up">
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-brand-800 to-brand-600 px-5 py-6 sm:px-6 sm:py-7 text-white">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center h-11 w-11 shrink-0 rounded-full bg-white/15 ring-1 ring-white/30 animate-pop">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-6 w-6"><path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <div>
              <h2 className="text-lg font-semibold">Withdrawal processed</h2>
              <p className="text-sm text-white/80">Funds are on the way; the IRS distribution report has been filed.</p>
            </div>
            <div className="ml-auto text-right">
              <div className="text-[11px] uppercase tracking-wider text-white/60">Reference</div>
              <div className="font-mono font-semibold">{receipt.reference}</div>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-3">
          <Row k="Gross distribution" v={formatMoneyExact(receipt.gross)} strong />
          <Row k="Federal tax withholding (10%)" v={`– ${formatMoneyExact(receipt.tax)}`} muted />
          <Row k={`IRS early-withdrawal penalty (${Math.round(receipt.penaltyRate * 100)}%)`} v={`– ${formatMoneyExact(receipt.penalty)}`} muted danger={isEarly} />
          <div className="border-t border-slate-200 pt-3"><Row k="Net disbursed" v={formatMoneyExact(receipt.net)} big /></div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">📄</span>
          <div className="font-semibold text-slate-900">IRS reporting</div>
          <Seal tone="green">Received by IRS</Seal>
        </div>
        <dl className="mt-3 space-y-2 text-sm">
          <Row k="Form 1099-R (Distributions)" v={receipt.form1099R} mono />
          {isEarly && <Row k="Form 5329 (10% additional tax)" v="Filed" />}
          <Row k="Withholding remitted to IRS" v={formatMoneyExact(receipt.tax + receipt.penalty)} />
        </dl>
      </div>

      <div className="flex gap-2">
        <a href="/ira" className="btn-ghost">View accounts</a>
        <button onClick={onReset} className="btn-primary">New withdrawal</button>
      </div>
    </div>
  );
}

function Row({ k, v, strong, muted, big, danger, mono }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${danger ? "text-rose-600" : "text-slate-500"}`}>{k}</span>
      <span className={`tnum ${big ? "text-xl font-bold text-slate-900" : strong ? "font-semibold text-slate-900" : muted ? "text-slate-600" : "text-slate-800"} ${mono ? "font-mono text-sm" : ""}`}>{v}</span>
    </div>
  );
}
