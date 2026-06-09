"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { settleTransfer } from "@/lib/settlement";
import { getStockMap } from "@/lib/catalog";
import { getBrokerage, getIraType, FREE_INSURANCE_LIMIT } from "@/lib/data";
import { getInsurancePlanPrice, hasActiveInsurancePlans } from "@/lib/insurance";

function genReference(account, dtc, internal) {
  const now = new Date();
  const ym = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
  // Unique per request: random digits + a short random suffix so repeat
  // transfers from the same account never collide on the reference.
  const rand = Math.floor(1000 + Math.random() * 9000);
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${internal ? "INT" : "ACT"}-${dtc}-${ym}-${rand}${suffix}`;
}

export async function createTransferAction(payload) {
  const session = await getSession();
  if (!session?.sub) return { error: "Your session has expired. Please sign in again." };

  const { sourceAccountId, method, transferType, symbols } = payload || {};
  const isInternal = method === "INTERNAL";

  // Validate the source account belongs to the current user.
  const source = await prisma.account.findFirst({
    where: { id: sourceAccountId, userId: session.sub },
    include: { positions: true },
  });
  if (!source) return { error: "Invalid source account." };

  // Resolve destination details for each method.
  let destBrokerage, recipientHolder, recipientNumber, recipientType, destAccountId = null;

  if (isInternal) {
    const dest = await prisma.account.findFirst({
      where: { id: payload.destAccountId, userId: session.sub, status: "ACTIVE" },
    });
    if (!dest) return { error: "Select one of your own accounts to receive the transfer." };
    if (dest.id === source.id) return { error: "Source and destination accounts must differ." };
    destAccountId = dest.id;
    destBrokerage = dest.brokerage;
    recipientHolder = dest.holder;
    recipientNumber = dest.accountNumber;
    recipientType = dest.type;
  } else {
    const { recipient } = payload;
    const broker = getBrokerage(payload.destBrokerage);
    if (!broker || payload.destBrokerage === source.brokerage) return { error: "Invalid destination brokerage." };
    if (!recipient?.holder || !recipient?.account || !recipient?.type) {
      return { error: "Missing recipient account details." };
    }
    if (!getIraType(recipient.type)) return { error: "Invalid receiving account type." };
    destBrokerage = payload.destBrokerage;
    recipientHolder = recipient.holder.trim();
    recipientNumber = recipient.account.trim();
    recipientType = recipient.type;
  }

  // Determine the positions being moved and recompute value server-side.
  const moving =
    transferType === "FULL"
      ? source.positions
      : source.positions.filter((p) => Array.isArray(symbols) && symbols.includes(p.symbol));
  if (moving.length === 0) return { error: "Select at least one position to transfer." };

  const stockMap = await getStockMap();
  const items = moving.map((p) => {
    const stock = stockMap[p.symbol];
    const value = stock ? stock.price * p.shares : 0;
    return { symbol: p.symbol, shares: p.shares, value };
  });
  const totalValue = items.reduce((s, i) => s + i.value, 0);

  // Insurance — validate the plan and read the admin-set price from the DB.
  const planId = payload?.insurance && payload.insurance !== "none" ? payload.insurance : "none";
  const planPrice = await getInsurancePlanPrice(planId); // null if unknown/inactive
  const insured = planId !== "none" && planPrice != null;
  const insurancePremiumAmt = insured ? planPrice : 0;
  const coverageAmount = insured ? totalValue : 0;

  // Transfers over the free limit must be insured — but only when the admin
  // actually offers insurance. If no plans are active, allow the transfer.
  const insuranceOffered = await hasActiveInsurancePlans();
  if (insuranceOffered && totalValue > FREE_INSURANCE_LIMIT && !insured) {
    return { error: `Transfers over $${FREE_INSURANCE_LIMIT.toLocaleString()} require insurance protection.` };
  }
  // When a plan is chosen, the user must confirm the fee has been paid. The
  // insurance is then "requested" and an admin adds (activates) it.
  const feePaid = insured && payload?.feePaid === true;
  if (insured && !feePaid) {
    return { error: "Please confirm the insurance fee has been paid to continue." };
  }
  const insuranceStatus = insured ? "REQUESTED" : "NONE";

  const dtc = getBrokerage(destBrokerage)?.dtc || "0000";
  const reference = genReference(source.accountNumber, dtc, isInternal);

  let created;
  let status = "PENDING";
  try {
    created = await prisma.transfer.create({
      data: {
        reference,
        userId: session.sub,
        sourceAccountId: source.id,
        destAccountId,
        destBrokerage,
        method: isInternal ? "INTERNAL" : "EXTERNAL",
        recipientHolder,
        recipientNumber,
        recipientType,
        transferType: transferType === "FULL" ? "FULL" : "PARTIAL",
        status: "PENDING",
        totalValue,
        items: JSON.stringify(items),
        insured,
        insurancePlan: insured ? planId : "none",
        insurancePremium: insurancePremiumAmt,
        coverageAmount,
        insuranceStatus,
        insuranceFeePaid: feePaid,
      },
    });

    // Internal transfers settle instantly (between the user's own accounts).
    if (isInternal) {
      await settleTransfer(created.id);
      status = "SETTLED";
    }
  } catch (e) {
    console.error("createTransferAction failed:", e);
    return { error: "We couldn't complete the transfer. Please try again." };
  }

  revalidatePath("/");
  revalidatePath("/transfers");
  revalidatePath("/ira");
  revalidatePath("/admin/transfers");
  return { ok: true, id: created.id, reference, status, method: isInternal ? "INTERNAL" : "EXTERNAL", totalValue, count: items.length, insured, coverageAmount, insurancePremium: insurancePremiumAmt };
}
