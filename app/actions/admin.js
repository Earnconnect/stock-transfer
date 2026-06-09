"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";
import { approveTransfer, rejectTransfer, settleTransfer } from "@/lib/settlement";

async function ensureAdmin() {
  const session = await getSession();
  if (session?.role !== "ADMIN") throw new Error("Forbidden");
  return session;
}

const ASSET_TYPES = ["stock", "etf", "mutual_fund", "bond", "commodity_etf", "collectible", "life_insurance", "crypto"];
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------- Securities (catalog) management ----------------
export async function addStock(data) {
  await ensureAdmin();
  const symbol = String(data?.symbol || "").trim().toUpperCase();
  const name = String(data?.name || "").trim();
  const sector = String(data?.sector || "").trim() || "General";
  const assetType = ASSET_TYPES.includes(data?.assetType) ? data.assetType : "stock";
  const price = Number(data?.price);
  const change = Number(data?.change) || 0;
  const available = Math.max(0, Math.floor(Number(data?.available) || 0));

  if (symbol.length < 1) return { error: "Symbol is required." };
  if (name.length < 2) return { error: "Name is required." };
  if (!(price > 0)) return { error: "Price must be greater than zero." };

  const exists = await prisma.stock.findUnique({ where: { symbol } });
  if (exists) return { error: `Symbol ${symbol} already exists.` };

  await prisma.stock.create({ data: { symbol, name, sector, assetType, price, change, available } });
  revalidateCatalog();
  return { ok: true };
}

export async function updateStock(id, data) {
  await ensureAdmin();
  const patch = {};
  if (data.price !== undefined) { const p = Number(data.price); if (p > 0) patch.price = p; }
  if (data.available !== undefined) patch.available = Math.max(0, Math.floor(Number(data.available) || 0));
  if (data.change !== undefined) patch.change = Number(data.change) || 0;
  if (Object.keys(patch).length === 0) return { error: "Nothing to update." };
  await prisma.stock.update({ where: { id }, data: patch });
  revalidateCatalog();
  return { ok: true };
}

export async function toggleStock(id, active) {
  await ensureAdmin();
  await prisma.stock.update({ where: { id }, data: { active: !!active } });
  revalidateCatalog();
  return { ok: true };
}

function revalidateCatalog() {
  revalidatePath("/admin/securities");
  revalidatePath("/stocks");
  revalidatePath("/transfer");
  revalidatePath("/link");
  revalidatePath("/");
}

// ---------------- Member funds & holdings ----------------
export async function addFunds(accountId, amount) {
  await ensureAdmin();
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt === 0) return { error: "Enter a non-zero amount." };
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) return { error: "Account not found." };
  const next = account.cashBalance + amt;
  if (next < 0) return { error: "Insufficient cash for that withdrawal." };
  await prisma.account.update({ where: { id: accountId }, data: { cashBalance: next } });
  revalidateAccounts();
  return { ok: true };
}

export async function addHolding(accountId, symbol, shares) {
  await ensureAdmin();
  const sym = String(symbol || "").trim().toUpperCase();
  const qty = Number(shares);
  if (!sym) return { error: "Choose a security." };
  if (!(qty > 0)) return { error: "Shares must be greater than zero." };
  const stock = await prisma.stock.findUnique({ where: { symbol: sym } });
  if (!stock) return { error: "Unknown security." };
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) return { error: "Account not found." };

  const existing = await prisma.position.findFirst({ where: { accountId, symbol: sym } });
  if (existing) {
    await prisma.position.update({ where: { id: existing.id }, data: { shares: existing.shares + qty } });
  } else {
    await prisma.position.create({ data: { accountId, symbol: sym, shares: qty } });
  }
  revalidateAccounts();
  return { ok: true };
}

export async function removeHolding(positionId) {
  await ensureAdmin();
  await prisma.position.delete({ where: { id: positionId } });
  revalidateAccounts();
  return { ok: true };
}

