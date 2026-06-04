"use client";

import { useState, useTransition } from "react";
import { createUser } from "@/app/actions/admin";

const EMPTY = { name: "", email: "", password: "", role: "USER" };

export default function AddUserForm() {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [msg, setMsg] = useState(null);
  const [pending, start] = useTransition();
  const set = (patch) => setF((p) => ({ ...p, ...patch }));

  function submit() {
    setMsg(null);
    start(async () => {
      const res = await createUser(f);
      if (res?.error) setMsg({ error: res.error });
      else { setMsg({ ok: `Created ${f.email}.` }); setF(EMPTY); }
    });
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">Add a user</h2>
          <p className="mt-1 text-sm text-slate-500">Create a member or administrator account.</p>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="btn-ghost">{open ? "Close" : "New user"}</button>
      </div>

      {open && (
        <>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Full name"><input className="field" value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="Jane Doe" /></Field>
            <Field label="Email"><input className="field" value={f.email} onChange={(e) => set({ email: e.target.value })} placeholder="jane@example.com" /></Field>
            <Field label="Temporary password"><input className="field" type="text" value={f.password} onChange={(e) => set({ password: e.target.value })} placeholder="At least 8 characters" /></Field>
            <Field label="Role">
              <select className="field" value={f.role} onChange={(e) => set({ role: e.target.value })}>
                <option value="USER">Member</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </Field>
          </div>

          {msg?.error && <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-600/20">{msg.error}</div>}
          {msg?.ok && <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-inset ring-emerald-600/20">{msg.ok}</div>}

          <div className="mt-4 flex justify-end">
            <button onClick={submit} disabled={pending} className="btn-primary">{pending ? "Creating…" : "Create user"}</button>
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
