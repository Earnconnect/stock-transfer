import Link from "next/link";
import EligibilityBadge from "@/components/EligibilityBadge";
import BrokerLogo from "@/components/BrokerLogo";
import { Seal } from "@/components/ui";
import { requireUserRecord } from "@/lib/auth";
import { getUserAccounts } from "@/lib/queries";
import {
  IRA_TYPES,
  getBrokerage,
  getIraType,
  positionValue,
  accountValue,
  formatMoney,
} from "@/lib/data";
import { isApproved } from "@/lib/irs";

export default async function IraPage() {
  const user = await requireUserRecord();
  const accounts = await getUserAccounts(user.id);
  const total = accounts.reduce((s, a) => s + accountValue(a), 0);

  return (
    <main className="bg-grid min-h-full">
      <div className="page">
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-br from-slate-900 via-brand-900 to-brand-800 p-5 sm:p-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <div className="text-sm text-white/70">Total retirement value · {accounts.length} accounts</div>
                <div className="mt-1 text-3xl font-semibold tnum">{formatMoney(total)}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {IRA_TYPES.map((t) => (
                    <span key={t.id} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-inset ring-white/15">{t.name}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 self-start sm:self-auto">
                <Link href="/link" className="rounded-lg bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-inset ring-white/25 hover:bg-white/20 transition">+ Link account</Link>
                <Link href="/transfer" className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 shadow hover:bg-slate-100 transition">Initiate Transfer</Link>
              </div>
            </div>
          </div>
        </div>

        {accounts.length === 0 ? (
          <div className="card-pad text-center py-14">
            <div className="mx-auto grid place-items-center h-12 w-12 rounded-full bg-slate-100 text-slate-400 mb-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6"><path d="M12 3l7 4v5c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V7l7-4z" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div className="text-sm font-medium text-slate-700">No accounts linked yet</div>
            <p className="mt-1 text-sm text-slate-400">Link a brokerage account to start viewing holdings and transferring.</p>
            <Link href="/link" className="btn-primary mt-4 inline-flex">+ Link your first account</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {accounts.map((acc) => {
              const broker = getBrokerage(acc.brokerage);
              const type = getIraType(acc.type);
              const value = accountValue(acc);
              const eligibleValue = acc.positions.filter((p) => isApproved(p.assetType)).reduce((s, p) => s + positionValue(p), 0);
              const pct = value ? Math.round((eligibleValue / value) * 100) : 0;

              return (
                <div key={acc.id} className="card overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <BrokerLogo id={acc.brokerage} size={44} />
                      <Seal tone="brand">{type.name}</Seal>
                    </div>
                    <div className="mt-3 font-semibold text-slate-900">{acc.label}</div>
                    <div className="text-xs text-slate-400">{broker.name} · ••••{acc.accountNumber.slice(-4)} · Opened {acc.opened}</div>
                    <div className="text-[11px] text-slate-400 mt-1">{type.taxNote}</div>
                    <div className="mt-3 text-2xl font-semibold text-slate-900 tnum">{formatMoney(value)}</div>

                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>IRA-eligible holdings</span><span className="tnum">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-1.5 rounded-full ${pct === 100 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>

                  <ul className="divide-y divide-slate-100 flex-1">
                    {acc.cashBalance > 0 && (
                      <li className="flex items-center justify-between px-5 py-3 bg-emerald-50/40">
                        <div>
                          <div className="text-sm font-medium text-slate-900">Cash</div>
                          <div className="text-xs text-slate-400">Available funds</div>
                        </div>
                        <span className="text-sm font-medium text-emerald-700 w-20 text-right tnum">{formatMoney(acc.cashBalance)}</span>
                      </li>
                    )}
                    {acc.positions.map((p) => (
                      <li key={p.id} className="flex items-center justify-between px-5 py-3">
                        <div>
                          <div className="text-sm font-medium text-slate-900">{p.symbol}</div>
                          <div className="text-xs text-slate-400 tnum">{p.shares} shares · {p.name}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <EligibilityBadge assetType={p.assetType} />
                          <span className="text-sm font-medium text-slate-700 w-20 text-right tnum">{formatMoney(positionValue(p))}</span>
                        </div>
                      </li>
                    ))}
                    {acc.positions.length === 0 && acc.cashBalance === 0 && (
                      <li className="px-5 py-6 text-center text-xs text-slate-400">No holdings yet.</li>
                    )}
                  </ul>

                  <div className="p-4 border-t border-slate-200">
                    <Link href="/transfer" className="btn-ghost w-full">Transfer from this account</Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
