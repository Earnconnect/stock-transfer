import Link from "next/link";
import { SectionHeader, Stat } from "@/components/ui";
import BrokerLogo from "@/components/BrokerLogo";
import StatusBadge from "@/components/transfer/StatusBadge";
import { requireUserRecord } from "@/lib/auth";
import { getUserTransfers, parseItems } from "@/lib/queries";
import { getBrokerage, formatMoney } from "@/lib/data";

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function TransferHistoryPage() {
  const user = await requireUserRecord();
  const transfers = await getUserTransfers(user.id);

  const count = (s) => transfers.filter((t) => t.status === s).length;
  const movedValue = transfers.filter((t) => t.status === "SETTLED").reduce((s, t) => s + t.totalValue, 0);

  return (
    <main className="bg-grid min-h-full">
      <div className="page">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Stat accent label="Total Requests" value={transfers.length} hint="All time" />
          <Stat accent label="In Transit" value={count("APPROVED")} hint="Approved, settling" />
          <Stat accent label="Pending" value={count("PENDING")} hint="Awaiting review" />
          <Stat accent label="Value Delivered" value={formatMoney(movedValue)} hint={`${count("SETTLED")} settled`} />
        </div>

        <section className="card">
          <SectionHeader
            title="Transfer History"
            action={<Link href="/transfer" className="btn-primary !px-4 !py-2 text-xs">New transfer</Link>}
          />

          {transfers.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto grid place-items-center h-12 w-12 rounded-full bg-slate-100 text-slate-400 mb-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
                  <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-sm font-medium text-slate-700">No transfers yet</div>
              <p className="mt-1 text-sm text-slate-400">Start your first transfer to see it tracked here.</p>
              <Link href="/transfer" className="btn-primary mt-4 inline-flex">Initiate a transfer</Link>
            </div>
          ) : (
            <div className="overflow-x-auto scroll-thin">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-200 bg-slate-50/60">
                    <th className="px-5 py-3 font-medium">Reference / Date</th>
                    <th className="px-5 py-3 font-medium">Route</th>
                    <th className="px-5 py-3 font-medium">Assets</th>
                    <th className="px-5 py-3 font-medium text-right">Value</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transfers.map((t) => {
                    const items = parseItems(t);
                    const dest = getBrokerage(t.destBrokerage);
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/60">
                        <td className="px-5 py-4">
                          <div className="font-mono text-xs text-slate-600">{t.reference}</div>
                          <div className="text-xs text-slate-400">{fmtDate(t.createdAt)}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">{getBrokerage(t.source?.brokerage)?.short || "—"}</span>
                            <span className="text-slate-300">→</span>
                            <BrokerLogo id={t.destBrokerage} size={22} rounded="rounded" />
                            <span className="text-slate-800 font-medium">{dest?.short}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <span>{items.length} position{items.length === 1 ? "" : "s"}</span>
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${t.method === "INTERNAL" ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-600"}`}>
                              {t.method === "INTERNAL" ? "Internal" : "External"}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">{t.transferType === "FULL" ? "Full" : "Partial"}</span>
                        </td>
                        <td className="px-5 py-4 text-right font-medium text-slate-900 tnum">{formatMoney(t.totalValue)}</td>
                        <td className="px-5 py-4"><StatusBadge status={t.status} /></td>
                        <td className="px-5 py-4 text-right">
                          <Link href={`/transfers/${t.id}`} className="text-sm font-medium text-brand-700 hover:text-brand-800">Track →</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
