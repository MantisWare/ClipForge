import { Card, CardDescription, CardTitle } from "@/components/ui/card";

type Props = {
  userId: string;
};

export const AdminAccessDenied = ({ userId }: Props) => {
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-1 text-sm text-muted">
          Platform operations — restricted to configured administrators.
        </p>
      </div>

      <Card className="border-warning/30">
        <CardTitle className="text-warning">Access denied</CardTitle>
        <CardDescription className="space-y-3">
          <p>
            Your account is not listed in{" "}
            <code className="rounded bg-panel-2 px-1.5 py-0.5 text-foreground">
              ADMIN_USER_IDS
            </code>
            , so you cannot use the admin console.
          </p>
          <p>
            Add your user ID to that environment variable and restart the web
            app:
          </p>
          <pre className="overflow-x-auto rounded-lg border border-border bg-panel-2 p-3 text-xs text-foreground">
            {`ADMIN_USER_IDS="${userId}"`}
          </pre>
          {isDev && (
            <p className="text-muted">
              In local development, leaving{" "}
              <code className="rounded bg-panel-2 px-1 text-foreground">
                ADMIN_USER_IDS
              </code>{" "}
              empty grants admin access to every signed-in user. Set it explicitly
              to test production-like restrictions.
            </p>
          )}
        </CardDescription>
      </Card>
    </div>
  );
};
