"use client";

import { passkeyClient } from "@better-auth/passkey/client";
import { adminClient, emailOTPClient, inferAdditionalFields, lastLoginMethodClient, magicLinkClient, organizationClient, twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { ac, carrierRoles } from "./access";
import type { auth } from "./auth";

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields<typeof auth>(),
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = "/two-factor";
      },
    }),
    passkeyClient(),
    magicLinkClient(),
    emailOTPClient(),
    organizationClient({ ac, roles: carrierRoles }),
    adminClient(),
    lastLoginMethodClient(),
  ],
});
