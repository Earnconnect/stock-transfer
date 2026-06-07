import { SectionHeader, Stat, Seal } from "@/components/ui";
import BrokerLogo from "@/components/BrokerLogo";
import AccountManager from "@/components/admin/AccountManager";
import { requireAdmin } from "@/lib/auth";
import { getAllAccounts } from "@/lib/queries";
import { getActiveStocks } from "@/lib/catalog";
import { getBrokerage, getIraType, accountValue, formatMoney } from "@/lib/data";

export default async function AdminAccountsPage() {
  await requireAdmin();
  const [accounts, catalog] = await Promise.all([getAllAccounts(), getActiveStocks()]);

  const lite = catalog.map((s) => ({ symbol: s.symbol, name: s.name }));
  const totalCash = accounts.reduce((s, a) => s + a.cashBalance, 0);
  const totalValue = accounts.reduce((s, a) => s + accountValue(a), 0);

  // Group accounts by owner.
  const byUser = {};
  for (const a of accounts) {
    const key = a.user.email;
    (byUser[key] ||= { user: a.user, accounts: [] }).accounts.push(a);
  }

  return (
    <main className="bg-grid min-h-full">
      <div className="page">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Stat accent label="Accounts" value={accounts.length} hint="Across all members" />
          <Stat accent label="Total AUM" value={formatMoney(totalValue)} hint="Holdings + cash" />
          <Stat accent label="Total Cash" value={formatMoney(totalCash)} hint="Across accounts" />
          <Stat accent label="Members" value={Object.keys(byUser).length} hint="With accounts" />
        </div>

        {Object.values(byUser).map(({ user, accounts }) => (
          <section key={user.email} className="card">
            <SectionHeader title={user.name} action={<span className="text-xs text-slate-400">{user.email}</span>} />
            <div className="divide-y divide-slate-100">
              {accounts.map((acc) => {
                const broker = getBrokerage(acc.brokerage);
                const type = getIraType(acc.type);
                return (
                  <div key={acc.id} className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <BrokerLogo id={acc.brokerage} />
                        <div>
                          <div className="font-medium text-slate-900 flex items-center gap-2">
                            {acc.label}
                            {acc.status === "CLOSED" && <Seal tone="slate">Closed</Seal>}
                          </div>
                          <div className="text-xs text-slate-400">{type?.name} · {broker?.name} · ••••{acc.accountNumber.slice(-4)} · {acc.positions.length} holdings · cash {formatMoney(acc.cashBalance)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-slate-900 tnum">{formatMoney(accountValue(acc))}</div>
                        <div className="mt-1"><AccountManager account={acc} catalog={lite} /></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
