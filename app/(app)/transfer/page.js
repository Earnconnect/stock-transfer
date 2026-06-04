import TransferWizard from "@/components/TransferWizard";
import KycGate from "@/components/KycGate";
import { requireUserRecord } from "@/lib/auth";
import { getUserAccounts } from "@/lib/queries";

export default async function TransferPage() {
  const user = await requireUserRecord();
  if (user.kycStatus !== "VERIFIED") {
    return <KycGate next="/transfer" action="initiate a transfer" status={user.kycStatus} />;
  }
  const accountsRaw = await getUserAccounts(user.id);

  // Pass only plain, serializable fields to the client component.
  const accounts = accountsRaw.map((a) => ({
    id: a.id,
    type: a.type,
    brokerage: a.brokerage,
    label: a.label,
    accountNumber: a.accountNumber,
    holder: a.holder,
    opened: a.opened,
    cashBalance: a.cashBalance,
    positions: a.positions.map((p) => ({
      symbol: p.symbol, shares: p.shares, price: p.price, name: p.name, assetType: p.assetType,
    })),
  }));

  return <TransferWizard accounts={accounts} />;
}
