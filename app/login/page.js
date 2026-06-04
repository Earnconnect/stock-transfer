"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, registerAction } from "@/app/actions/auth";

function SubmitButton({ label }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? "Please wait…" : label}
    </button>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [loginState, login] = useActionState(loginAction, {});
  const [regState, register] = useActionState(registerAction, {});
  const state = mode === "login" ? loginState : regState;

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-slate-900 via-brand-900 to-brand-800 p-12 text-white overflow-hidden">
        <div className="bg-grid absolute inset-0 opacity-30" />
        <div className="relative flex items-center gap-3">
          <div className="grid place-items-center h-11 w-11 rounded-xl bg-white/10 ring-1 ring-white/20">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
              <path d="M3 12l9-9 9 9M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-lg tracking-tight">Meridian Transfer</div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-white/50">Transfer & Custody</div>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-3xl font-semibold leading-tight">Institutional-grade IRA &amp; equity transfers.</h1>
          <p className="mt-4 text-white/70">
            Browse bulk securities, verify IRS/IRA eligibility, and initiate ACATS transfers between
            brokerages — all from one secure console.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            <span className="rounded-md bg-white/10 px-2.5 py-1 ring-1 ring-inset ring-white/15">256-bit TLS</span>
            <span className="rounded-md bg-white/10 px-2.5 py-1 ring-1 ring-inset ring-white/15">SIPC aware</span>
            <span className="rounded-md bg-white/10 px-2.5 py-1 ring-1 ring-inset ring-white/15">ACATS / NSCC</span>
          </div>
        </div>

        <div className="relative text-[11px] text-white/40">
          Demonstration environment — holdings &amp; transfers are simulated. © Meridian Transfer.
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 bg-slate-100">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-6 flex items-center gap-2">
            <div className="grid place-items-center h-9 w-9 rounded-lg bg-brand-700 text-white text-xs font-bold">M</div>
            <span className="font-semibold text-slate-900">Meridian Transfer</span>
          </div>

          <div className="card-pad">
            {/* Tabs */}
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 mb-5">
              {[["login", "Sign in"], ["register", "Create account"]].map(([k, l]) => (
                <button key={k} onClick={() => setMode(k)}
                  className={`rounded-md py-1.5 text-sm font-medium transition ${mode === k ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  {l}
                </button>
              ))}
            </div>

            {state?.error && (
              <div className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-600/20">
                {state.error}
              </div>
            )}

            {mode === "login" ? (
              <form action={login} className="space-y-4">
                <Labeled label="Email">
                  <input name="email" type="email" autoComplete="email" required className="field" placeholder="you@example.com" />
                </Labeled>
                <Labeled label="Password">
                  <input name="password" type="password" autoComplete="current-password" required className="field" placeholder="••••••••" />
                </Labeled>
                <SubmitButton label="Sign in" />
              </form>
            ) : (
              <form action={register} className="space-y-4">
                <Labeled label="Full name">
                  <input name="name" type="text" required className="field" placeholder="Jane Doe" />
                </Labeled>
                <Labeled label="Email">
                  <input name="email" type="email" autoComplete="email" required className="field" placeholder="you@example.com" />
                </Labeled>
                <Labeled label="Password">
                  <input name="password" type="password" autoComplete="new-password" required className="field" placeholder="At least 8 characters" />
                </Labeled>
                <SubmitButton label="Create account" />
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function Labeled({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
