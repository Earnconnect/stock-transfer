"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";

// Primary destinations shown in the bottom tab bar.
const TABS = [
  { href: "/", label: "Home", icon: "grid" },
  { href: "/stocks", label: "Markets", icon: "list" },
  { href: "/transfer", label: "Transfer", icon: "swap" },
  { href: "/withdraw", label: "Withdraw", icon: "download" },
];

// Everything, for the slide-in drawer.
const MAIN = [
  { href: "/", label: "Dashboard", icon: "grid" },
  { href: "/stocks", label: "Bulk Securities", icon: "list" },
  { href: "/transfer", label: "Initiate Transfer", icon: "swap" },
  { href: "/withdraw", label: "Withdraw", icon: "download" },
  { href: "/transfers", label: "Transfer History", icon: "clock" },
  { href: "/ira", label: "IRA Accounts", icon: "shield" },
  { href: "/verify", label: "Identity Verification", icon: "badge" },
];
const ADMIN = [
  { href: "/admin", label: "Admin Overview", icon: "grid" },
  { href: "/admin/transfers", label: "Transfers", icon: "swap" },
  { href: "/admin/accounts", label: "Funds & Holdings", icon: "wallet" },
  { href: "/admin/securities", label: "Securities", icon: "list" },
  { href: "/admin/users", label: "Users", icon: "users" },
];

const PATHS = {
  grid: "M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  swap: "M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4",
  download: "M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2",
  clock: "M12 7v5l3 2M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z",
  shield: "M12 3l7 4v5c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V7l7-4z",
  badge: "M12 3l7 4v5c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V7l7-4zM9 12l2 2 4-4",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  wallet: "M3 7h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zm0 0l2-3h12M17 13h.01",
  menu: "M4 6h16M4 12h16M4 18h16",
};

function Icon({ name, className = "h-[22px] w-[22px]" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={PATHS[name]} />
    </svg>
  );
}

function isActive(pathname, href) {
  if (href === "/") return pathname === "/";
  if (href === "/transfer") return pathname === "/transfer";
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function MobileNav({ role = "USER", user }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the drawer whenever the route changes.
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const initials = (user?.name || "").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <>
      {/* Bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur safe-bottom">
        <div className="grid grid-cols-5">
          {TABS.map((t) => {
            const active = isActive(pathname, t.href);
            return (
              <Link key={t.href} href={t.href} className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${active ? "text-brand-700" : "text-slate-400"}`}>
                <Icon name={t.icon} className="h-[22px] w-[22px]" />
                {t.label}
              </Link>
            );
          })}
          <button onClick={() => setOpen(true)} className="flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-slate-400">
            <Icon name="menu" className="h-[22px] w-[22px]" />
            Menu
          </button>
        </div>
      </nav>

      {/* Drawer */}
      <div className={`md:hidden fixed inset-0 z-40 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div onClick={() => setOpen(false)} className={`absolute inset-0 bg-slate-900/50 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} />
        <aside className={`absolute right-0 top-0 h-full w-[82%] max-w-sm bg-slate-900 text-slate-300 shadow-2xl transition-transform duration-300 ease-out flex flex-col ${open ? "translate-x-0" : "translate-x-full"}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 h-16 border-b border-slate-800 safe-top">
            <div className="flex items-center gap-3">
              <div className="grid place-items-center h-10 w-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white text-sm font-semibold">{initials || "M"}</div>
              <div className="leading-tight">
                <div className="font-semibold text-white text-sm">{user?.name || "Account"}</div>
                <div className="text-[11px] text-slate-500">{role === "ADMIN" ? "Administrator" : "Premier Client"}</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="grid place-items-center h-9 w-9 rounded-lg text-slate-400 hover:bg-slate-800">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
            </button>
          </div>

          {/* Nav */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {MAIN.map((item) => (
              <DrawerLink key={item.href} item={item} active={isActive(pathname, item.href)} />
            ))}

            {role === "ADMIN" && (
              <>
                <div className="px-3 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-wider text-amber-500/80">Administration</div>
                {ADMIN.map((item) => (
                  <DrawerLink key={item.href} item={item} active={isActive(pathname, item.href)} />
                ))}
              </>
            )}
          </div>

          {/* Sign out */}
          <div className="px-3 py-4 border-t border-slate-800 safe-bottom">
            <form action={logoutAction}>
              <button type="submit" className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                Sign out
              </button>
            </form>
          </div>
        </aside>
      </div>
    </>
  );
}

function DrawerLink({ item, active }) {
  return (
    <Link href={item.href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${active ? "bg-brand-600/15 text-white ring-1 ring-inset ring-brand-500/30" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"}`}>
      <span className={active ? "text-brand-400" : "text-slate-500"}><Icon name={item.icon} className="h-[18px] w-[18px]" /></span>
      {item.label}
    </Link>
  );
}
