import { describe, it, expect, vi, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";

const sendPasswordResetEmail = vi.fn();
vi.mock("@/lib/email", () => ({
  sendPasswordResetEmail: (...args: unknown[]) => sendPasswordResetEmail(...args),
}));

const { signUp, logIn, AuthError, requestPasswordReset, resetPassword } = await import("@/lib/auth");


function uniqueEmail(label: string) {
  return `e2e-vitest-${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

const createdUserIds: string[] = [];

afterAll(async () => {
  if (createdUserIds.length > 0) {
    await prisma.auditLog.deleteMany({ where: { actorId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  }
  await prisma.$disconnect();
});

describe("signUp / logIn", () => {
  it("creates a user, hashes the password, and logs the signup", async () => {
    const email = uniqueEmail("signup");
    const user = await signUp(email, "supersecret123", "Vitest Signup");
    createdUserIds.push(user.id);

    expect(user.email).toBe(email);
    expect(user.passwordHash).not.toBe("supersecret123");

    const auditRow = await prisma.auditLog.findFirst({
      where: { actorId: user.id, action: "auth.signup" },
    });
    expect(auditRow).not.toBeNull();
  });

  it("rejects a duplicate email", async () => {
    const email = uniqueEmail("dup");
    const user = await signUp(email, "supersecret123");
    createdUserIds.push(user.id);

    await expect(signUp(email, "anotherpassword123")).rejects.toThrow(AuthError);
  });

  it("logs in with correct credentials and rejects wrong ones", async () => {
    const email = uniqueEmail("login");
    const user = await signUp(email, "supersecret123");
    createdUserIds.push(user.id);

    const loggedIn = await logIn(email, "supersecret123");
    expect(loggedIn.id).toBe(user.id);

    await expect(logIn(email, "wrongpassword")).rejects.toThrow(AuthError);
  });

  it("rejects login for a suspended account", async () => {
    const email = uniqueEmail("suspended");
    const user = await signUp(email, "supersecret123");
    createdUserIds.push(user.id);

    await prisma.user.update({ where: { id: user.id }, data: { status: "suspended" } });
    await expect(logIn(email, "supersecret123")).rejects.toThrow(AuthError);
  });
});

describe("password reset", () => {
  it("issues a single-use token that updates the password and can't be reused", async () => {
    const email = uniqueEmail("reset");
    const user = await signUp(email, "originalpassword123");
    createdUserIds.push(user.id);

    sendPasswordResetEmail.mockClear();
    await requestPasswordReset(email, "http://localhost:3000");

    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    const [, resetUrl] = sendPasswordResetEmail.mock.calls[0] as [string, string];
    const token = resetUrl.split("/reset-password/")[1];
    expect(token).toBeTruthy();

    await resetPassword(token, "brandnewpassword456");

    const loggedIn = await logIn(email, "brandnewpassword456");
    expect(loggedIn.id).toBe(user.id);

    await expect(logIn(email, "originalpassword123")).rejects.toThrow(AuthError);
    await expect(resetPassword(token, "yetanotherpassword789")).rejects.toThrow(AuthError);
  });

  it("does not error and does not send an email for an unknown address", async () => {
    sendPasswordResetEmail.mockClear();
    await requestPasswordReset(uniqueEmail("unknown"), "http://localhost:3000");
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});
