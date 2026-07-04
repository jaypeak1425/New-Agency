import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }
  if (user.role !== "admin") {
    if (user.role === "wholesaler") redirect("/wholesaler");
    if (user.role === "imo_principal") redirect("/imo-principal");
    redirect("/app");
  }

  return <>{children}</>;
}
