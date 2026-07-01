import { randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSessionCookie, clearSessionCookie, getSession } from "@/lib/session";
import { sendPasswordResetEmail, sendWelcomeEmail } from "@/lib/email";

const PASSWORD_RESET_TTL_MS = 1000 * 60 * 30; // 30 minutes

export class AuthError extends Error {}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function signUp(
  email: string,
  password: string,
  name?: string,
  appBaseUrl?: string,
) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password || password.length < 8) {
    throw new AuthError("Email is required and password must be at least 8 characters.");
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw new AuthError("An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  // Signup establishes a session directly (no separate logIn() call), so it
  // has to stamp lastLoginAt itself — otherwise every freshly signed-up
  // agent would read as "never logged in" and permanently show up on the
  // master dashboard's at-risk churn list (docs/08-master-dashboard.md
  // Module 4) from day one.
  const user = await prisma.user.create({
    data: { email: normalizedEmail, passwordHash, name, lastLoginAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "auth.signup",
      target: user.id,
      metadata: { email: normalizedEmail },
    },
  });

  await setSessionCookie({ sub: user.id, role: user.role });

  if (appBaseUrl) {
    await sendWelcomeEmail(user.email, user.name, appBaseUrl);
  }

  return user;
}

export async function logIn(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AuthError("Invalid email or password.");
  }

  if (user.status === "suspended") {
    throw new AuthError("This account has been suspended.");
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
    prisma.auditLog.create({
      data: { actorId: user.id, action: "auth.login", target: user.id, metadata: {} },
    }),
  ]);

  await setSessionCookie({ sub: user.id, role: user.role });
  return user;
}

export async function logOut() {
  const session = await getSession();
  if (session) {
    await prisma.auditLog.create({
      data: { actorId: session.sub, action: "auth.logout", target: session.sub, metadata: {} },
    });
  }
  await clearSessionCookie();
}

// Shared by the self-serve "forgot password" flow and the admin-created
// wholesaler invite flow (docs/23-wholesaler-assignment.md section 1), which
// reuses this same token mechanism to let a wholesaler set their own password.
export async function issuePasswordResetToken(userId: string) {
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(rawToken);

  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
    },
  });

  return rawToken;
}

export async function requestPasswordReset(email: string, appBaseUrl: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  // Always behave the same whether or not the user exists, so the endpoint
  // can't be used to enumerate registered emails.
  if (!user) return;

  const rawToken = await issuePasswordResetToken(user.id);

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "auth.password_reset_requested",
      target: user.id,
      metadata: {},
    },
  });

  const resetUrl = `${appBaseUrl}/reset-password/${rawToken}`;
  await sendPasswordResetEmail(user.email, resetUrl);
}

export async function resetPassword(rawToken: string, newPassword: string) {
  if (!newPassword || newPassword.length < 8) {
    throw new AuthError("Password must be at least 8 characters.");
  }

  const tokenHash = hashToken(rawToken);
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw new AuthError("This password reset link is invalid or has expired.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    prisma.auditLog.create({
      data: {
        actorId: resetToken.userId,
        action: "auth.password_reset_completed",
        target: resetToken.userId,
        metadata: {},
      },
    }),
  ]);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.sub } });
}
