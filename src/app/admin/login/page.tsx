import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/dal";
import { sanitizeCallbackUrl } from "@/lib/auth/callback-url";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "NOIR Admin — Sign In",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const safeCallbackUrl = sanitizeCallbackUrl(callbackUrl);

  const admin = await getCurrentAdmin();
  if (admin) {
    redirect(safeCallbackUrl);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-obsidian px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <p className="text-sm font-semibold tracking-[0.5em] text-noir-text">NOIR</p>
          <p className="mt-2 text-[10px] font-semibold tracking-[0.4em] text-noir-text-secondary">
            ADMIN
          </p>
        </div>

        <div className="mt-12 border-t border-graphite pt-10">
          <LoginForm callbackUrl={safeCallbackUrl} />
        </div>
      </div>
    </div>
  );
}
