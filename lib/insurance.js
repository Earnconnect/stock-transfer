import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { INSURANCE_PLAN_META, INSURANCE_PLAN_ORDER } from "@/lib/data";

function merge(row) {
  const meta = INSURANCE_PLAN_META[row.id] || { name: row.id, blurb: "", features: [] };
  return { id: row.id, price: row.price, active: row.active, name: meta.name, blurb: meta.blurb, features: meta.features || [] };
}

function sortByOrder(a, b) {
  return INSURANCE_PLAN_ORDER.indexOf(a.id) - INSURANCE_PLAN_ORDER.indexOf(b.id);
}

// Active, purchasable plans (for the transfer wizard).
export const getInsurancePlans = cache(async () => {
  const rows = await prisma.insurancePlan.findMany({ where: { active: true } });
  return rows.map(merge).sort(sortByOrder);
});

// All plans incl. inactive (for the admin editor).
export const getAllInsurancePlans = cache(async () => {
  const rows = await prisma.insurancePlan.findMany();
  return rows.map(merge).sort(sortByOrder);
});

// The price for a plan id, or null if the plan is unknown/inactive.
export async function getInsurancePlanPrice(id) {
  if (!id || id === "none") return 0;
  const row = await prisma.insurancePlan.findUnique({ where: { id } });
  return row && row.active ? row.price : null;
}
