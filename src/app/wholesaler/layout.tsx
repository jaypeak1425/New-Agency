import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { logOutAction } from "../(auth)/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Wordmark } from "@/components/ui/Wordmark";

export default async function WholesalerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }
  if (user.role !== "wholesaler") {
    if (user.role === "admin") redirect("/admin");
    if (user.role === "imo_principal") redirect("/imo-principal");
    redirect("/app");
  }

  return (
    <div className="flex min-h-full">
      <nav className="flex w-60 flex-col gap-6 bg-navy px-4 py-6">
        <div className="px-2">
          <Wordmark variant="dark" />
        </div>
        <div className="mt-auto space-y-3 border-t border-cream/10 px-2 pt-4 text-sm">
          <p className="truncate text-cream/70">{user.email}</p>
          <form action={logOutAction}>
            <SubmitButton variant="outline-on-dark" pendingText="Logging out…" className="w-full">
              Log out
            </SubmitButton>
          </form>
        </div>
      </nav>
      <main className="flex-1 bg-cream px-10 py-10">{children}</main>
    </div>
  );
}
