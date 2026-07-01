import { getCurrentUser } from "@/lib/auth";
import { logOutAction } from "../(auth)/actions";

export default async function AppHomePage() {
  const user = await getCurrentUser();

  return (
    <main style={{ maxWidth: 480, margin: "4rem auto", fontFamily: "sans-serif" }}>
      <h1>Dashboard</h1>
      <p>Logged in as {user?.email}.</p>
      <form action={logOutAction}>
        <button type="submit">Log out</button>
      </form>
    </main>
  );
}
