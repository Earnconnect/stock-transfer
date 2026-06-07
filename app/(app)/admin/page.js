import Link from "next/link";
import { Stat, SectionHeader, Seal } from "@/components/ui";
import BrokerLogo from "@/components/BrokerLogo";
import { requireAdmin } from "@/lib/auth";
import { getAdminStats, getAllTransfers } from "@/lib/queries";
import { getBrokerage, formatMoney } from "@/lib/data";

const STATUS_TONE = { PENDING: "gold", APPROVED: "brand", SETTLED: "green", REJECTED: "slate" };

export default async function AdminOverviewPage() {
  await requireAdmin();
  const [stats, transfers] = await Promise.all([getAdminStats(), getAllTransfers()]);
  const recent = transfers.slice(0, 6);

  return (
    <main className="bg-grid min-h-full">
      <div className="page">
        {/* Banner */}
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 px-5 py-5 sm:px-6 sm:py-6 text-white flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <span className="rounded-md bg-amber-500/20 px-2 py-0.5 font-semibold text-amber-300 ring-1 ring-inset ring-amber-400/30">ADMIN</span>
                Platform administration
              </div>
              <div className="mt-2 text-2xl font-semibold">Assets under management</div>
              <div className="mt-1 text-3xl font-semibold tnum text-emerald-300">{formatMoney(stats.totalValue)}</div>
            </div>
            <div className="hidden sm:flex gap-3">
              <Link href="/admin/transfers" className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-white/25 hover:bg-white/20 transition">Review transfers</Link>
              <Link href="/admin/users" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition">Manage users</Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Stat accent label="Total Users" value={stats.users} hint={`${stats.admins} admin${stats.admins === 1 ? "" : "s"}`} />
          <Stat accent label="Linked Accounts" value={stats.accounts} hint="Across all users" />
          <Stat accent label="Transfer Requests" value={stats.transfers} hint={`${stats.pending} pending review`} />
          <Stat accent label="Settled" value={stats.settled} hint={`${stats.approved} approved, in transit`} />
        </div>

        {/* Pending callout */}
        {stats.pending > 0 && (
          <Link href="/admin/transfers" className="flex items-center gap-3 rounded-xl bg-amber-50 px-5 py-4 ring-1 ring-inset ring-amber-600/20 hover:bg-amber-100/70 transition">
            <span className="grid place-items-center h-9 w-9 rounded-lg bg-amber-500 text-white font-semibold">{stats.pending}</span>
            <div className="text-sm">
              <div className="font-semibold text-amber-900">{stats.pending} transfer{stats.pending === 1 ? "" : "s"} awaiting review</div>
              <div className="text-amber-700">Approve, settle, or reject pending ACATS requests.</div>
            </div>
            <span className="ml-auto text-amber-700 text-sm font-medium">Review →</span>
          </Link>
        )}

        {/* Recent transfers */}
        <section className="card">
          <SectionHeader title="Recent Transfer Activity" action={<Link href="/admin/transfers" className="text-sm font-medium text-brand-700 hover:text-brand-800">View all →</Link>} />
          {recent.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">No transfers yet.</div>
          ) : (
            <div className="overflow-x-auto scroll-thin">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-200 bg-slate-50/60">
                    <th className="px-5 py-3 font-medium">Reference</th>
                    <th className="px-5 py-3 font-medium">User</th>
                    <th className="px-5 py-3 font-medium">Destination</th>
                    <th className="px-5 py-3 font-medium text-right">Value</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recent.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3 font-mono text-xs text-slate-600">{t.reference}</td>
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-900">{t.user.name}</div>
                        <div className="text-xs text-slate-400">{t.user.email}</div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <BrokerLogo id={t.destBrokerage} size={24} rounded="rounded-md" />
                          <span className="text-slate-700">{getBrokerage(t.destBrokerage)?.short}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-slate-900 tnum">{formatMoney(t.totalValue)}</td>
                      <td className="px-5 py-3"><Seal tone={STATUS_TONE[t.status]}>{t.status}</Seal></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
