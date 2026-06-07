import Link from "next/link";
import IdentityVerification from "@/components/IdentityVerification";
import { Seal, ShieldCheck } from "@/components/ui";
import { requireUserRecord } from "@/lib/auth";

const ID_LABEL = { drivers_license: "Driver's License", passport: "Passport", state_id: "State ID" };

export default async function VerifyPage({ searchParams }) {
  const user = await requireUserRecord();
  const sp = await searchParams;
  const next = typeof sp?.next === "string" ? sp.next : "/";

  return (
    <main className="bg-grid min-h-full">
      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4 sm:space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Identity verification</h1>
          <p className="text-sm text-slate-500">Federal Customer Identification Program (CIP / KYC) checks are required before transfers or withdrawals.</p>
        </div>

        {user.kycStatus === "VERIFIED" ? (
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <span className="grid place-items-center h-11 w-11 rounded-full bg-emerald-100 text-emerald-600"><ShieldCheck className="h-6 w-6" /></span>
              <div>
                <div className="font-semibold text-slate-900">Identity verified</div>
                <div className="text-sm text-slate-500">
                  {ID_LABEL[user.idType] || "Government ID"} ••••{user.idLast4} · face match confirmed
                  {user.kycVerifiedAt ? ` · ${new Date(user.kycVerifiedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}
                </div>
              </div>
              <Seal tone="green" >Verified</Seal>
            </div>
            <div className="mt-5 flex gap-2">
              <Link href="/transfer" className="btn-ghost">Initiate transfer</Link>
              <Link href="/withdraw" className="btn-primary">Make a withdrawal</Link>
            </div>
          </div>
        ) : (
          <IdentityVerification redirectTo={next} />
        )}
      </div>
    </main>
  );
}
