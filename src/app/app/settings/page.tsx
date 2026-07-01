import { getCurrentUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <>
      <h1>Settings</h1>
      <p>Email: {user?.email}</p>
      <p>Output preferences, voice-vs-type, and reminder settings ship in Phase 2/3 onboarding.</p>
    </>
  );
}
