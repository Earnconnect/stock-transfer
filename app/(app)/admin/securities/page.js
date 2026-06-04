import { SectionHeader, Seal } from "@/components/ui";
import EligibilityBadge from "@/components/EligibilityBadge";
import AddStockForm from "@/components/admin/AddStockForm";
import StockRowActions from "@/components/admin/StockRowActions";
import { requireAdmin } from "@/lib/auth";
import { getStocks } from "@/lib/catalog";
import { formatMoneyExact } from "@/lib/data";

export default async function AdminSecuritiesPage() {
  await requireAdmin();
  const stocks = await getStocks();
  const active = stocks.filter((s) => s.active).length;

  return (
    <main className="bg-grid min-h-full">
      <div className="p-6 space-y-6">
        <AddStockForm />

        <section className="card">
          <SectionHeader title={`Securities Catalog (${stocks.length})`} action={<span className="text-xs text-slate-400">{active} listed</span>} />
          <div className="overflow-x-auto scroll-thin">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-200 bg-slate-50/60">
                  <th className="px-5 py-3 font-medium">Symbol</th>
                  <th className="px-5 py-3 font-medium">Sector</th>
                  <th className="px-5 py-3 font-medium text-right">Price</th>
                  <th className="px-5 py-3 font-medium text-right">Available</th>
                  <th className="px-5 py-3 font-medium">Eligibility</th>
                  <th className="px-5 py-3 font-medium">Listed</th>
                  <th className="px-5 py-3 font-medium text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stocks.map((s) => (
                  <tr key={s.id} className={`hover:bg-slate-50/60 ${s.active ? "" : "opacity-60"}`}>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-slate-900">{s.symbol}</div>
                      <div className="text-xs text-slate-400">{s.name}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{s.sector}</td>
                    <td className="px-5 py-3 text-right font-medium text-slate-900 tnum">{formatMoneyExact(s.price)}</td>
                    <td className="px-5 py-3 text-right text-slate-700 tnum">{s.available.toLocaleString()}</td>
                    <td className="px-5 py-3"><EligibilityBadge assetType={s.assetType} /></td>
                    <td className="px-5 py-3">{s.active ? <Seal tone="green">Listed</Seal> : <Seal tone="slate">Unlisted</Seal>}</td>
                    <td className="px-5 py-3"><StockRowActions id={s.id} active={s.active} price={s.price} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
