import { prisma } from "@/lib/prisma";
import type {
  Avatar,
  TenureBand,
  IncomeBand,
  InteractionPreference,
  OutputPreference,
  ReminderFrequency,
} from "@/generated/prisma/client";

export interface OnboardingInput {
  tenureBand: TenureBand;
  currentIncomeBand: IncomeBand;
  goalIncome: number | null;
  avatarMix: Avatar[];
  interactionPreference: InteractionPreference;
  outputPreference: OutputPreference;
  reminderFrequency: ReminderFrequency;
  hasCpaRelationship: boolean;
  hasAttorneyRelationship: boolean;
  imoAffiliation: string | null;
}

export async function needsOnboarding(userId: string, role: string): Promise<boolean> {
  if (role !== "user") return false;
  const profile = await prisma.agentProfile.findUnique({ where: { userId } });
  return !profile?.completedAt;
}

export async function completeOnboarding(userId: string, input: OnboardingInput) {
  await prisma.$transaction([
    prisma.agentProfile.upsert({
      where: { userId },
      create: { userId, ...input, completedAt: new Date() },
      update: { ...input, completedAt: new Date() },
    }),
    prisma.auditLog.create({
      data: { actorId: userId, action: "onboarding.completed", target: userId, metadata: {} },
    }),
  ]);
}

export async function skipOnboarding(userId: string) {
  await prisma.$transaction([
    prisma.agentProfile.upsert({
      where: { userId },
      create: { userId, skipped: true, completedAt: new Date() },
      update: { skipped: true, completedAt: new Date() },
    }),
    prisma.auditLog.create({
      data: { actorId: userId, action: "onboarding.skipped", target: userId, metadata: {} },
    }),
  ]);
}

export interface BookOfBusinessInput {
  businessOwnersWithCoOwnersCount: number | null;
  businessOwnersSoloCount: number | null;
  hnwIndividualsCount: number | null;
  qualifiedFundHeavyCount: number | null;
  familyLegacyCount: number | null;
  bookAddressableFilterOverridePercent: number | null;
}

// docs/07-progress-dashboard-math.md section 4: "in Onboarding or Updated
// Quarterly" — kept editable from Settings (not just the one-time onboarding
// wizard) since the doc expects this to change over time.
export async function updateBookOfBusiness(userId: string, input: BookOfBusinessInput) {
  await prisma.$transaction([
    prisma.agentProfile.upsert({
      where: { userId },
      create: { userId, ...input },
      update: input,
    }),
    prisma.auditLog.create({
      data: { actorId: userId, action: "agent_profile.book_of_business_updated", target: userId, metadata: {} },
    }),
  ]);
}

export async function getAgentProfile(userId: string) {
  return prisma.agentProfile.findUnique({ where: { userId } });
}
