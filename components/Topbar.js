"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";

const TITLES = {
  "/": { title: "Dashboard", subtitle: "Portfolio overview, eligibility, and transfer network" },
  "/stocks": { title: "Bulk Securities", subtitle: "Available equities & ETFs with IRS / IRA eligibility" },
  "/transfer": { title: "Initiate Transfer", subtitle: "Move IRA holdings between brokerages via ACATS" },
  "/withdraw": { title: "Withdraw Funds", subtitle: "Distributions with IRS tax & early-withdrawal reporting" },
  "/verify": { title: "Identity Verification", subtitle: "KYC / Customer Identification Program" },
  "/transfers": { title: "Transfer History", subtitle: "Track every transfer request and its status" },
  "/ira": { title: "IRA Accounts", subtitle: "Linked retirement accounts and eligibility health" },
  "/link": { title: "Link Account", subtitle: "Connect a brokerage account to your profile" },
  "/admin": { title: "Admin · Overview", subtitle: "Platform-wide activity and controls" },
  "/admin/transfers": { title: "Admin · Transfers", subtitle: "Review and action all transfer requests" },
  "/admin/insurance": { title: "Admin · Insurance", subtitle: "Set transfer-insurance plan pricing" },
  "/admin/accounts": { title: "Admin · Funds & Holdings", subtitle: "Add funds and manage member holdings" },
  "/admin/securities": { title: "Admin · Securities", subtitle: "Manage the tradable securities catalog" },
  "/admin/users": { title: "Admin · Users", subtitle: "Create and manage platform users" },
};

function resolveMeta(pathname) {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith("/transfers/")) return { title: "Track Transfer", subtitle: "Live status and settlement details" };
  return TITLES["/"];
}

function initials(name = "") {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export default function Topbar({ user }) {
  const pathname = usePathname();
  const meta = resolveMeta(pathname);
  const isAdmin = user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/90 backdrop-blur border-b border-slate-200 safe-top">
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Brand mark — mobile only (sidebar is hidden) */}
        <span className="md:hidden grid place-items-center h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M3 12l9-9 9 9M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-[15px] font-semibold text-slate-900 truncate">{meta.title}</h1>
            <span className="hidden sm:inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Live</span>
          </div>
          <p className="text-xs text-slate-400 truncate">{meta.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user?.kycStatus && user.kycStatus !== "VERIFIED" && (
          <Link href="/verify" className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20 hover:bg-amber-100 transition">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Verify identity
          </Link>
        )}
        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Markets Open
        </span>

        <div className="flex items-center gap-2 pl-1">
          <div className="hidden sm:block text-right leading-tight">
            <div className="text-xs font-semibold text-slate-900">{user?.name || "Account"}</div>
            <div className="text-[10px] text-slate-400">{isAdmin ? "Administrator" : "Premier Client"}</div>
          </div>
          <div className={`grid place-items-center h-9 w-9 rounded-full text-white text-xs font-semibold ring-2 ring-white shadow ${isAdmin ? "bg-gradient-to-br from-amber-500 to-amber-700" : "bg-gradient-to-br from-brand-500 to-brand-700"}`}>
            {initials(user?.name) || "•"}
          </div>
        </div>

        <form action={logoutAction} className="hidden md:block">
          <button type="submit" title="Sign out" className="grid place-items-center h-9 w-9 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </form>
      </div>
    </header>
  );
}
