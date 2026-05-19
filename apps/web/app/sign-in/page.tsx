import { auth, signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user !== undefined) {
    redirect("/dashboard");
  }

  const hasGoogle =
    process.env.AUTH_GOOGLE_ID !== undefined &&
    process.env.AUTH_GOOGLE_ID !== "";

  const hasResend =
    process.env.AUTH_RESEND_KEY !== undefined &&
    process.env.AUTH_RESEND_KEY !== "";

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Image
        src="/logo.png"
        alt="ClipForge AI"
        width={160}
        height={160}
        className="mb-6 h-32 w-auto object-contain md:h-40"
        priority
      />
      <Card className="w-full max-w-md border-brand-glow">
        <CardTitle className="text-center text-2xl text-brand-gradient">
          Welcome back
        </CardTitle>
        <CardDescription className="mb-6 text-center">
          Sign in to repurpose long-form video into Shorts, Reels, and TikToks.
        </CardDescription>

        {hasResend && (
          <form
            action={async (formData) => {
              "use server";
              const email = formData.get("email");
              if (typeof email !== "string" || email === "") {
                return;
              }
              await signIn("resend", { email, redirectTo: "/dashboard" });
            }}
            className="mb-4 space-y-3"
          >
            <div>
              <label htmlFor="email" className="mb-1 block text-sm text-muted">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Send magic link
            </Button>
          </form>
        )}

        {hasGoogle && (
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
            className="mb-4"
          >
            <Button type="submit" variant="secondary" className="w-full">
              Continue with Google
            </Button>
          </form>
        )}

        {isDev && (
          <>
            <p className="mb-2 text-center text-xs text-muted">
              Development only
            </p>
            <form
              action={async (formData) => {
                "use server";
                const email = formData.get("email");
                await signIn("credentials", {
                  email:
                    typeof email === "string"
                      ? email
                      : "demo@clipforge.local",
                  redirectTo: "/dashboard",
                });
              }}
              className="space-y-3"
            >
              <Input
                id="demo-email"
                name="email"
                type="email"
                defaultValue="demo@clipforge.local"
                required
              />
              <Button type="submit" variant="ghost" className="w-full">
                Continue with demo account
              </Button>
            </form>
          </>
        )}

        {!hasResend && !hasGoogle && !isDev && (
          <p className="text-center text-sm text-muted">
            Configure AUTH_RESEND_KEY or AUTH_GOOGLE_ID in your environment.
          </p>
        )}
      </Card>
    </div>
  );
}
