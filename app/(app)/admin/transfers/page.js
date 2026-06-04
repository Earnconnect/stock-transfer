import { Seal, SectionHeader } from "@/components/ui";
import BrokerLogo from "@/components/BrokerLogo";
import TransferActions from "@/components/admin/TransferActions";
import { requireAdmin } from "@/lib/auth";
import { getAllTransfers, parseItems } from "@/lib/queries";
import { getBrokerage, getIraType, formatMoney } from "@/lib/data";

const STATUS_TONE = { PENDING: "gold", APPROVED: "brand", SETTLED: "green", REJECTED: "slate" };

export default async function AdminTransfersPage() {
  await requireAdmin();
  const transfers = await getAllTransfers();

  const groups = [
    ["Pending review", transfers.filter((t) => t.status === "PENDING")],
    ["In progress", transfers.filter((t) => t.status === "APPROVED")],
    ["Closed", transfers.filter((t) => t.status === "SETTLED" || t.status === "REJECTED")],
  ];

  return (
    <main className="bg-grid min-h-full">
      <div className="p-6 space-y-6">
        {transfers.length === 0 && (
          <div className="card-pad text-center text-sm text-slate-400 py-12">No transfer requests have been submitted yet.</div>
        )}

        {groups.map(([label, list]) =>
          list.length === 0 ? null : (
            <section key={label} className="card">
              <SectionHeader title={`${label} (${list.length})`} />
              <div className="overflow-x-auto scroll-thin">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-200 bg-slate-50/60">
                      <th className="px-5 py-3 font-medium">Reference / User</th>
                      <th className="px-5 py-3 font-medium">Route</th>
                      <th className="px-5 py-3 font-medium">Type</th>
                      <th className="px-5 py-3 font-medium text-right">Value</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {list.map((t) => {
                      const items = parseItems(t);
                      const dest = getBrokerage(t.destBrokerage);
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/60 align-top">
                          <td className="px-5 py-4">
                            <div className="font-mono text-xs text-slate-600">{t.reference}</div>
                            <div className="mt-0.5 font-medium text-slate-900">{t.user.name}</div>
                            <div className="text-xs text-slate-400">{t.user.email}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">{getBrokerage(t.source?.brokerage)?.short || "—"}</span>
                              <span className="text-slate-300">→</span>
                              <BrokerLogo id={t.destBrokerage} size={22} rounded="rounded" />
                              <span className="text-slate-800 font-medium">{dest?.short}</span>
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              {items.length} position{items.length === 1 ? "" : "s"} · {getIraType(t.recipientType)?.name} · DTC #{dest?.dtc}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-1">
                              <span className={`rounded-md px-2 py-0.5 text-xs font-medium w-fit ${t.method === "INTERNAL" ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-600"}`}>
                                {t.method === "INTERNAL" ? "Internal" : "External"}
                              </span>
                              <span className="text-[11px] text-slate-400">{t.transferType === "FULL" ? "Full" : "Partial"}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right font-medium text-slate-900 tnum">{formatMoney(t.totalValue)}</td>
                          <td className="px-5 py-4"><Seal tone={STATUS_TONE[t.status]}>{t.status}</Seal></td>
                          <td className="px-5 py-4"><TransferActions id={t.id} status={t.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )
        )}
      </div>
    </main>
  );
}
