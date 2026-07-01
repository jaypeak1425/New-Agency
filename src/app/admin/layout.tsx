import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }
  if (user.role !== "admin") {
    redirect(user.role === "wholesaler" ? "/wholesaler" : "/app");
  }

  return <>{children}</>;
}
