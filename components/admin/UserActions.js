"use client";

import { useState, useTransition } from "react";
import { setUserRole, setUserStatus, setKycStatus } from "@/app/actions/admin";

export default function UserActions({ id, role, status, kycStatus, isSelf }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");

  function run(fn) {
    setErr("");
    start(async () => {
      const res = await fn();
      if (res?.error) setErr(res.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {isSelf ? (
        <span className="text-[11px] text-slate-400">You</span>
      ) : (
        <>
          <Btn disabled={pending} onClick={() => run(() => setUserRole(id, role === "ADMIN" ? "USER" : "ADMIN"))}
            className="border border-slate-200 text-slate-600 hover:bg-slate-50">
            {role === "ADMIN" ? "Revoke admin" : "Make admin"}
          </Btn>
          <Btn disabled={pending} onClick={() => run(() => setUserStatus(id, status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED"))}
            className={status === "SUSPENDED" ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-rose-600 text-white hover:bg-rose-700"}>
            {status === "SUSPENDED" ? "Reactivate" : "Suspend"}
          </Btn>
          <Btn disabled={pending} onClick={() => run(() => setKycStatus(id, kycStatus === "VERIFIED" ? "UNVERIFIED" : "VERIFIED"))}
            className="border border-slate-200 text-slate-600 hover:bg-slate-50">
            {kycStatus === "VERIFIED" ? "Revoke KYC" : "Verify KYC"}
          </Btn>
        </>
      )}
      {err && <span className="text-[11px] text-rose-600 w-full text-right">{err}</span>}
    </div>
  );
}

function Btn({ className, children, ...rest }) {
  return (
    <button {...rest} className={`rounded-md px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50 ${className}`}>
      {children}
    </button>
  );
}
