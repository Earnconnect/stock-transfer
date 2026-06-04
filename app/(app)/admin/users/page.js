import { Seal, SectionHeader } from "@/components/ui";
import UserActions from "@/components/admin/UserActions";
import AddUserForm from "@/components/admin/AddUserForm";
import { requireAdmin } from "@/lib/auth";
import { getAllUsers } from "@/lib/queries";

function initials(name = "") {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export default async function AdminUsersPage() {
  const session = await requireAdmin();
  const users = await getAllUsers();

  return (
    <main className="bg-grid min-h-full">
      <div className="p-6 space-y-6">
        <AddUserForm />
        <section className="card">
          <SectionHeader title={`Users (${users.length})`} />
          <div className="overflow-x-auto scroll-thin">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-200 bg-slate-50/60">
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">KYC</th>
                  <th className="px-5 py-3 font-medium text-center">Accounts</th>
                  <th className="px-5 py-3 font-medium text-center">Transfers</th>
                  <th className="px-5 py-3 font-medium text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isSelf = u.id === session.sub;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`grid place-items-center h-9 w-9 rounded-full text-white text-xs font-semibold ${u.role === "ADMIN" ? "bg-gradient-to-br from-amber-500 to-amber-700" : "bg-gradient-to-br from-brand-500 to-brand-700"}`}>
                            {initials(u.name)}
                          </span>
                          <div>
                            <div className="font-medium text-slate-900">{u.name}</div>
                            <div className="text-xs text-slate-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Seal tone={u.role === "ADMIN" ? "gold" : "slate"}>{u.role}</Seal>
                      </td>
                      <td className="px-5 py-4">
                        <Seal tone={u.status === "SUSPENDED" ? "slate" : "green"}>{u.status}</Seal>
                      </td>
                      <td className="px-5 py-4">
                        <Seal tone={u.kycStatus === "VERIFIED" ? "green" : u.kycStatus === "PENDING" ? "gold" : "slate"}>{u.kycStatus}</Seal>
                      </td>
                      <td className="px-5 py-4 text-center tnum text-slate-700">{u._count.accounts}</td>
                      <td className="px-5 py-4 text-center tnum text-slate-700">{u._count.transfers}</td>
                      <td className="px-5 py-4">
                        <UserActions id={u.id} role={u.role} status={u.status} kycStatus={u.kycStatus} isSelf={isSelf} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
