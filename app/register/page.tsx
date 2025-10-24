// /app/register/page.tsx

"use client";

import { RegisterForm } from "@/components/register-form";
import { IconAlphabetHebrew, IconLoader } from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function LoginPage() {
  const { status } = useSession();

  if (status === "loading") {
    // return <div className="w-full h-full flex items-center justify-center bg-blend-lighten">Loading...</div>
    return (
      <IconLoader className="size-10 animate-spin mx-auto h-screen text-gray-500" />
    );
  }

  if (status === "authenticated") {
    redirect("/dashboard");
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <IconAlphabetHebrew className="size-4" />
          </div>
          MY Inventory & POS
        </a>
        <RegisterForm />
      </div>
    </div>
  );
}
