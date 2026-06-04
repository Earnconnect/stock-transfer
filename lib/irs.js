// ---------------------------------------------------------------------------
// IRS / IRA eligibility logic.
//
// This is a simplified model of IRC § 408(m) and related rules that govern
// what an IRA may hold. It is for DEMONSTRATION ONLY and is not tax advice.
//
// General rules reflected here:
//  - Stocks, ETFs, mutual funds, and bonds are permitted in an IRA.
//  - "Collectibles" (art, gems, most metals, antiques) are PROHIBITED under
//    IRC § 408(m). Certain gold/silver bullion/coins meeting fineness rules
//    are an exception, but must be held by an approved custodian.
//  - Life insurance contracts are PROHIBITED in an IRA (IRC § 408(a)(3)).
//  - Cryptocurrency is not explicitly approved; custody requires a self-
//    directed IRA, so we flag it as "restricted".
// ---------------------------------------------------------------------------

const RULES = {
  stock: { status: "approved", reason: "Publicly traded equities are permitted in IRAs." },
  etf: { status: "approved", reason: "Exchange-traded funds are permitted in IRAs." },
  mutual_fund: { status: "approved", reason: "Mutual funds are permitted in IRAs." },
  bond: { status: "approved", reason: "Bonds and bond funds are permitted in IRAs." },
  commodity_etf: { status: "approved", reason: "Commodity ETFs are permitted; the IRA holds shares, not the physical metal." },
  collectible: { status: "prohibited", reason: "Collectibles (art, antiques, non-qualifying metals) are barred under IRC § 408(m)." },
  life_insurance: { status: "prohibited", reason: "Life insurance contracts cannot be held in an IRA (IRC § 408(a)(3))." },
  crypto: { status: "restricted", reason: "Requires a self-directed IRA with a qualified custodian." },
};

const DEFAULT = { status: "review", reason: "Asset type requires manual eligibility review." };

export function getEligibility(assetType) {
  return RULES[assetType] || DEFAULT;
}

export function isApproved(assetType) {
  return getEligibility(assetType).status === "approved";
}

// UI metadata for each status (label + tailwind classes).
export const STATUS_META = {
  approved: {
    label: "IRS Approved",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  restricted: {
    label: "Restricted",
    badge: "bg-amber-50 text-amber-700 ring-amber-600/20",
    dot: "bg-amber-500",
  },
  prohibited: {
    label: "Not Eligible",
    badge: "bg-rose-50 text-rose-700 ring-rose-600/20",
    dot: "bg-rose-500",
  },
  review: {
    label: "Needs Review",
    badge: "bg-slate-100 text-slate-700 ring-slate-500/20",
    dot: "bg-slate-400",
  },
};

export function statusMeta(assetType) {
  return STATUS_META[getEligibility(assetType).status] || STATUS_META.review;
}
