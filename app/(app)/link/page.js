import Link from "next/link";
import LinkAccountForm from "@/components/LinkAccountForm";
import { requireUserRecord } from "@/lib/auth";
import { getActiveStocks } from "@/lib/catalog";

export default async function LinkAccountPage() {
  const user = await requireUserRecord();
  const catalog = await getActiveStocks();
  return (
    <main className="bg-grid min-h-full">
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4 sm:space-y-5">
        <Link href="/ira" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <span aria-hidden>←</span> Back to accounts
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Link a brokerage account</h1>
          <p className="text-sm text-slate-500">Connect an account to view it alongside your holdings and use it in transfers.</p>
        </div>
        <LinkAccountForm defaultHolder={user.name} catalog={catalog} />
      </div>
    </main>
  );
}
