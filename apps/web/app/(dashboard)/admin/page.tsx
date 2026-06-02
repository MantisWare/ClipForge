import { AdminAccessDenied } from "@/components/admin/admin-access-denied";
import { AdminClient } from "@/components/admin/admin-client";
import { getSessionUserId } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const userId = await getSessionUserId();
  if (userId === null) {
    redirect("/sign-in");
  }

  if (!isPlatformAdmin(userId)) {
    return <AdminAccessDenied userId={userId} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-1 text-sm text-muted">
          Platform operations — queue health and workspace management.
        </p>
      </div>
      <AdminClient />
    </div>
  );
}
