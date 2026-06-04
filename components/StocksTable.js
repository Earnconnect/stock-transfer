"use client";

import { useMemo, useState } from "react";
import EligibilityBadge from "@/components/EligibilityBadge";
import { formatMoneyExact } from "@/lib/data";
import { getEligibility } from "@/lib/irs";

const FILTERS = [
  { id: "all", label: "All assets" },
  { id: "approved", label: "IRS approved" },
  { id: "restricted", label: "Restricted" },
  { id: "prohibited", label: "Not eligible" },
];

export default function StocksTable({ stocks }) {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("All");
  const [filter, setFilter] = useState("all");
  const [sortKey, setSortKey] = useState("available");

  const sectors = useMemo(() => ["All", ...Array.from(new Set(stocks.map((s) => s.sector)))], [stocks]);

  const rows = useMemo(() => {
    let list = stocks.filter((s) => {
      const matchesQuery =
        !query ||
        s.symbol.toLowerCase().includes(query.toLowerCase()) ||
        s.name.toLowerCase().includes(query.toLowerCase());
      const matchesSector = sector === "All" || s.sector === sector;
      const status = getEligibility(s.assetType).status;
      const matchesFilter = filter === "all" || status === filter;
      return matchesQuery && matchesSector && matchesFilter;
    });
    list = [...list].sort((a, b) => {
      if (sortKey === "price") return b.price - a.price;
      if (sortKey === "symbol") return a.symbol.localeCompare(b.symbol);
      return b.available - a.available;
    });
    return list;
  }, [stocks, query, sector, filter, sortKey]);

  const counts = useMemo(() => {
    const c = { approved: 0, restricted: 0, prohibited: 0 };
    stocks.forEach((s) => { const st = getEligibility(s.assetType).status; c[st] = (c[st] || 0) + 1; });
    return c;
  }, [stocks]);

  return (
    <div className="p-6 space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat label="Total Securities" value={stocks.length} dot="bg-brand-500" />
        <MiniStat label="IRS Approved" value={counts.approved} dot="bg-emerald-500" />
        <MiniStat label="Restricted" value={counts.restricted} dot="bg-amber-500" />
        <MiniStat label="Not Eligible" value={counts.prohibited} dot="bg-rose-500" />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
          </svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search symbol or company…" className="field pl-9" />
        </div>
        <select value={sector} onChange={(e) => setSector(e.target.value)} className="field lg:w-48">
          {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} className="field lg:w-48">
          <option value="available">Sort: Availability</option>
          <option value="price">Sort: Price</option>
          <option value="symbol">Sort: Symbol</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${filter === f.id ? "bg-brand-700 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-sm text-slate-400">{rows.length} results</span>
      </div>

      <div className="overflow-x-auto scroll-thin card">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-200 bg-slate-50/60">
              <th className="px-5 py-3 font-medium">Symbol</th>
              <th className="px-5 py-3 font-medium">Sector</th>
              <th className="px-5 py-3 font-medium text-right">Price</th>
              <th className="px-5 py-3 font-medium text-right">24h</th>
              <th className="px-5 py-3 font-medium text-right">Bulk Available</th>
              <th className="px-5 py-3 font-medium">IRS Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((s) => (
              <tr key={s.symbol} className="hover:bg-slate-50/70 transition">
                <td className="px-5 py-3">
                  <div className="font-semibold text-slate-900">{s.symbol}</div>
                  <div className="text-xs text-slate-400">{s.name}</div>
                </td>
                <td className="px-5 py-3 text-slate-600">{s.sector}</td>
                <td className="px-5 py-3 text-right font-medium text-slate-900 tnum">{formatMoneyExact(s.price)}</td>
                <td className={`px-5 py-3 text-right font-medium tnum ${s.change >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {s.change >= 0 ? "+" : ""}{s.change}%
                </td>
                <td className="px-5 py-3 text-right text-slate-700 tnum">{s.available.toLocaleString()}</td>
                <td className="px-5 py-3"><EligibilityBadge assetType={s.assetType} /></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">No securities match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MiniStat({ label, value, dot }) {
  return (
    <div className="card-pad flex items-center gap-3">
      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
      <div>
        <div className="text-xl font-semibold text-slate-900 tnum leading-none">{value}</div>
        <div className="mt-1 text-[11px] text-slate-400">{label}</div>
      </div>
    </div>
  );
}
