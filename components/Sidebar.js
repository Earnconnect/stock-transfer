"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard", icon: "grid" },
  { href: "/stocks", label: "Bulk Securities", icon: "list" },
  { href: "/transfer", label: "Initiate Transfer", icon: "swap" },
  { href: "/withdraw", label: "Withdraw", icon: "download" },
  { href: "/transfers", label: "Transfer History", icon: "clock" },
  { href: "/ira", label: "IRA Accounts", icon: "shield" },
];

const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: "grid" },
  { href: "/admin/transfers", label: "Transfers", icon: "swap" },
  { href: "/admin/accounts", label: "Funds & Holdings", icon: "wallet" },
  { href: "/admin/securities", label: "Securities", icon: "list" },
  { href: "/admin/users", label: "Users", icon: "users" },
];

function Icon({ name, className = "h-[18px] w-[18px]" }) {
  const paths = {
    grid: "M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z",
    list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
    swap: "M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4",
    clock: "M12 7v5l3 2M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z",
    download: "M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2",
    shield: "M12 3l7 4v5c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V7l7-4z",
    users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    wallet: "M3 7h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zm0 0l2-3h12M17 13h.01",
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={paths[name]} />
    </svg>
  );
}

// Exact match for "/", "/transfer"; prefix match otherwise. Guards the
// /transfer vs /transfers overlap so only one is highlighted.
function isActive(pathname, href) {
  if (href === "/") return pathname === "/";
  if (href === "/transfer") return pathname === "/transfer";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({ item, active }) {
  return (
    <Link
      href={item.href}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-brand-600/15 text-white ring-1 ring-inset ring-brand-500/30"
          : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
      }`}
    >
      <span className={active ? "text-brand-400" : "text-slate-500 group-hover:text-slate-300"}>
        <Icon name={item.icon} />
      </span>
      {item.label}
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-400" />}
    </Link>
  );
}

export default function Sidebar({ role = "USER" }) {
  const pathname = usePathname();
  const isAdminArea = pathname.startsWith("/admin");

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-20 border-r border-slate-800 bg-slate-900 text-slate-300">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-800">
        <div className="relative grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg ring-1 ring-white/10">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <path d="M3 12l9-9 9 9M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="leading-tight">
          <div className="font-semibold text-white tracking-tight">Meridian</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Transfer & Custody</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">Platform</div>
        {NAV.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}

        {role === "ADMIN" && (
          <>
            <div className="px-3 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-wider text-amber-500/80 flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-amber-400" /> Administration
            </div>
            {ADMIN_NAV.map((item) => (
              <NavLink key={item.href} item={item} active={item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)} />
            ))}
          </>
        )}
      </nav>

      {/* Compliance footer */}
      <div className="px-4 py-4 border-t border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 text-emerald-400">
            <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 1 1 8 0v4" />
          </svg>
          <span>256-bit TLS · SOC 2 aligned</span>
        </div>
      </div>
    </aside>
  );
}
