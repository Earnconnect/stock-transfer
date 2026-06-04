import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

// All securities in the catalog (cached per request via React cache()).
export const getStocks = cache(async () => {
  return prisma.stock.findMany({ orderBy: { available: "desc" } });
});

// Only the active/listed securities (for user-facing pickers).
export const getActiveStocks = cache(async () => {
  return prisma.stock.findMany({ where: { active: true }, orderBy: { available: "desc" } });
});

// Map of symbol -> stock, for quick lookups when enriching positions.
export const getStockMap = cache(async () => {
  const stocks = await getStocks();
  const map = {};
  for (const s of stocks) map[s.symbol] = s;
  return map;
});

// Attach price / name / sector / assetType onto raw positions so the shared
// value + eligibility helpers (which read p.price / p.assetType) keep working.
export function enrichPositions(positions, stockMap) {
  return positions.map((p) => {
    const s = stockMap[p.symbol];
    return {
      ...p,
      price: s?.price ?? 0,
      name: s?.name ?? p.symbol,
      sector: s?.sector ?? "—",
      assetType: s?.assetType ?? "review",
    };
  });
}
