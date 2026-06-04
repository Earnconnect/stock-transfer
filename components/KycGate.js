import Link from "next/link";
import { ShieldCheck } from "@/components/ui";

// Blocking gate shown when a user must verify identity before an action.
export default function KycGate({ next = "/", action = "move funds", status = "UNVERIFIED" }) {
  const pending = status === "PENDING";
  return (
    <main className="bg-grid min-h-full">
      <div className="p-6 max-w-xl mx-auto">
        <div className="card p-8 text-center">
          <div className="mx-auto grid place-items-center h-14 w-14 rounded-full bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-600/20">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-slate-900">Identity verification required</h1>
          <p className="mt-2 text-sm text-slate-500">
            {pending
              ? "Your verification is under review. You'll be able to continue once it's approved."
              : `Federal KYC rules require us to verify your identity before you can ${action}. It takes about a minute — a government ID and a quick face scan.`}
          </p>
          <div className="mt-6">
            <Link href={`/verify?next=${encodeURIComponent(next)}`} className="btn-primary">Verify my identity</Link>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <span>ID document</span><span>·</span><span>Face match</span><span>·</span><span>Encrypted</span>
          </div>
        </div>
      </div>
    </main>
  );
}
