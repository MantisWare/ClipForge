import { auth, signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user !== undefined) {
    redirect("/dashboard");
  }

  const hasGoogle =
    process.env.AUTH_GOOGLE_ID !== undefined &&
    process.env.AUTH_GOOGLE_ID !== "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardTitle className="text-2xl text-accent">ClipForge</CardTitle>
        <CardDescription className="mb-6">
          Sign in to repurpose long-form video into Shorts, Reels, and TikToks.
        </CardDescription>

        <form
          action={async (formData) => {
            "use server";
            const email = formData.get("email");
            await signIn("credentials", {
              email:
                typeof email === "string" ? email : "demo@clipforge.local",
              redirectTo: "/dashboard",
            });
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-muted">
              Email (demo)
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue="demo@clipforge.local"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Continue with demo account
          </Button>
        </form>

        {hasGoogle && (
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
            className="mt-4"
          >
            <Button type="submit" variant="secondary" className="w-full">
              Continue with Google
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
