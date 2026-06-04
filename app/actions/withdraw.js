"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getStockMap } from "@/lib/catalog";

const FEDERAL_WITHHOLDING = 0.10; // default federal income tax withholding on IRA distributions
const EARLY_PENALTY = 0.10;       // IRS 10% additional tax on early distributions (IRC § 72(t))

function genRefs(accountNumber) {
  const now = new Date();
  const ym = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const seed = Math.abs(accountNumber.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 5));
  const n = (seed % 9000) + 1000;
  return { reference: `WD-${ym}-${n}`, form1099R: `1099R-${ym}-${(seed % 90000) + 10000}` };
}

// Compute the IRS breakdown for a gross distribution.
function distributionBreakdown(gross, isEarly = true) {
  const penaltyRate = isEarly ? EARLY_PENALTY : 0;
  const taxRate = FEDERAL_WITHHOLDING;
  const penalty = gross * penaltyRate;
  const tax = gross * taxRate;
  const net = gross - penalty - tax;
  return { gross, penaltyRate, penalty, taxRate, tax, net };
}

export async function withdrawAction(payload) {
  const session = await getSession();
  if (!session?.sub) return { error: "Your session has expired. Please sign in again." };

  const me = await prisma.user.findUnique({ where: { id: session.sub } });
  if (me?.kycStatus !== "VERIFIED") return { error: "Identity verification is required before withdrawing.", needsKyc: true };

  const { accountId, cashAmount = 0, symbols = [], isEarly = true } = payload || {};
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: session.sub },
    include: { positions: true },
  });
  if (!account) return { error: "Invalid account." };

  const cash = Math.max(0, Number(cashAmount) || 0);
  if (cash > account.cashBalance + 1e-6) return { error: "Cash amount exceeds the available balance." };

  const liquidate = account.positions.filter((p) => Array.isArray(symbols) && symbols.includes(p.symbol));
  const stockMap = await getStockMap();
  const items = liquidate.map((p) => {
    const s = stockMap[p.symbol];
    return { symbol: p.symbol, shares: p.shares, value: (s?.price || 0) * p.shares };
  });
  const liquidatedValue = items.reduce((s, i) => s + i.value, 0);

  const gross = cash + liquidatedValue;
  if (gross <= 0) return { error: "Enter a cash amount or select positions to withdraw." };

  const b = distributionBreakdown(gross, !!isEarly);
  const { reference, form1099R } = genRefs(account.accountNumber);

  await prisma.$transaction(async (tx) => {
    // Debit: remove liquidated positions and the cash portion.
    if (liquidate.length) {
      await tx.position.deleteMany({ where: { accountId: account.id, symbol: { in: liquidate.map((p) => p.symbol) } } });
    }
    if (cash > 0) {
      await tx.account.update({ where: { id: account.id }, data: { cashBalance: account.cashBalance - cash } });
    }
    await tx.withdrawal.create({
      data: {
        reference, userId: session.sub, accountId: account.id,
        isEarly: !!isEarly, gross: b.gross,
        penaltyRate: b.penaltyRate, penalty: b.penalty,
        taxRate: b.taxRate, tax: b.tax, net: b.net,
        items: JSON.stringify(items), cashPortion: cash,
        form1099R, irsReportedAt: new Date(), status: "REPORTED",
      },
    });
  });

  revalidatePath("/withdraw");
  revalidatePath("/ira");
  revalidatePath("/");
  return { ok: true, reference, form1099R, ...b };
}
