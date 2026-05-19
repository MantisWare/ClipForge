import { AdminClient } from "@/components/admin/admin-client";
import { getSessionUserId } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const userId = await getSessionUserId();
  if (userId === null) {
    redirect("/sign-in");
  }

  const admin = requireAdmin(userId);
  if ("error" in admin) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-1 text-sm text-muted">
          Platform operations — requires ADMIN_USER_IDS.
        </p>
      </div>
      <AdminClient />
    </div>
  );
}
