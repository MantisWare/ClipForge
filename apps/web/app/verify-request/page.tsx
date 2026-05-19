import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

export default function VerifyRequestPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Image
        src="/logo.png"
        alt="ClipForge AI"
        width={120}
        height={120}
        className="mb-6 h-24 w-auto object-contain"
      />
      <Card className="w-full max-w-md border-brand-glow text-center">
        <CardTitle>Check your email</CardTitle>
        <CardDescription className="mt-2">
          A sign-in link has been sent to your email address. Click the link to
          continue to ClipForge.
        </CardDescription>
        <Link
          href="/sign-in"
          className="mt-6 inline-block text-sm text-accent-cyan hover:underline"
        >
          Back to sign in
        </Link>
      </Card>
    </div>
  );
}
