"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getStockMap } from "@/lib/catalog";
import { getBrokerage, getIraType } from "@/lib/data";

// Link (connect) an external brokerage account to the platform.
// In a real build this would run through an aggregator like Plaid / SnapTrade;
// here the user supplies the account + holdings, which we trust for the demo.
export async function linkAccountAction(payload) {
  const session = await getSession();
  if (!session?.sub) return { error: "Your session has expired. Please sign in again." };

  const { brokerage, type, accountNumber, holder, positions } = payload || {};

  const broker = getBrokerage(brokerage);
  if (!broker) return { error: "Please choose a valid brokerage." };
  if (!getIraType(type)) return { error: "Please choose a valid account type." };
  if (!accountNumber || accountNumber.trim().length < 3) return { error: "Enter a valid account number." };
  if (!holder || holder.trim().length < 2) return { error: "Enter the account holder name." };

  // Validate & clean holdings (drop unknown symbols and non-positive shares).
  const stockMap = await getStockMap();
  const clean = (Array.isArray(positions) ? positions : [])
    .map((p) => ({ symbol: String(p.symbol || "").toUpperCase(), shares: Number(p.shares) }))
    .filter((p) => stockMap[p.symbol] && p.shares > 0);

  // Prevent linking the exact same account twice.
  const dupe = await prisma.account.findFirst({
    where: { userId: session.sub, brokerage, accountNumber: accountNumber.trim() },
  });
  if (dupe) return { error: "That account is already linked to your profile." };

  await prisma.account.create({
    data: {
      userId: session.sub,
      type,
      brokerage,
      label: `${broker.short} ${getIraType(type).name}`,
      accountNumber: accountNumber.trim(),
      holder: holder.trim(),
      opened: String(new Date().getFullYear()),
      status: "ACTIVE",
      origin: "LINKED",
      positions: { create: clean.map((p) => ({ symbol: p.symbol, shares: p.shares })) },
    },
  });

  revalidatePath("/ira");
  revalidatePath("/");
  revalidatePath("/transfer");
  return { ok: true };
}
