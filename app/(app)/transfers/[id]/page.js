import Link from "next/link";
import { notFound } from "next/navigation";
import BrokerLogo from "@/components/BrokerLogo";
import EligibilityBadge from "@/components/EligibilityBadge";
import StatusBadge from "@/components/transfer/StatusBadge";
import Timeline from "@/components/transfer/Timeline";
import { Seal } from "@/components/ui";
import { requireUserRecord } from "@/lib/auth";
import { getUserTransfer, parseItems } from "@/lib/queries";
import { stagesFor, progressFor } from "@/lib/settlement";
import { getStockMap } from "@/lib/catalog";
import { getBrokerage, getIraType, insurancePlanName, INSURANCE_COVERAGE, formatMoney, formatMoneyExact } from "@/lib/data";
import { ShieldCheck } from "@/components/ui";

function WarningIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

export default async function TrackTransferPage({ params }) {
  const { id } = await params;
  const user = await requireUserRecord();
  const transfer = await getUserTransfer(user.id, id);
  if (!transfer) notFound();

  const stockMap = await getStockMap();
  const items = parseItems(transfer);
  const src = getBrokerage(transfer.source?.brokerage);
  const dest = getBrokerage(transfer.destBrokerage);
  const internal = transfer.method === "INTERNAL";
  const pct = Math.round((progressFor(transfer) / stagesFor(transfer).length) * 100);

  return (
    <main className="bg-grid min-h-full">
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-5">
        <Link href="/transfers" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <span aria-hidden>←</span> Back to history
        </Link>

        {/* Header */}
        <div className="card overflow-hidden animate-fade-up">
          <div className="bg-gradient-to-r from-slate-900 via-brand-900 to-brand-800 px-5 py-5 sm:px-6 sm:py-6 text-white">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-white/60">Tracking reference</div>
                <div className="mt-0.5 font-mono text-lg sm:text-xl font-semibold tracking-wide break-all">{transfer.reference}</div>
                <div className="mt-2 flex items-center gap-2">
                  <StatusBadge status={transfer.status} size="lg" />
                  <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ring-white/20">
                    {internal ? "Internal" : "External · ACATS"}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wider text-white/60">Total value</div>
                <div className="mt-0.5 text-2xl font-semibold tnum">{formatMoney(transfer.totalValue)}</div>
                <div className="text-xs text-white/70">{transfer.transferType === "FULL" ? "Full transfer" : "Partial transfer"} · {items.length} positions</div>
              </div>
            </div>

            {/* progress bar */}
            <div className="mt-5">
              <div className="flex justify-between text-[11px] text-white/60 mb-1.5">
                <span>Progress</span><span>{pct}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
                <div className={`h-1.5 rounded-full bar-fill ${transfer.status === "REJECTED" ? "bg-rose-400" : "bg-emerald-400"}`} style={{ "--w": `${transfer.status === "REJECTED" ? 25 : pct}%` }} />
              </div>
            </div>
          </div>

          {/* From → To */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-4 p-6">
            <Endpoint role={internal ? "From account" : "Delivering firm"} broker={src} account={transfer.source?.accountNumber} label={transfer.source?.label} />
            <div className="grid place-items-center">
              <div className={`grid place-items-center h-9 w-9 rounded-full ${transfer.status === "SETTLED" ? "bg-emerald-100 text-emerald-600" : "bg-brand-100 text-brand-600"}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </div>
            <Endpoint role={internal ? "To account" : "Receiving firm"} broker={dest} account={transfer.recipientNumber} label={internal ? (transfer.dest?.label || `${dest?.short} ${getIraType(transfer.recipientType)?.name}`) : `${dest?.short} ${getIraType(transfer.recipientType)?.name}`} holder={transfer.recipientHolder} received={transfer.status === "SETTLED"} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 animate-fade-up" style={{ animationDelay: "80ms" }}>
          {/* Timeline */}
          <section className="lg:col-span-3 card">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Transfer status</h2>
              <Seal tone="slate">ACATS / NSCC</Seal>
            </div>
            <div className="p-5">
              <Timeline transfer={transfer} />
            </div>
          </section>

          {/* Details */}
          <section className="lg:col-span-2 space-y-5">
            <div className="card">
              <div className="px-5 py-4 border-b border-slate-200"><h2 className="font-semibold text-slate-900">Recipient</h2></div>
              <dl className="p-5 space-y-2.5 text-sm">
                <Row k="Account holder" v={transfer.recipientHolder} />
                <Row k="Receiving account" v={transfer.recipientNumber} mono />
                <Row k="Account type" v={getIraType(transfer.recipientType)?.name} />
                <Row k="DTC clearing #" v={dest?.dtc} mono />
                <Row k="Clearing firm" v={dest?.clearing} />
              </dl>
            </div>
          </section>
        </div>

        {/* Assets */}
        <section className="card animate-fade-up" style={{ animationDelay: "160ms" }}>
          <div className="px-5 py-4 border-b border-slate-200"><h2 className="font-semibold text-slate-900">Assets in this transfer</h2></div>
          <div className="overflow-x-auto scroll-thin">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-200 bg-slate-50/60">
                  <th className="px-5 py-3 font-medium">Security</th>
                  <th className="px-5 py-3 font-medium text-right">Shares</th>
                  <th className="px-5 py-3 font-medium">Eligibility</th>
                  <th className="px-5 py-3 font-medium text-right">Value at transfer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it) => {
                  const stock = stockMap[it.symbol];
                  return (
                    <tr key={it.symbol}>
                      <td className="px-5 py-3"><span className="font-medium text-slate-900">{it.symbol}</span> <span className="text-slate-400">{stock?.name}</span></td>
                      <td className="px-5 py-3 text-right tnum text-slate-700">{it.shares}</td>
                      <td className="px-5 py-3"><EligibilityBadge assetType={stock?.assetType} /></td>
                      <td className="px-5 py-3 text-right font-medium text-slate-900 tnum">{formatMoneyExact(it.value)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td className="px-5 py-3 font-semibold text-slate-900" colSpan={3}>Total</td>
                  <td className="px-5 py-3 text-right font-bold text-slate-900 tnum">{formatMoneyExact(transfer.totalValue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* Insurance / protection */}
        {(() => {
          const st = transfer.insuranceStatus || (transfer.insured ? "ADDED" : "NONE");
          const active = st === "ADDED";
          const pending = st === "REQUESTED";
          const declined = st === "DECLINED";
          const statusSeal = { ADDED: "green", REQUESTED: "gold", DECLINED: "slate", NONE: "slate" }[st] || "slate";
          const statusLabel = { ADDED: "Active", REQUESTED: "Pending activation", DECLINED: "Declined", NONE: "Not insured" }[st] || "Not insured";
          return (
            <section className="card overflow-hidden animate-fade-up" style={{ animationDelay: "200ms" }}>
              {/* Prominent animated warning while protection is not yet active */}
              {pending && (
                <div className="animate-attention bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4 text-white">
                  <div className="flex items-center gap-3">
                    <span className="grid place-items-center h-9 w-9 shrink-0 rounded-full bg-white/20 ring-1 ring-white/40">
                      <WarningIcon className="h-5 w-5 animate-wiggle" />
                    </span>
                    <div>
                      <div className="font-bold text-sm uppercase tracking-wide">Protection not yet active</div>
                      <div className="text-xs text-white/90">
                        <strong>{dest?.name || "The receiving firm"}</strong> requires full insurance coverage on the incoming
                        assets before this transfer can be released. Until this protection is activated, your transfer is <strong>not covered</strong>.
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {declined && (
                <div className="bg-gradient-to-r from-rose-600 to-red-600 px-5 py-4 text-white">
                  <div className="flex items-center gap-3">
                    <span className="grid place-items-center h-9 w-9 shrink-0 rounded-full bg-white/20 ring-1 ring-white/40"><WarningIcon className="h-5 w-5" /></span>
                    <div>
                      <div className="font-bold text-sm uppercase tracking-wide">Protection not active</div>
                      <div className="text-xs text-white/90">This insurance request was declined. The transfer is <strong>not covered</strong>.</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-5">
                <div className="flex items-center gap-3">
                  <span className={`grid place-items-center h-11 w-11 rounded-xl shrink-0 ${active ? "bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-600/20" : pending ? "bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-600/20" : "bg-slate-100 text-slate-400"}`}>
                    <ShieldCheck className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-semibold text-slate-900">Transfer protection</h2>
                      <Seal tone={statusSeal}>{statusLabel}</Seal>
                    </div>
                    {transfer.insured ? (
                      <p className="mt-0.5 text-sm text-slate-500">
                        {insurancePlanName(transfer.insurancePlan)} · covers up to <span className="font-medium text-slate-700">{formatMoney(transfer.coverageAmount)}</span> · coverage fee {formatMoneyExact(transfer.insurancePremium)}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-sm text-slate-500">This transfer was not insured.</p>
                    )}
                  </div>
                </div>

                {transfer.insured && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {active ? "Your protection covers" : "Once activated, this protection covers"}
                    </div>
                    <ul className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                      {INSURANCE_COVERAGE.map((c) => (
                        <li key={c} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className={`mt-0.5 grid place-items-center h-4 w-4 shrink-0 rounded-full ${active ? "bg-emerald-500 text-white" : "bg-amber-400/90 text-white"}`}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" className="h-2.5 w-2.5"><path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </span>
                          {c}
                        </li>
                      ))}
                    </ul>
                    {pending && (
                      <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-amber-700">
                        <WarningIcon className="h-3.5 w-3.5" /> Coverage begins only once this protection is activated.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </section>
          );
        })()}

        {transfer.status === "SETTLED" && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-5 py-4 ring-1 ring-inset ring-emerald-600/20">
            <span className="grid place-items-center h-8 w-8 rounded-full bg-emerald-500 text-white">✓</span>
            <div className="text-sm">
              {internal ? (
                <>
                  <div className="font-semibold text-emerald-900">Assets delivered to {transfer.dest?.label || dest?.short}</div>
                  <div className="text-emerald-700">These holdings now appear in that account. <Link href="/ira" className="underline">View accounts →</Link></div>
                </>
              ) : (
                <>
                  <div className="font-semibold text-emerald-900">Assets delivered to {dest?.name} (off-platform)</div>
                  <div className="text-emerald-700">These assets left Meridian and now sit in your external {dest?.short} account ••••{String(transfer.recipientNumber).slice(-4)}. This transfer is kept as a record.</div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Endpoint({ role, broker, account, label, holder, received }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-3">
        <BrokerLogo id={broker?.id} size={40} />
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-slate-400">{role}</div>
          <div className="font-semibold text-slate-900 truncate">{broker?.name}</div>
        </div>
        {received && <span className="ml-auto"><Seal tone="green">Received</Seal></span>}
      </div>
      <div className="mt-3 space-y-1 text-xs">
        {label && <div className="text-slate-600">{label}</div>}
        {account && <div className="font-mono text-slate-500">••••{String(account).slice(-4)}</div>}
        {holder && <div className="text-slate-400">{holder}</div>}
      </div>
    </div>
  );
}

function Row({ k, v, mono }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-400 shrink-0">{k}</dt>
      <dd className={`text-slate-800 font-medium text-right ${mono ? "font-mono" : ""}`}>{v || "—"}</dd>
    </div>
  );
}
