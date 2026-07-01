import { getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui/Card";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <h1 className="text-3xl">Settings</h1>
      <Card className="mt-6 max-w-xl">
        <p className="text-sm text-charcoal">
          Email: <span className="font-medium">{user?.email}</span>
        </p>
        <p className="mt-3 text-sm text-charcoal/70">
          Output preferences, voice-vs-type, and reminder settings ship in Phase 2/3 onboarding.
        </p>
      </Card>
    </div>
  );
}
