import "server-only";
import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware, APIError, getSessionFromCtx } from "better-auth/api";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { nextCookies } from "better-auth/next-js";
import { admin, captcha, emailOTP, lastLoginMethod, magicLink, organization, twoFactor } from "better-auth/plugins";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { env } from "@/env";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import { authEmails } from "@/server/email/templates";
import { ac, carrierRoles } from "./access";
import { isBreachedPassword } from "./breached-password";

const appUrl = env.BETTER_AUTH_URL ?? env.NEXT_PUBLIC_APP_URL;
const trustedOrigins = [...new Set([appUrl, env.NEXT_PUBLIC_APP_URL, ...(env.BETTER_AUTH_TRUSTED_ORIGINS ?? "").split(",")].map((o) => o.trim()).filter(Boolean).map((o) => new URL(o).origin))];
const isLegacyHash = (hash: string) => hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$");

const passwordPaths = new Set(["/sign-up/email", "/reset-password", "/change-password"]);
const captchaEndpoints = ["/sign-up/email", "/sign-in/email", "/request-password-reset", "/sign-in/magic-link", "/email-otp/send-verification-otp", "/email-otp/request-password-reset", "/forget-password/email-otp"];

export const auth = betterAuth({
  appName: "AllShip AI",
  baseURL: appUrl,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  user: {
    additionalFields: {
      firstName: { type: "string", required: false, input: true },
      lastName: { type: "string", required: false, input: true },
      phone: { type: "string", required: false, input: true },
      accountType: { type: "string", required: false, input: true, defaultValue: "shipper" },
      onboardingCompletedAt: { type: "date", required: false, input: false },
      locale: { type: "string", required: false, input: false, defaultValue: "en-US" },
      legacyId: { type: "string", required: false, input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    freshAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await authEmails.resetPassword(user.email, url);
    },
    password: {
      hash: hashPassword,
      verify: async ({ hash, password }) =>
        isLegacyHash(hash) ? bcrypt.compare(password, hash) : verifyPassword({ hash, password }),
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url }) => {
      await authEmails.verifyEmail(user.email, url);
    },
  },
  socialProviders:
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET, prompt: "select_account" } }
      : {},
  account: {
    accountLinking: { enabled: true, trustedProviders: ["google"], requireLocalEmailVerified: true, allowDifferentEmails: false, allowUnlinkingAll: false },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 60,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60 * 10, max: 3 },
      "/request-password-reset": { window: 60 * 10, max: 3 },
      "/sign-in/magic-link": { window: 60 * 10, max: 3 },
      "/email-otp/send-verification-otp": { window: 60 * 10, max: 3 },
      "/send-verification-email": { window: 60 * 10, max: 3 },
      "/two-factor/verify-totp": { window: 60, max: 5 },
      "/two-factor/verify-backup-code": { window: 60, max: 5 },
      "/two-factor/verify-otp": { window: 60, max: 5 },
      "/two-factor/send-otp": { window: 60 * 10, max: 3 },
      "/two-factor/enable": { window: 60, max: 5 },
      "/two-factor/disable": { window: 60, max: 5 },
      "/sign-in/email-otp": { window: 60, max: 5 },
      "/email-otp/verify-email": { window: 60, max: 5 },
      "/email-otp/check-verification-otp": { window: 60, max: 5 },
      "/email-otp/reset-password": { window: 60, max: 5 },
      "/forget-password/email-otp": { window: 60 * 10, max: 3 },
      "/email-otp/request-password-reset": { window: 60 * 10, max: 3 },
      "/email-otp/request-email-change": { window: 60 * 10, max: 3 },
      "/email-otp/change-email": { window: 60, max: 5 },
      "/magic-link/verify": { window: 60, max: 10 },
      "/reset-password": { window: 60 * 10, max: 5 },
      "/change-password": { window: 60, max: 5 },
      "/change-email": { window: 60 * 10, max: 3 },
      "/delete-user": { window: 60 * 10, max: 3 },
      "/passkey/verify-authentication": { window: 60, max: 10 },
      "/organization/accept-invitation": { window: 60, max: 10 },
    },
  },
  advanced: {
    cookiePrefix: "allship",
    useSecureCookies: env.NODE_ENV === "production",
    defaultCookieAttributes: { httpOnly: true, sameSite: "lax", secure: env.NODE_ENV === "production", path: "/" },
    ipAddress: { ipAddressHeaders: ["x-vercel-forwarded-for", "x-forwarded-for"] },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const accountType = (user as { accountType?: string }).accountType ?? "shipper";
          if (accountType !== "shipper" && accountType !== "carrier") {
            throw new APIError("BAD_REQUEST", { message: "Choose shipper or carrier" });
          }
          const first = (user as { firstName?: string }).firstName?.trim();
          const last = (user as { lastName?: string }).lastName?.trim();
          const name = user.name?.trim() || [first, last].filter(Boolean).join(" ") || user.email.split("@")[0]!;
          return { data: { ...user, name, accountType, email: user.email.toLowerCase() } };
        },
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.request && ctx.path.startsWith("/organization/")) {
        throw new APIError("FORBIDDEN", { message: "Manage your team from the Team page." });
      }
      if (ctx.request && ctx.path.startsWith("/admin/")) {
        const current = await getSessionFromCtx(ctx);
        if (!current?.user.twoFactorEnabled) throw new APIError("FORBIDDEN", { message: "Turn on two-step verification first." });
      }
      if (ctx.path === "/update-user" && ctx.body && typeof ctx.body === "object" && "accountType" in ctx.body) {
        throw new APIError("BAD_REQUEST", { message: "The account type can't be changed." });
      }
      if (!passwordPaths.has(ctx.path)) return;
      const body = ctx.body as { password?: string; newPassword?: string } | undefined;
      const candidate = body?.newPassword ?? body?.password;
      if (candidate && (await isBreachedPassword(candidate))) {
        throw new APIError("BAD_REQUEST", {
          code: "PASSWORD_COMPROMISED",
          message: "This password appeared in a data breach. Choose a different one.",
        });
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email") return;
      const newSession = ctx.context.newSession;
      const password = (ctx.body as { password?: string } | undefined)?.password;
      if (!newSession || !password) return;
      const [credential] = await db
        .select({ id: schema.account.id, password: schema.account.password })
        .from(schema.account)
        .where(and(eq(schema.account.userId, newSession.user.id), eq(schema.account.providerId, "credential")))
        .limit(1);
      if (credential?.password && isLegacyHash(credential.password)) {
        await db
          .update(schema.account)
          .set({ password: await hashPassword(password) })
          .where(eq(schema.account.id, credential.id));
      }
    }),
  },
  plugins: [
    captcha({
      provider: "cloudflare-turnstile",
      secretKey: env.TURNSTILE_SECRET_KEY ?? "",
      endpoints: env.TURNSTILE_SECRET_KEY ? captchaEndpoints : ["/captcha-disabled"],
    }),
    twoFactor({ issuer: "AllShip AI", backupCodeOptions: { amount: 10, length: 10 } }),
    passkey({ rpID: new URL(appUrl).hostname, rpName: "AllShip AI", origin: appUrl }),
    magicLink({
      expiresIn: 60 * 10,
      disableSignUp: true,
      sendMagicLink: async ({ email, url }) => {
        await authEmails.magicLink(email, url);
      },
    }),
    emailOTP({
      otpLength: 6,
      expiresIn: 60 * 10,
      allowedAttempts: 5,
      disableSignUp: true,
      sendVerificationOTP: async ({ email, otp, type }) => {
        await authEmails.otp(email, otp, type);
      },
    }),
    organization({
      ac,
      roles: carrierRoles,
      creatorRole: "owner",
      allowUserToCreateOrganization: async (user) => (user as { accountType?: string }).accountType === "carrier",
      organizationLimit: 1,
      membershipLimit: 200,
      invitationExpiresIn: 60 * 60 * 24 * 7,
      sendInvitationEmail: async ({ email, organization: org, inviter, role, id }) => {
        await authEmails.invitation(email, `${appUrl}/invite/${id}`, org.name, inviter.user.name, role);
      },
    }),
    admin({ defaultRole: "user", adminRoles: ["admin"] }),
    lastLoginMethod(),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
