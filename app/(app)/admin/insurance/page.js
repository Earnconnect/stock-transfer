import InsurancePlanEditor from "@/components/admin/InsurancePlanEditor";
import { requireAdmin } from "@/lib/auth";
import { getAllInsurancePlans } from "@/lib/insurance";

export default async function AdminInsurancePage() {
  await requireAdmin();
  const plans = await getAllInsurancePlans();

  return (
    <main className="bg-grid min-h-full">
      <div className="page max-w-2xl">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Transfer insurance</h1>
          <p className="text-sm text-slate-500">Set the price members pay for each protection plan. Coverage is always the full transfer value.</p>
        </div>

        <div className="space-y-4">
          {plans.map((plan) => (
            <InsurancePlanEditor key={plan.id} plan={plan} />
          ))}
        </div>

        <p className="text-[11px] text-slate-400">
          Members always see a free “No protection” option (with a risk warning). Hiding a plan removes it
          from the transfer flow but keeps existing insured transfers intact.
        </p>
      </div>
    </main>
  );
}