function revalidateAccounts() {
  revalidatePath("/admin/accounts");
  revalidatePath("/admin");
  revalidatePath("/ira");
  revalidatePath("/");
}

// ---------------- Users ----------------
export async function createUser(data) {
  await ensureAdmin();
  const name = String(data?.name || "").trim();
  const email = String(data?.email || "").trim().toLowerCase();
  const password = String(data?.password || "");
  const role = data?.role === "ADMIN" ? "ADMIN" : "USER";

  if (name.length < 2) return { error: "Enter the user's full name." };
  if (!emailRe.test(email)) return { error: "Enter a valid email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "A user with that email already exists." };

  await prisma.user.create({ data: { name, email, role, passwordHash: await hashPassword(password) } });
  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { ok: true };
}

function revalidateTransfers() {
  revalidatePath("/admin/transfers");
  revalidatePath("/admin");
  revalidatePath("/transfers");
  revalidatePath("/ira");
  revalidatePath("/");
}

export async function setTransferStatus(transferId, status, note) {
  await ensureAdmin();
  try {
    if (status === "APPROVED") await approveTransfer(transferId);
    else if (status === "REJECTED") await rejectTransfer(transferId, note);
    else if (status === "SETTLED") await settleTransfer(transferId); // moves the assets
    else if (status === "PENDING") {
      // Only allow reopening a REJECTED transfer (settled is terminal).
      const t = await prisma.transfer.findUnique({ where: { id: transferId } });
      if (t?.status !== "REJECTED") return { error: "Only rejected transfers can be reopened." };
      await prisma.transfer.update({
        where: { id: transferId },
        data: { status: "PENDING", rejectedAt: null, note: null },
      });
    } else {
      return { error: "Invalid status." };
    }
  } catch (e) {
    return { error: "Could not update transfer: " + (e?.message || "unknown error") };
  }
  revalidateTransfers();
  return { ok: true };
}

export async function setUserRole(userId, role) {
  const session = await ensureAdmin();
  if (!["USER", "ADMIN"].includes(role)) return { error: "Invalid role." };
  if (userId === session.sub && role !== "ADMIN") {
    return { error: "You cannot remove your own admin access." };
  }
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setTransferInsuranceStatus(transferId, status) {
  await ensureAdmin();
  if (!["ADDED", "DECLINED", "REQUESTED"].includes(status)) return { error: "Invalid status." };
  await prisma.transfer.update({ where: { id: transferId }, data: { insuranceStatus: status } });
  revalidatePath("/admin/transfers");
  revalidatePath("/transfers");
  return { ok: true };
}

export async function setInsurancePlan(id, price, active) {
  await ensureAdmin();
  if (!["standard", "premium"].includes(id)) return { error: "Invalid plan." };
  const p = Number(price);
  if (!Number.isFinite(p) || p < 0) return { error: "Enter a valid price (0 or more)." };
  await prisma.insurancePlan.update({ where: { id }, data: { price: Math.round(p * 100) / 100, active: !!active } });
  revalidatePath("/admin/insurance");
  revalidatePath("/transfer");
  return { ok: true };
}

export async function setKycStatus(userId, status) {
  await ensureAdmin();
  if (!["VERIFIED", "UNVERIFIED", "PENDING", "REJECTED"].includes(status)) return { error: "Invalid status." };
  await prisma.user.update({
    where: { id: userId },
    data: { kycStatus: status, kycVerifiedAt: status === "VERIFIED" ? new Date() : null },
  });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setUserStatus(userId, status) {
  const session = await ensureAdmin();
  if (!["ACTIVE", "SUSPENDED"].includes(status)) return { error: "Invalid status." };
  if (userId === session.sub) return { error: "You cannot suspend your own account." };
  await prisma.user.update({ where: { id: userId }, data: { status } });
  revalidatePath("/admin/users");
  return { ok: true };
}
