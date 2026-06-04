"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { settleTransfer } from "@/lib/settlement";
import { getStockMap } from "@/lib/catalog";
import { getBrokerage, getIraType } from "@/lib/data";

function genReference(account, dtc, internal) {
  const now = new Date();
  const ym = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const rand = Math.abs(account.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)) % 9000 + 1000;
  return `${internal ? "INT" : "ACT"}-${dtc}-${ym}-${rand}`;
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

  const dtc = getBrokerage(destBrokerage)?.dtc || "0000";
  const reference = genReference(source.accountNumber, dtc, isInternal);

  const created = await prisma.transfer.create({
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
    },
  });

  // Internal transfers settle instantly (on-platform, between the user's own accounts).
  let status = "PENDING";
  if (isInternal) {
    await settleTransfer(created.id);
    status = "SETTLED";
  }

  revalidatePath("/");
  revalidatePath("/transfers");
  revalidatePath("/ira");
  revalidatePath("/admin/transfers");
  return { ok: true, id: created.id, reference, status, method: isInternal ? "INTERNAL" : "EXTERNAL", totalValue, count: items.length };
}
