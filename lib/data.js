// ---------------------------------------------------------------------------
// Mock data for the Stock Transfer prototype.
// In a real build these would come from broker APIs (Plaid, SnapTrade, ACATS
// rails, market-data feeds, etc.). Here everything is static & deterministic.
// ---------------------------------------------------------------------------

// Supported brokerages a user can transfer holdings to/from.
// `dtc` is the (illustrative) DTC clearing number used on ACATS forms;
// `clearing` is the back-office clearing firm that custodies the assets.
export const BROKERAGES = [
  { id: "fidelity", name: "Fidelity Investments", short: "Fidelity", color: "#00853f", acats: true, est: "1–3 business days", dtc: "0226", clearing: "National Financial Services LLC", sipc: true },
  { id: "merrill", name: "Merrill Lynch", short: "Merrill", color: "#0a2c6b", acats: true, est: "3–6 business days", dtc: "8862", clearing: "Merrill Lynch, Pierce, Fenner & Smith", sipc: true },
  { id: "schwab", name: "Charles Schwab", short: "Schwab", color: "#0a7ec2", acats: true, est: "3–5 business days", dtc: "0164", clearing: "Charles Schwab & Co., Inc.", sipc: true },
  { id: "vanguard", name: "Vanguard Brokerage", short: "Vanguard", color: "#96151d", acats: true, est: "5–7 business days", dtc: "0062", clearing: "Vanguard Marketing Corporation", sipc: true },
  { id: "etrade", name: "E*TRADE from Morgan Stanley", short: "E*TRADE", color: "#5b2a86", acats: true, est: "2–4 business days", dtc: "0385", clearing: "Morgan Stanley Smith Barney LLC", sipc: true },
  { id: "robinhood", name: "Robinhood Securities", short: "Robinhood", color: "#0a8a2f", acats: true, est: "5–7 business days", dtc: "6769", clearing: "Robinhood Securities, LLC", sipc: true },
];

// IRA account types supported by the platform.
export const IRA_TYPES = [
  { id: "traditional", name: "Traditional IRA", taxNote: "Pre-tax contributions, taxed on withdrawal" },
  { id: "roth", name: "Roth IRA", taxNote: "After-tax contributions, tax-free qualified withdrawals" },
  { id: "sep", name: "SEP IRA", taxNote: "Employer-funded, higher contribution limits" },
  { id: "rollover", name: "Rollover IRA", taxNote: "Holds assets rolled over from a 401(k)/employer plan" },
];

// Transfer insurance plan metadata (names/copy/defaults). Prices are stored in
// the DB and managed by admins — see lib/insurance.js. Coverage is the full
// transfer value. There is always a free "none" option (with a risk warning).
export const INSURANCE_PLAN_META = {
  standard: {
    id: "standard", name: "Standard Protection", defaultPrice: 75,
    blurb: "Covers your assets against settlement failure or loss while in transit.",
    features: ["Full asset-value coverage", "Settlement-failure protection", "Up to 30-day claim window"],
  },
  premium: {
    id: "premium", name: "Premium Protection", defaultPrice: 102,
    blurb: "Everything in Standard, plus market-fluctuation cover and priority handling.",
    features: ["Full asset-value coverage", "Market-fluctuation protection", "Priority claim resolution", "Up to 90-day claim window"],
  },
};

export const INSURANCE_PLAN_ORDER = ["standard", "premium"];

// Transfers above this value must be insured (the free option is unavailable).
export const FREE_INSURANCE_LIMIT = 20;

export function insurancePlanName(id) {
  if (!id || id === "none") return "No protection";
  return INSURANCE_PLAN_META[id]?.name || id;
}

// ---- helpers ----
// The securities catalog now lives in the DB (see lib/catalog.js). Positions
// passed to these helpers are expected to be "enriched" with a `price` field
// (see enrichPositions). `cashBalance` is included in account totals.
export function getBrokerage(id) {
  return BROKERAGES.find((b) => b.id === id);
}

export function getIraType(id) {
  return IRA_TYPES.find((t) => t.id === id);
}

export function positionValue(position) {
  return (position.price || 0) * position.shares;
}

export function accountValue(account) {
  const holdings = (account.positions || []).reduce((sum, p) => sum + positionValue(p), 0);
  return holdings + (account.cashBalance || 0);
}

export function formatMoney(n) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function formatMoneyExact(n) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
