"use client";

import { useState, useTransition } from "react";
import { setTransferInsuranceStatus } from "@/app/actions/admin";

export default function InsuranceActions({ id, insured, status, plan, premium }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");

  function act(next) {
    setErr("");
    start(async () => {
      const res = await setTransferInsuranceStatus(id, next);
      if (res?.error) setErr(res.error);
    });
  }

  if (!insured) return <span className="text-xs text-slate-400">—</span>;

  return (
    <div className="space-y-1.5">
      <div className="text-[11px] text-slate-500">{plan} · {premium}</div>
      {status === "REQUESTED" && (
        <div className="flex flex-wrap gap-1.5">
          <Btn tone="add" disabled={pending} onClick={() => act("ADDED")}>Add insurance</Btn>
          <Btn tone="decline" disabled={pending} onClick={() => act("DECLINED")}>Decline</Btn>
        </div>
      )}
      {status === "ADDED" && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-emerald-600">Active ✓</span>
          <Btn tone="ghost" disabled={pending} onClick={() => act("DECLINED")}>Revoke</Btn>
        </div>
      )}
      {status === "DECLINED" && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-rose-600">Declined</span>
          <Btn tone="ghost" disabled={pending} onClick={() => act("ADDED")}>Add</Btn>
        </div>
      )}
      {err && <div className="text-[11px] text-rose-600">{err}</div>}
    </div>
  );
}

function Btn({ tone, children, ...rest }) {
  const tones = {
    add: "bg-emerald-600 text-white hover:bg-emerald-700",
    decline: "bg-rose-600 text-white hover:bg-rose-700",
    ghost: "border border-slate-200 text-slate-600 hover:bg-slate-50",
  };
  return (
    <button {...rest} className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition disabled:opacity-50 ${tones[tone]}`}>
      {children}
    </button>
  );
}
