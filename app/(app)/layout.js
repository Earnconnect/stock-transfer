import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { getCurrentUser } from "@/lib/auth";

// These routes are per-user and read the database — never prerender them at
// build time (keeps the Vercel build independent of the database).
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const safeUser = { name: user.name, email: user.email, role: user.role, kycStatus: user.kycStatus };

  return (
    <div className="flex min-h-screen">
      <Sidebar role={user.role} />
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <Topbar user={safeUser} />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
