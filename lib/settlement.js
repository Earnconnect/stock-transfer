import "server-only";
import { prisma } from "@/lib/prisma";

// External (ACATS) lifecycle stages for the tracking UI.
export const STAGES = [
  { key: "SUBMITTED", title: "Request received", note: "Transfer Initiation Form (TIF) validated & queued" },
  { key: "APPROVED", title: "Delivering firm review", note: "Delivering firm validates positions for transfer" },
  { key: "REGISTERED", title: "Asset registration", note: "NSCC / DTCC matches and registers the assets" },
  { key: "SETTLED", title: "Settlement complete", note: "Assets delivered to the receiving account" },
];

// Internal (on-platform) transfers settle immediately — just two stages.
export const INTERNAL_STAGES = [
  { key: "SUBMITTED", title: "Transfer initiated", note: "Validated between your linked accounts" },
  { key: "SETTLED", title: "Delivered", note: "Assets moved to the receiving account" },
];

export function stagesFor(transfer) {
  return transfer?.method === "INTERNAL" ? INTERNAL_STAGES : STAGES;
}

// Number of completed stages for a transfer (used for the progress bar).
export function progressFor(transfer) {
  if (transfer?.method === "INTERNAL") {
    return transfer.status === "SETTLED" ? INTERNAL_STAGES.length : 1;
  }
  switch (transfer?.status) {
    case "PENDING": return 1;
    case "APPROVED": return 3;
    case "SETTLED": return 4;
    case "REJECTED": return 1;
    default: return 1;
  }
}

// Approve a pending transfer (no asset movement yet — "in transit").
export async function approveTransfer(transferId) {
  return prisma.transfer.update({
    where: { id: transferId },
    data: { status: "APPROVED", approvedAt: new Date(), rejectedAt: null },
  });
}

export async function rejectTransfer(transferId, note) {
  return prisma.transfer.update({
    where: { id: transferId },
    data: { status: "REJECTED", rejectedAt: new Date(), note: note || null },
  });
}

// Settle a transfer and ACTUALLY move the assets.
//  - INTERNAL: credit the positions into the user's own (on-platform) receiving
//    account, then debit the source. Stays entirely within Meridian.
//  - EXTERNAL: the assets leave the platform for another firm. We debit the
//    source and keep the transfer as a record — we do NOT create an on-platform
//    account, because the receiving account lives at the other brokerage.
export async function settleTransfer(transferId) {
  return prisma.$transaction(async (tx) => {
    const transfer = await tx.transfer.findUnique({ where: { id: transferId } });
    if (!transfer) throw new Error("Transfer not found");
    if (transfer.status === "SETTLED") return transfer;

    const items = JSON.parse(transfer.items || "[]");
    const symbols = items.map((i) => i.symbol);
    const isInternal = transfer.method === "INTERNAL";

    // 1) INTERNAL only: credit the receiving (own) account.
    if (isInternal) {
      const dest = transfer.destAccountId
        ? await tx.account.findFirst({ where: { id: transfer.destAccountId, userId: transfer.userId } })
        : null;
      if (!dest) throw new Error("Internal destination account not found");
      for (const item of items) {
        const existing = await tx.position.findFirst({ where: { accountId: dest.id, symbol: item.symbol } });
        if (existing) {
          await tx.position.update({ where: { id: existing.id }, data: { shares: existing.shares + item.shares } });
        } else {
          await tx.position.create({ data: { accountId: dest.id, symbol: item.symbol, shares: item.shares } });
        }
      }
    }

    // 2) Debit the source account (applies to both internal & external).
    await tx.position.deleteMany({ where: { accountId: transfer.sourceAccountId, symbol: { in: symbols } } });

    // 3) Close the source account if it's now empty (or a full transfer).
    const remaining = await tx.position.count({ where: { accountId: transfer.sourceAccountId } });
    if (transfer.transferType === "FULL" || remaining === 0) {
      await tx.account.update({ where: { id: transfer.sourceAccountId }, data: { status: "CLOSED" } });
    }

    // 4) Finalize. destAccountId stays null for external (off-platform).
    return tx.transfer.update({
      where: { id: transferId },
      data: { status: "SETTLED", settledAt: new Date() },
    });
  });
}
