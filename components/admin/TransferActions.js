"use client";

import { useState, useTransition } from "react";
import { setTransferStatus } from "@/app/actions/admin";

export default function TransferActions({ id, status }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");

  function act(next) {
    setErr("");
    start(async () => {
      const res = await setTransferStatus(id, next);
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
      {err && <span className="text-[11px] text-rose-600">{err}</span>}
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
