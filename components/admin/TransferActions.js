"use client";

import { useState, useTransition } from "react";
import { setTransferStatus, deleteTransfer } from "@/app/actions/admin";

export default function TransferActions({ id, status, reference }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");

  function act(next) {
    setErr("");
    start(async () => {
      const res = await setTransferStatus(id, next);
      if (res?.error) setErr(res.error);
    });
  }

  function remove() {
    if (!window.confirm(`Delete transfer ${reference || ""} from history? This cannot be undone.`)) return;
    setErr("");
    start(async () => {
      const res = await deleteTransfer(id);
      if (res?.error) setErr(res.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {status === "PENDING" && (
        <>
          <Btn tone="approve" disabled={pending} onClick={() => act("APPROVED")}>Approve</Btn>
          <Btn tone="reject" disabled={pending} onClick={() => act("REJECTED")}>Reject</Btn>
        </>
      )}
      {status === "APPROVED" && (
        <Btn tone="settle" disabled={pending} onClick={() => act("SETTLED")}>Settle &amp; deliver</Btn>
      )}
      {status === "REJECTED" && (
        <Btn tone="ghost" disabled={pending} onClick={() => act("PENDING")}>Reopen</Btn>
      )}
      {status === "SETTLED" && <span className="text-[11px] font-medium text-emerald-600">Delivered ✓</span>}
      <button onClick={remove} disabled={pending} title="Delete from history"
        className="grid place-items-center h-[26px] w-[26px] rounded-md border border-slate-200 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6" />
        </svg>
      </button>
      {err && <span className="text-[11px] text-rose-600 w-full text-right">{err}</span>}
    </div>
  );
}

function Btn({ tone, children, ...rest }) {
  const tones = {
    approve: "bg-emerald-600 text-white hover:bg-emerald-700",
    reject: "bg-rose-600 text-white hover:bg-rose-700",
    settle: "bg-brand-700 text-white hover:bg-brand-800",
    ghost: "border border-slate-200 text-slate-600 hover:bg-slate-50",
  };
  return (
    <button {...rest} className={`rounded-md px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50 ${tones[tone]}`}>
      {children}
    </button>
  );
}
