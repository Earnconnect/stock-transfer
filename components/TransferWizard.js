"use client";

import { useState } from "react";
import EligibilityBadge from "@/components/EligibilityBadge";
import BrokerLogo from "@/components/BrokerLogo";
import ProcessingOverlay from "@/components/ProcessingOverlay";
import { Seal, LockIcon, ShieldCheck } from "@/components/ui";
import { createTransferAction } from "@/app/actions/transfer";

const STAGES_INTERNAL = ["Validating your accounts", "Moving assets between accounts", "Confirming settlement"];
const STAGES_EXTERNAL = ["Validating positions for transfer", "Filing ACATS request (TIF)", "Submitting to NSCC / DTCC"];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
import {
  BROKERAGES,
  FREE_INSURANCE_LIMIT,
  insurancePlanName,
  getBrokerage,
  getIraType,
  positionValue,
  formatMoney,
  formatMoneyExact,
} from "@/lib/data";
import { isApproved } from "@/lib/irs";

const STEPS = ["Source", "Holdings", "Method", "Destination", "Authorize", "Submitted"];

export default function TransferWizard({ accounts = [], insurancePlans = [] }) {
  const [step, setStep] = useState(0);
  const [sourceId, setSourceId] = useState(accounts[0]?.id || "");
  const [selected, setSelected] = useState({});
  const [transferType, setTransferType] = useState("full"); // full | partial
  const [method, setMethod] = useState(""); // internal | external
  const [destId, setDestId] = useState(""); // external brokerage
  const [destAccountId, setDestAccountId] = useState(""); // internal account
  const [recipient, setRecipient] = useState({ holder: "", account: "", type: "", authorize: false, signature: "" });
  const [insurance, setInsurance] = useState("none");
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState(null);
  const [proc, setProc] = useState({ open: false, step: 0, status: "running" });
  const submitting = proc.open;

  const source = accounts.find((a) => a.id === sourceId) || accounts[0];

  if (!source) {
    return (
      <main className="bg-grid min-h-full">
        <div className="p-6 max-w-4xl mx-auto">
          <div className="card-pad text-center text-sm text-slate-400 py-16">
            You have no IRA accounts to transfer from yet.
          </div>
        </div>
      </main>
    );
  }

  const isInternal = method === "internal";
  const others = accounts.filter((a) => a.id !== source.id);
  const destAccount = isInternal ? accounts.find((a) => a.id === destAccountId) : null;
  const destBroker = isInternal ? getBrokerage(destAccount?.brokerage) : getBrokerage(destId);

  // Effective recipient details (auto from account for internal, manual for external).
  const recip = isInternal
    ? { holder: destAccount?.holder || "", account: destAccount?.accountNumber || "", type: destAccount?.type || "" }
    : recipient;

  const selectedPositions =
    transferType === "full" ? source.positions : source.positions.filter((p) => selected[p.symbol]);
  const transferValue = selectedPositions.reduce((sum, p) => sum + positionValue(p), 0);
  const hasIneligible = selectedPositions.some((p) => !isApproved(p.assetType));
  const selectedPlan = insurancePlans.find((p) => p.id === insurance);
  const premium = selectedPlan ? selectedPlan.price : 0;
  // Insurance rules: transfers over the free limit must be insured; if a plan is
  // chosen its premium must be payable from the source account's cash.
  const freeAllowed = transferValue <= FREE_INSURANCE_LIMIT;
  const sourceCash = source?.cashBalance || 0;
  const premiumPayable = insurance === "none" ? true : sourceCash >= premium;
  const insuranceValid = (insurance !== "none" || freeAllowed) && premiumPayable;

  function toggle(symbol) {
    setSelected((prev) => ({ ...prev, [symbol]: !prev[symbol] }));
  }
  function setR(patch) {
    setRecipient((prev) => ({ ...prev, ...patch }));
  }
  function reset() {
    setStep(0); setSelected({}); setMethod(""); setDestId(""); setDestAccountId("");
    setTransferType("full"); setRecipient({ holder: "", account: "", type: "", authorize: false, signature: "" });
    setInsurance("none"); setResult(null); setSubmitError("");
  }

  const recipientValid = recipient.holder.trim().length > 2 && recipient.account.trim().length >= 4 && recipient.type;
  const destValid = isInternal ? !!destAccountId : !!destId && recipientValid;
  const authorizeValid =
    recipient.authorize && recipient.signature.trim().toLowerCase() === recip.holder.trim().toLowerCase();

  const canNext =
    (step === 0 && source) ||
    (step === 1 && selectedPositions.length > 0) ||
    (step === 2 && method && (method === "external" || others.length > 0)) ||
    (step === 3 && destValid) ||
    (step === 4 && authorizeValid && insuranceValid);

  function next() {
    if (step === 2 && method === "external") {
      // prefill recipient for external on first entry
      setRecipient((r) => ({ ...r, holder: r.holder || source.holder, type: r.type || source.type }));
    }
    if (step === 4) return submit();
    setStep((s) => Math.min(5, s + 1));
  }

  const procStages = isInternal ? STAGES_INTERNAL : STAGES_EXTERNAL;

  async function submit() {
    setSubmitError("");
    setProc({ open: true, step: 0, status: "running" });
    const actionP = createTransferAction({
      sourceAccountId: source.id,
      method: isInternal ? "INTERNAL" : "EXTERNAL",
      transferType: transferType === "full" ? "FULL" : "PARTIAL",
      symbols: selectedPositions.map((p) => p.symbol),
      destAccountId: isInternal ? destAccountId : undefined,
      destBrokerage: isInternal ? undefined : destId,
      recipient: isInternal ? undefined : { holder: recipient.holder, account: recipient.account, type: recipient.type },
      insurance,
    });
    for (let i = 0; i < procStages.length; i++) {
      setProc((p) => ({ ...p, step: i }));
      await wait(650);
    }
    const res = await actionP;
    if (res?.error) {
      setProc({ open: false, step: 0, status: "running" });
      setSubmitError(res.error);
      return;
    }
    setResult(res);
    setProc((p) => ({ ...p, status: "success" }));
    await wait(1000);
    setProc({ open: false, step: 0, status: "running" });
    setStep(5);
  }

  return (
    <main className="bg-grid min-h-full">
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        {/* Secure header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center h-10 w-10 rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-600/15">
              <LockIcon className="h-5 w-5" />
            </span>
            <div>
              <div className="font-semibold text-slate-900">Secure asset transfer</div>
              <div className="text-xs text-slate-500">Bank-grade encryption · {step >= 2 ? (isInternal ? "Instant on-platform settlement" : "ACATS-compliant settlement") : "Internal & ACATS transfers"}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Seal tone="slate"><LockIcon /> 256-bit TLS</Seal>
            <Seal tone="green">SIPC</Seal>
            <Seal tone="slate">ACATS / NSCC</Seal>
          </div>
        </div>

        {/* Stepper */}
        <ol className="flex items-center w-full mb-8">
          {STEPS.map((label, i) => (
            <li key={label} className={`flex items-center ${i < STEPS.length - 1 ? "w-full" : ""}`}>
              <div className="flex flex-col items-center">
                <span className={`grid place-items-center h-8 w-8 rounded-full text-xs font-semibold transition ${
                  i < step ? "bg-emerald-500 text-white" : i === step ? "bg-brand-700 text-white ring-4 ring-brand-100" : "bg-slate-200 text-slate-500"
                }`}>{i < step ? "✓" : i + 1}</span>
                <span className={`mt-1.5 text-[11px] font-medium hidden sm:block ${i === step ? "text-brand-800" : "text-slate-400"}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 mb-0 sm:mb-5 ${i < step ? "bg-emerald-500" : "bg-slate-200"}`} />}
            </li>
          ))}
        </ol>

        <div key={step} className="animate-fade-up">
          {/* STEP 0 — source */}
          {step === 0 && (
            <Card title="Select originating account" desc="Choose the IRA you are transferring assets out of (the delivering account).">
              <div className="space-y-3">
                {accounts.map((acc) => {
                  const type = getIraType(acc.type);
                  const broker = getBrokerage(acc.brokerage);
                  const active = acc.id === sourceId;
                  return (
                    <button key={acc.id} onClick={() => { setSourceId(acc.id); setSelected({}); setDestAccountId(""); }}
                      className={`w-full flex items-center justify-between rounded-xl border p-4 text-left transition ${active ? "border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/40" : "border-slate-200 hover:bg-slate-50"}`}>
                      <div className="flex items-center gap-3">
                        <BrokerLogo id={acc.brokerage} />
                        <div>
                          <div className="font-medium text-slate-900">{acc.label}</div>
                          <div className="text-xs text-slate-400">{type.name} · {broker.name} · ••••{acc.accountNumber.slice(-4)}</div>
                        </div>
                      </div>
                      <span className="font-semibold text-slate-900 tnum">{formatMoney(acc.positions.reduce((s, p) => s + positionValue(p), 0))}</span>
                    </button>
                  );
                })}
              </div>
            </Card>
          )}

          {/* STEP 1 — holdings */}
          {step === 1 && (
            <Card title="What would you like to transfer?" desc="A full transfer moves the entire account. A partial transfer moves only the assets you select.">
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[{ id: "full", t: "Full Transfer", d: "Move all positions and close the account" }, { id: "partial", t: "Partial Transfer", d: "Select specific positions to move" }].map((o) => (
                  <button key={o.id} onClick={() => setTransferType(o.id)}
                    className={`rounded-xl border p-4 text-left transition ${transferType === o.id ? "border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/40" : "border-slate-200 hover:bg-slate-50"}`}>
                    <div className="flex items-center gap-2">
                      <Radio on={transferType === o.id} /><span className="font-semibold text-slate-900 text-sm">{o.t}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500 pl-6">{o.d}</div>
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {source.positions.map((p) => {
                  const checked = transferType === "full" ? true : !!selected[p.symbol];
                  const disabled = transferType === "full";
                  return (
                    <label key={p.symbol} className={`flex items-center justify-between rounded-lg border p-4 transition ${disabled ? "cursor-default" : "cursor-pointer"} ${checked ? "border-brand-300 bg-brand-50/30" : "border-slate-200 hover:bg-slate-50"}`}>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggle(p.symbol)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                        <div>
                          <div className="font-semibold text-slate-900">{p.symbol} <span className="font-normal text-slate-400">· {p.shares} sh</span></div>
                          <div className="text-xs text-slate-400">{p.name}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <EligibilityBadge assetType={p.assetType} />
                        <span className="font-medium text-slate-900 w-24 text-right tnum">{formatMoney(positionValue(p))}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
              {hasIneligible && (
                <div className="mt-4 flex gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 ring-1 ring-inset ring-amber-600/20">
                  <span>⚠</span><span>One or more assets are not IRA-eligible. The receiving custodian may reject or require liquidation before settlement.</span>
                </div>
              )}
            </Card>
          )}

          {/* STEP 2 — method */}
          {step === 2 && (
            <Card title="How are you transferring?" desc="Choose whether this stays within your own accounts or goes to another firm.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MethodCard
                  active={method === "internal"} disabled={others.length === 0}
                  onClick={() => others.length && setMethod("internal")}
                  icon="internal" title="Internal transfer"
                  desc="Move assets between your own linked accounts on Meridian. Settles instantly."
                  tag="Instant"
                  foot={others.length === 0 ? "Requires a second linked account" : `${others.length} eligible account${others.length === 1 ? "" : "s"}`}
                />
                <MethodCard
                  active={method === "external"} onClick={() => setMethod("external")}
                  icon="external" title="External transfer"
                  desc="Send assets to an account at another brokerage via the ACATS network."
                  tag="ACATS"
                  foot="Reviewed & settled in 1–7 business days"
                />
              </div>
            </Card>
          )}

          {/* STEP 3 — destination (branched) */}
          {step === 3 && isInternal && (
            <Card title="Select receiving account" desc="Choose which of your accounts should receive these assets.">
              <div className="space-y-3">
                {others.map((acc) => {
                  const type = getIraType(acc.type);
                  const broker = getBrokerage(acc.brokerage);
                  const active = acc.id === destAccountId;
                  return (
                    <button key={acc.id} onClick={() => setDestAccountId(acc.id)}
                      className={`w-full flex items-center justify-between rounded-xl border p-4 text-left transition ${active ? "border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/40" : "border-slate-200 hover:bg-slate-50"}`}>
                      <div className="flex items-center gap-3">
                        <BrokerLogo id={acc.brokerage} />
                        <div>
                          <div className="font-medium text-slate-900">{acc.label}</div>
                          <div className="text-xs text-slate-400">{type.name} · {broker.name} · ••••{acc.accountNumber.slice(-4)}</div>
                        </div>
                      </div>
                      {active && <ShieldCheck className="h-5 w-5 text-brand-600" />}
                    </button>
                  );
                })}
              </div>
              {destAccount && destAccount.type !== source.type && (
                <div className="mt-4 flex gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 ring-1 ring-inset ring-amber-600/20">
                  <span>⚠</span>
                  <span>Moving a <strong>{getIraType(source.type).name}</strong> into a <strong>{getIraType(destAccount.type).name}</strong> may be a taxable conversion. Confirm with your tax advisor.</span>
                </div>
              )}
            </Card>
          )}

          {step === 3 && !isInternal && (
            <Card title="Where are you transferring to?" desc="Select the receiving brokerage and enter the destination account details." badge={destBroker && <Seal tone="brand">DTC #{destBroker.dtc}</Seal>}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BROKERAGES.map((b) => {
                  const isSrc = b.id === source.brokerage;
                  const active = b.id === destId;
                  return (
                    <button key={b.id} disabled={isSrc} onClick={() => setDestId(b.id)}
                      className={`flex items-center gap-3 rounded-xl border p-4 text-left transition disabled:opacity-40 disabled:cursor-not-allowed ${active ? "border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/40" : "border-slate-200 hover:bg-slate-50"}`}>
                      <BrokerLogo id={b.id} size={40} />
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 text-sm truncate">{b.name}</div>
                        <div className="text-[11px] text-slate-400">{isSrc ? "Current account" : `DTC #${b.dtc} · ${b.est}`}</div>
                      </div>
                      {active && <ShieldCheck className="ml-auto h-5 w-5 text-brand-600" />}
                    </button>
                  );
                })}
              </div>

              {destId && (
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200 mb-4">
                    <BrokerLogo id={destBroker.id} size={40} />
                    <div>
                      <div className="font-semibold text-slate-900">{destBroker.name}</div>
                      <div className="text-xs text-slate-500">Clearing: {destBroker.clearing} · DTC #{destBroker.dtc}</div>
                    </div>
                    {destBroker.sipc && <span className="ml-auto"><Seal tone="green">SIPC Member</Seal></span>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Account holder name" required>
                      <input className="field" value={recipient.holder} onChange={(e) => setR({ holder: e.target.value })} placeholder="Full legal name" />
                    </Field>
                    <Field label={`Account number at ${destBroker.short}`} required>
                      <input className="field font-mono tracking-wide" value={recipient.account} onChange={(e) => setR({ account: e.target.value })} placeholder="e.g. 5538-91402" />
                    </Field>
                    <Field label="Receiving account type" required hint="Should match the originating account to avoid a taxable event.">
                      <select className="field" value={recipient.type} onChange={(e) => setR({ type: e.target.value })}>
                        <option value="">Select type…</option>
                        {["traditional", "roth", "sep", "rollover"].map((t) => <option key={t} value={t}>{getIraType(t).name}</option>)}
                      </select>
                    </Field>
                    <Field label="DTC clearing number" hint="Auto-filled from the receiving firm.">
                      <input className="field bg-slate-50 font-mono" value={destBroker.dtc} readOnly />
                    </Field>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* STEP 4 — authorize */}
          {step === 4 && (
            <div className="space-y-4">
              <Card title="Review & authorize" desc={isInternal ? "Confirm this internal transfer between your accounts." : "Confirm the details, then sign to submit your ACATS Transfer Initiation Form (TIF)."}
                badge={<Seal tone={isInternal ? "brand" : "gold"}>{isInternal ? "Internal · Instant" : "External · ACATS"}</Seal>}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Panel title="From (delivering)">
                    <Line k="Account" v={source.label} />
                    <Line k="Number" v={`••••${source.accountNumber.slice(-4)}`} mono />
                    <Line k="Type" v={getIraType(source.type).name} />
                  </Panel>
                  <Panel title="To (receiving)">
                    <Line k={isInternal ? "Account" : "Firm"} v={isInternal ? destAccount.label : destBroker.name} />
                    <Line k="Number" v={recip.account} mono />
                    <Line k="Holder" v={recip.holder} />
                    {!isInternal && <Line k="DTC" v={destBroker.dtc} mono />}
                  </Panel>
                </div>

                <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                  <table className="min-w-full text-sm">
                    <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-2 font-medium">Security</th><th className="px-4 py-2 font-medium">Qty</th><th className="px-4 py-2 font-medium text-right">Value</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedPositions.map((p) => (
                        <tr key={p.symbol}>
                          <td className="px-4 py-2.5"><span className="font-medium text-slate-900">{p.symbol}</span> <span className="text-slate-400">{p.name}</span></td>
                          <td className="px-4 py-2.5 text-slate-500 tnum">{p.shares}</td>
                          <td className="px-4 py-2.5 text-right font-medium text-slate-900 tnum">{formatMoney(positionValue(p))}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr className="bg-slate-50 border-t border-slate-200">
                      <td className="px-4 py-2.5 font-semibold text-slate-900" colSpan={2}>{transferType === "full" ? "Full" : "Partial"} · {selectedPositions.length} positions</td>
                      <td className="px-4 py-2.5 text-right font-bold text-slate-900 tnum">{formatMoneyExact(transferValue)}</td>
                    </tr></tfoot>
                  </table>
                </div>

                {/* What happens next */}
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">What happens next</div>
                    <Seal tone={isInternal ? "brand" : "gold"}>{isInternal ? "Est. instant" : `Est. ${destBroker.est}`}</Seal>
                  </div>
                  <ol className="mt-3 space-y-2">
                    {(isInternal ? STAGES_INTERNAL : STAGES_EXTERNAL).map((s, i) => (
                      <li key={s} className="flex items-center gap-2.5 text-sm text-slate-600">
                        <span className="grid place-items-center h-5 w-5 rounded-full bg-white text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">{i + 1}</span>
                        {s}
                      </li>
                    ))}
                    <li className="flex items-center gap-2.5 text-sm text-emerald-700">
                      <span className="grid place-items-center h-5 w-5 rounded-full bg-emerald-500 text-white"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3"><path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                      {isInternal ? "Assets available in the receiving account" : "Assets delivered & settled at the receiving firm"}
                    </li>
                  </ol>
                </div>
              </Card>

              {/* Transfer insurance */}
              <Card title="Protect this transfer"
                desc={freeAllowed ? "Optional insurance covers your assets against loss or settlement failure during the transfer." : "Protection is required on this transfer. Choose Standard or Premium to continue."}
                badge={insurance !== "none" ? <Seal tone="green">Protected</Seal> : <Seal tone="gold">Action needed</Seal>}>
                {!freeAllowed && (
                  <div className="mb-4 flex gap-3 rounded-xl bg-brand-50 p-4 ring-1 ring-inset ring-brand-600/15">
                    <ShieldCheck className="h-5 w-5 shrink-0 text-brand-700" />
                    <div className="text-xs leading-relaxed text-slate-600">
                      <span className="font-semibold text-slate-900">Why protection is required.</span> High-value transfers above {formatMoney(FREE_INSURANCE_LIMIT)} carry
                      greater exposure to market movement, settlement delays, and the risk of loss while your assets move between
                      custodians. To make sure your holdings are fully reimbursable if anything goes wrong before settlement completes,
                      insurance is mandatory on transfers of this size — so a covered position is never left unprotected in transit.
                    </div>
                  </div>
                )}
                <div className="space-y-2.5">
                  {/* No protection (free, risky) — unavailable over the free limit */}
                  <button onClick={() => freeAllowed && setInsurance("none")} disabled={!freeAllowed}
                    className={`w-full text-left rounded-xl border p-4 transition ${!freeAllowed ? "border-slate-200 opacity-60 cursor-not-allowed" : insurance === "none" ? "border-rose-400 ring-2 ring-rose-400/30 bg-rose-50/60" : "border-slate-200 hover:bg-slate-50"}`}>
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 grid place-items-center h-4 w-4 rounded-full border-2 shrink-0 ${insurance === "none" && freeAllowed ? "border-rose-500" : "border-slate-300"}`}>
                        {insurance === "none" && freeAllowed && <span className="h-2 w-2 rounded-full bg-rose-500" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                            <WarningIcon className="h-4 w-4 text-rose-500" /> No protection
                          </span>
                          <span className="text-sm font-semibold text-slate-500 tnum shrink-0">Free</span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">Proceed without transfer insurance.</p>
                        {!freeAllowed && (
                          <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                            <LockIcon className="h-3.5 w-3.5" /> Not available for transfers over {formatMoney(FREE_INSURANCE_LIMIT)} — protection required
                          </div>
                        )}
                        {freeAllowed && insurance === "none" && (
                          <div className="mt-3 animate-attention rounded-xl bg-gradient-to-r from-rose-600 to-red-600 p-3.5 text-white shadow-lg shadow-rose-500/30">
                            <div className="flex items-center gap-2">
                              <span className="grid place-items-center h-7 w-7 shrink-0 rounded-full bg-white/20 ring-1 ring-white/40">
                                <WarningIcon className="h-4 w-4 text-white animate-wiggle" />
                              </span>
                              <span className="font-bold text-sm uppercase tracking-wide">You are not covered</span>
                            </div>
                            <p className="mt-2 text-[11px] leading-relaxed text-rose-50">
                              If your assets are lost, delayed, or fail to settle during the transfer, you bear the <strong className="text-white">full financial risk with zero reimbursement</strong>. Adding protection is strongly recommended.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Purchasable plans (admin-priced) */}
                  {insurancePlans.map((plan) => {
                    const active = insurance === plan.id;
                    return (
                      <button key={plan.id} onClick={() => setInsurance(plan.id)}
                        className={`w-full text-left rounded-xl border p-4 transition ${active ? "border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/40" : "border-slate-200 hover:bg-slate-50"}`}>
                        <div className="flex items-start gap-3">
                          <span className={`mt-0.5 grid place-items-center h-4 w-4 rounded-full border-2 shrink-0 ${active ? "border-brand-600" : "border-slate-300"}`}>
                            {active && <span className="h-2 w-2 rounded-full bg-brand-600" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                                <ShieldCheck className="h-4 w-4 text-brand-600" /> {plan.name}
                              </span>
                              <span className="text-sm font-semibold text-slate-900 tnum shrink-0">{formatMoneyExact(plan.price)}</span>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500">{plan.blurb}</p>
                            {plan.features.length > 0 && (
                              <ul className="mt-2 flex flex-wrap gap-1.5">
                                {plan.features.map((f) => (
                                  <li key={f} className="rounded-md bg-white px-2 py-0.5 text-[11px] text-slate-600 ring-1 ring-inset ring-slate-200">{f}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {/* Over-limit, nothing chosen yet */}
                {!freeAllowed && insurance === "none" && (
                  <div className="mt-4 flex gap-2 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-600/20">
                    <WarningIcon className="h-5 w-5 shrink-0" />
                    <span>Transfers over {formatMoney(FREE_INSURANCE_LIMIT)} require protection. Select Standard or Premium to continue.</span>
                  </div>
                )}

                {/* Premium payment — required before the transfer is processed */}
                {insurance !== "none" && selectedPlan && (
                  <div className={`mt-4 rounded-lg px-4 py-3 ring-1 ring-inset ${premiumPayable ? "bg-emerald-50 ring-emerald-600/20" : "bg-rose-50 ring-rose-600/20"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm">
                        <div className={`font-semibold ${premiumPayable ? "text-emerald-900" : "text-rose-900"}`}>Coverage up to {formatMoney(transferValue)}</div>
                        <div className={`text-xs ${premiumPayable ? "text-emerald-700" : "text-rose-700"}`}>{selectedPlan.name} · premium {formatMoneyExact(premium)}</div>
                      </div>
                      <ShieldCheck className={`h-6 w-6 ${premiumPayable ? "text-emerald-600" : "text-rose-500"}`} />
                    </div>
                    <div className="mt-2.5 border-t border-current/10 pt-2.5 flex items-center justify-between text-xs">
                      <span className="text-slate-600">Charged from {getBrokerage(source.brokerage)?.short} cash · available {formatMoney(sourceCash)}</span>
                      {premiumPayable
                        ? <span className="font-semibold text-emerald-700">Payment ready ✓</span>
                        : <span className="font-semibold text-rose-700">Add {formatMoney(premium - sourceCash)} to pay</span>}
                    </div>
                    {!premiumPayable && (
                      <p className="mt-2 text-[11px] leading-relaxed text-rose-700">
                        The {formatMoneyExact(premium)} premium must be paid before this transfer can proceed. Add funds to your
                        {" "}{source.label} account to cover it.
                      </p>
                    )}
                  </div>
                )}
              </Card>

              <Card title="Authorization & e-signature">
                <label className="flex gap-3 items-start cursor-pointer">
                  <input type="checkbox" checked={recipient.authorize} onChange={(e) => setR({ authorize: e.target.checked })} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                  <span className="text-xs leading-relaxed text-slate-600">
                    I authorize Meridian Transfer to {isInternal ? "move" : "initiate an ACATS request to transfer"} the assets listed above
                    from my <strong>{source.label}</strong> to <strong>{isInternal ? destAccount.label : destBroker.name}</strong>.
                    I understand securities may fluctuate in value during the transfer window.
                    <span className="text-slate-400"> (Demonstration — no real transfer occurs.)</span>
                  </span>
                </label>
                <div className="mt-4 max-w-sm">
                  <Field label="Type your full legal name to sign" hint={`Must match: ${recip.holder || "account holder"}`}>
                    <input className="field font-[cursive] text-lg" value={recipient.signature} onChange={(e) => setR({ signature: e.target.value })} placeholder="Signature" />
                  </Field>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Seal tone="slate"><LockIcon /> 256-bit encrypted</Seal>
                  {isInternal ? <Seal tone="brand">On-platform</Seal> : <Seal tone="slate">ACATS / NSCC</Seal>}
                  <Seal tone="green">SIPC protected</Seal>
                </div>
              </Card>
            </div>
          )}

          {/* STEP 5 — confirmation */}
          {step === 5 && (
            <Confirmation result={result} source={source} destLabel={isInternal ? destAccount?.label : destBroker?.name}
              destShort={isInternal ? destAccount?.label : destBroker?.short} value={transferValue} count={selectedPositions.length} onReset={reset} />
          )}
        </div>

        {/* Nav */}
        {step < 5 && (
          <div className="mt-6">
            {submitError && <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-600/20">{submitError}</div>}
            <div className="flex items-center justify-between">
              <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || submitting} className="btn-ghost">Back</button>
              <div className="flex items-center gap-3">
                {transferValue > 0 && step >= 1 && <span className="text-sm text-slate-400">Total: <span className="font-semibold text-slate-700 tnum">{formatMoney(transferValue)}</span></span>}
                <button onClick={next} disabled={!canNext || submitting} className="btn-primary">
                  {step === 4 ? (submitting ? "Processing…" : isInternal ? "Confirm transfer" : "Submit transfer request") : "Continue"}
                  {step !== 4 && <span aria-hidden>→</span>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ProcessingOverlay
        open={proc.open}
        status={proc.status}
        current={proc.step}
        steps={procStages}
        title={isInternal ? "Processing your transfer" : "Submitting your ACATS request"}
        subtitle="Please don't close this window."
        successTitle={isInternal ? "Transfer completed" : "Request submitted"}
        successSubtitle={isInternal ? "Assets moved successfully." : "Your transfer is now in progress."}
      />
    </main>
  );
}

/* ---------- confirmation ---------- */
function Confirmation({ result, source, destLabel, destShort, value, count, onReset }) {
  const internal = result?.method === "INTERNAL";
  const settled = result?.status === "SETTLED";
  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-brand-800 to-brand-600 px-5 py-6 sm:px-6 sm:py-7 text-white">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center h-11 w-11 shrink-0 rounded-full bg-white/15 ring-1 ring-white/30 text-xl">✓</span>
            <div>
              <h2 className="text-lg font-semibold">{settled ? "Transfer completed" : "Transfer request submitted"}</h2>
              <p className="text-sm text-white/80">{internal ? "Assets were moved instantly between your accounts." : "Your ACATS request is now in progress."}</p>
            </div>
            <div className="ml-auto text-right">
              <div className="text-[11px] uppercase tracking-wider text-white/60">Reference</div>
              <div className="font-mono font-semibold tracking-wide">{result?.reference}</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          <Info k="From" v={`${getBrokerage(source.brokerage)?.short} ••••${source.accountNumber.slice(-4)}`} />
          <Info k="To" v={destShort} />
          <Info k="Total value" v={formatMoney(value)} />
        </div>
      </div>

      {internal && settled && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-5 py-4 ring-1 ring-inset ring-emerald-600/20">
          <span className="grid place-items-center h-8 w-8 rounded-full bg-emerald-500 text-white">✓</span>
          <div className="text-sm">
            <div className="font-semibold text-emerald-900">Delivered to {destLabel}</div>
            <div className="text-emerald-700">These holdings now appear in that account. <a href="/ira" className="underline">View accounts →</a></div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Seal tone="slate">{count} positions</Seal>
        <Seal tone={internal ? "brand" : "gold"}>{internal ? "Internal" : "External · ACATS"}</Seal>
        {result?.insured && <Seal tone="green">Insured · {formatMoney(result.coverageAmount)} covered</Seal>}
        <div className="ml-auto flex items-center gap-2">
          <button onClick={onReset} className="btn-ghost">New transfer</button>
          {result?.id && <a href={`/transfers/${result.id}`} className="btn-primary">Track this transfer →</a>}
        </div>
      </div>
    </div>
  );
}

/* ---------- building blocks ---------- */
function MethodCard({ active, disabled, onClick, icon, title, desc, tag, foot }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`text-left rounded-xl border p-5 transition disabled:opacity-50 disabled:cursor-not-allowed ${active ? "border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/40" : "border-slate-200 hover:bg-slate-50"}`}>
      <div className="flex items-center justify-between">
        <span className={`grid place-items-center h-10 w-10 rounded-lg ${active ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500"}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            {icon === "internal"
              ? <path d="M4 7h13m0 0l-4-4m4 4l-4 4M20 17H7m0 0l4 4m-4-4l4-4" />
              : <><path d="M3 12h18M3 12l4-4M3 12l4 4" /><path d="M21 6v12" /></>}
          </svg>
        </span>
        <Seal tone={active ? "brand" : "slate"}>{tag}</Seal>
      </div>
      <div className="mt-3 font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-500">{desc}</div>
      <div className="mt-3 text-[11px] font-medium text-slate-400">{foot}</div>
    </button>
  );
}

function WarningIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

function Radio({ on }) {
  return (
    <span className={`grid place-items-center h-4 w-4 rounded-full border-2 ${on ? "border-brand-600" : "border-slate-300"}`}>
      {on && <span className="h-2 w-2 rounded-full bg-brand-600" />}
    </span>
  );
}

function Card({ title, desc, badge, className = "", children }) {
  return (
    <div className={`card ${className}`}>
      <div className="p-4 sm:p-6">
        {(title || badge) && (
          <div className="flex items-start justify-between mb-5">
            <div>
              {title && <h2 className="font-semibold text-slate-900">{title}</h2>}
              {desc && <p className="mt-1 text-sm text-slate-500 max-w-xl">{desc}</p>}
            </div>
            {badge}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

function Field({ label, hint, required, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1.5">{label} {required && <span className="text-rose-500">*</span>}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="label-xs mb-2">{title}</div>
      <dl className="space-y-1.5">{children}</dl>
    </div>
  );
}

function Line({ k, v, mono }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <dt className="text-slate-400">{k}</dt>
      <dd className={`text-slate-800 font-medium ${mono ? "font-mono" : ""}`}>{v}</dd>
    </div>
  );
}

function Info({ k, v }) {
  return (
    <div className="px-6 py-4">
      <div className="label-xs">{k}</div>
      <div className="mt-1 font-semibold text-slate-900 tnum">{v}</div>
    </div>
  );
}
