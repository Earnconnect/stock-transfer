import { SectionHeader, Seal } from "@/components/ui";
import WithdrawForm from "@/components/WithdrawForm";
import KycGate from "@/components/KycGate";
import { requireUserRecord } from "@/lib/auth";
import { getUserAccounts, getUserWithdrawals } from "@/lib/queries";
import { formatMoney } from "@/lib/data";

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function WithdrawPage() {
  const user = await requireUserRecord();
  if (user.kycStatus !== "VERIFIED") {
    return <KycGate next="/withdraw" action="make a withdrawal" status={user.kycStatus} />;
  }

  const accountsRaw = await getUserAccounts(user.id);
  const accounts = accountsRaw.map((a) => ({
    id: a.id, type: a.type, brokerage: a.brokerage, label: a.label,
    accountNumber: a.accountNumber, cashBalance: a.cashBalance,
    positions: a.positions.map((p) => ({ symbol: p.symbol, shares: p.shares, price: p.price, name: p.name, assetType: p.assetType })),
  }));
  const withdrawals = await getUserWithdrawals(user.id);

  return (
    <main className="bg-grid min-h-full">
      <div className="page">
        <WithdrawForm accounts={accounts} />

        {withdrawals.length > 0 && (
          <section className="card">
            <SectionHeader title="Withdrawal history" />
            <div className="overflow-x-auto scroll-thin">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-200 bg-slate-50/60">
                    <th className="px-5 py-3 font-medium">Reference / Date</th>
                    <th className="px-5 py-3 font-medium">Account</th>
                    <th className="px-5 py-3 font-medium text-right">Gross</th>
                    <th className="px-5 py-3 font-medium text-right">Penalty + Tax</th>
                    <th className="px-5 py-3 font-medium text-right">Net</th>
                    <th className="px-5 py-3 font-medium">IRS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <div className="font-mono text-xs text-slate-600">{w.reference}</div>
                        <div className="text-xs text-slate-400">{fmtDate(w.createdAt)}</div>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{w.account?.label}</td>
                      <td className="px-5 py-3 text-right tnum text-slate-700">{formatMoney(w.gross)}</td>
                      <td className="px-5 py-3 text-right tnum text-rose-600">– {formatMoney(w.penalty + w.tax)}</td>
                      <td className="px-5 py-3 text-right tnum font-medium text-slate-900">{formatMoney(w.net)}</td>
                      <td className="px-5 py-3"><Seal tone="green">1099-R filed</Seal></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
