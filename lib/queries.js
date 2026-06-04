import "server-only";
import { prisma } from "@/lib/prisma";
import { getStockMap, enrichPositions } from "@/lib/catalog";

// ---- user-scoped reads ----
export async function getUserAccounts(userId, { includeClosed = false } = {}) {
  const [accounts, stockMap] = await Promise.all([
    prisma.account.findMany({
      where: { userId, ...(includeClosed ? {} : { status: "ACTIVE" }) },
      include: { positions: true },
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    }),
    getStockMap(),
  ]);
  return accounts.map((a) => ({ ...a, positions: enrichPositions(a.positions, stockMap) }));
}

// All accounts across users (admin), with owner + enriched positions.
export async function getAllAccounts() {
  const [accounts, stockMap] = await Promise.all([
    prisma.account.findMany({
      include: { positions: true, user: { select: { name: true, email: true } } },
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    }),
    getStockMap(),
  ]);
  return accounts.map((a) => ({ ...a, positions: enrichPositions(a.positions, stockMap) }));
}

export async function getAccountById(id) {
  const [account, stockMap] = await Promise.all([
    prisma.account.findUnique({
      include: { positions: true, user: { select: { name: true, email: true } } },
      where: { id },
    }),
    getStockMap(),
  ]);
  if (!account) return null;
  return { ...account, positions: enrichPositions(account.positions, stockMap) };
}

export function getUserTransfers(userId) {
  return prisma.transfer.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { source: { select: { brokerage: true, label: true } } },
  });
}

export function getUserWithdrawals(userId) {
  return prisma.withdrawal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { account: { select: { label: true, brokerage: true } } },
  });
}

// A single transfer the user owns, with both ends loaded — for tracking.
export function getUserTransfer(userId, id) {
  return prisma.transfer.findFirst({
    where: { id, userId },
    include: {
      source: { select: { brokerage: true, label: true, accountNumber: true } },
      dest: { select: { brokerage: true, label: true, accountNumber: true } },
    },
  });
}

// ---- admin reads ----
export function getAllUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { accounts: true, transfers: true } } },
  });
}

export function getAllTransfers() {
  return prisma.transfer.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } }, source: { select: { label: true, brokerage: true } } },
  });
}

export async function getAdminStats() {
  const [users, admins, accounts, transfers, pending, approved, settled, agg] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.account.count(),
    prisma.transfer.count(),
    prisma.transfer.count({ where: { status: "PENDING" } }),
    prisma.transfer.count({ where: { status: "APPROVED" } }),
    prisma.transfer.count({ where: { status: "SETTLED" } }),
    prisma.transfer.aggregate({ _sum: { totalValue: true } }),
  ]);
  return {
    users,
    admins,
    accounts,
    transfers,
    pending,
    approved,
    settled,
    totalValue: agg._sum.totalValue || 0,
  };
}

// Parse the JSON items column safely.
export function parseItems(transfer) {
  try {
    return JSON.parse(transfer.items || "[]");
  } catch {
    return [];
  }
}
