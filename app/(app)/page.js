import Link from "next/link";
import EligibilityBadge from "@/components/EligibilityBadge";
import BrokerLogo from "@/components/BrokerLogo";
import StatusBadge from "@/components/transfer/StatusBadge";
import { Stat, SectionHeader, Seal } from "@/components/ui";
import { requireUserRecord } from "@/lib/auth";
import { getUserAccounts, getUserTransfers } from "@/lib/queries";
import { getActiveStocks } from "@/lib/catalog";
import {
  BROKERAGES,
  accountValue,
  formatMoney,
  getBrokerage,
  getIraType,
} from "@/lib/data";
import { isApproved } from "@/lib/irs";

export default async function DashboardPage() {
  const user = await requireUserRecord();
  const [accounts, transfers, stocks] = await Promise.all([
    getUserAccounts(user.id),
    getUserTransfers(user.id),
    getActiveStocks(),
  ]);

  const totalValue = accounts.reduce((sum, a) => sum + accountValue(a), 0);
  const approvedCount = stocks.filter((s) => isApproved(s.assetType)).length;
  const firstName = user.name.split(" ")[0];

  return (
    <main className="bg-grid min-h-full">
      <div className="page">
        {user.kycStatus !== "VERIFIED" && (
          <Link href="/verify" className="flex items-center gap-3 rounded-xl bg-amber-50 px-5 py-4 ring-1 ring-inset ring-amber-600/20 hover:bg-amber-100/70 transition">
            <span className="grid place-items-center h-9 w-9 rounded-lg bg-amber-500 text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M12 3l7 4v5c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V7l7-4z" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <div className="text-sm">
              <div className="font-semibold text-amber-900">Verify your identity to unlock transfers &amp; withdrawals</div>
              <div className="text-amber-700">A quick ID + face check is required by federal KYC rules.</div>
            </div>
            <span className="ml-auto text-amber-700 text-sm font-medium">Verify →</span>
          </Link>
        )}

        {/* Hero */}
        <section className="card overflow-hidden">
          <div className="relative bg-gradient-to-br from-slate-900 via-brand-900 to-brand-800 px-5 py-6 sm:px-6 sm:py-7 text-white">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-white/70 text-xs">
                  <Seal tone="brand">Premier</Seal>
                  <span>Welcome back, {firstName}</span>
                </div>
                <div className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight tnum">{formatMoney(totalValue)}</div>
                <div className="mt-1 text-sm text-emerald-300 font-medium">▲ 1.84% today · {accounts.length} linked accounts</div>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <Link href="/transfer" className="flex-1 md:flex-none text-center rounded-lg bg-white px-4 sm:px-5 py-2.5 text-sm font-semibold text-brand-800 shadow hover:bg-slate-100 transition">Initiate Transfer</Link>
                <Link href="/link" className="flex-1 md:flex-none text-center rounded-lg bg-white/10 px-4 sm:px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-inset ring-white/25 hover:bg-white/20 transition">+ Link</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Stat accent label="Linked Accounts" value={accounts.length} hint="IRA accounts on file" />
          <Stat accent label="IRS-Approved Assets" value={`${approvedCount} / ${stocks.length}`} hint="Eligible for IRA custody" />
          <Stat accent label="Transfer Requests" value={transfers.length} hint={`${transfers.filter((t) => t.status === "PENDING").length} pending`} />
          <Stat accent label="Partner Brokerages" value={BROKERAGES.length} hint="ACATS-connected firms" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Accounts */}
          <section className="lg:col-span-2 card">
            <SectionHeader title="Your IRA Accounts" action={<Link href="/ira" className="text-sm font-medium text-brand-700 hover:text-brand-800">View all →</Link>} />
            {accounts.length === 0 ? (
              <Empty text="No accounts linked yet." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {accounts.map((acc) => {
                  const broker = getBrokerage(acc.brokerage);
                  const type = getIraType(acc.type);
                  return (
                    <li key={acc.id}>
                      <Link href="/ira" className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition">
                        <div className="flex items-center gap-3">
                          <BrokerLogo id={acc.brokerage} />
                          <div>
                            <div className="font-medium text-slate-900">{acc.label}</div>
                            <div className="text-xs text-slate-400">{type.name} · {broker.name} · ••••{acc.accountNumber.slice(-4)}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-slate-900 tnum">{formatMoney(accountValue(acc))}</div>
                          <div className="text-xs text-slate-400">{acc.positions.length} positions</div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Recent transfers */}
          <section className="card">
            <SectionHeader title="Recent Transfers" action={<Link href="/transfer" className="text-sm font-medium text-brand-700 hover:text-brand-800">New →</Link>} />
            {transfers.length === 0 ? (
              <Empty text="No transfers yet. Start one to see it tracked here." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {transfers.slice(0, 5).map((t) => (
                  <li key={t.id}>
                    <Link href={`/transfers/${t.id}`} className="block px-5 py-3.5 hover:bg-slate-50 transition">
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-xs text-slate-500">{t.reference}</div>
                        <StatusBadge status={t.status} />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-sm">
                        <span className="text-slate-600">→ {getBrokerage(t.destBrokerage)?.short}</span>
                        <span className="font-medium text-slate-900 tnum">{formatMoney(t.totalValue)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Featured */}
        <section className="card">
          <SectionHeader title="Featured Securities" action={<Link href="/stocks" className="text-sm font-medium text-brand-700 hover:text-brand-800">All securities →</Link>} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            {stocks.slice(0, 4).map((s) => (
              <div key={s.symbol} className="p-5 hover:bg-slate-50/60 transition">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-900">{s.symbol}</div>
                  <span className={`text-xs font-medium tnum ${s.change >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{s.change >= 0 ? "▲" : "▼"} {Math.abs(s.change)}%</span>
                </div>
                <div className="mt-1 text-sm text-slate-500 truncate">{s.name}</div>
                <div className="mt-2 text-lg font-semibold text-slate-900 tnum">${s.price.toFixed(2)}</div>
                <div className="mt-2"><EligibilityBadge assetType={s.assetType} /></div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Empty({ text }) {
  return <div className="px-5 py-10 text-center text-sm text-slate-400">{text}</div>;
}
