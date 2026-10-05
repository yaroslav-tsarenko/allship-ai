import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, ownerAc } from "better-auth/plugins/organization/access";

export const statements = {
  ...defaultStatements,
  bid: ["create", "withdraw"],
  load: ["view", "assign-driver"],
  trip: ["update-status", "share-location"],
  payout: ["view", "manage"],
} as const;

export const ac = createAccessControl(statements);

export const owner = ac.newRole({
  ...ownerAc.statements,
  bid: ["create", "withdraw"],
  load: ["view", "assign-driver"],
  trip: ["update-status", "share-location"],
  payout: ["view", "manage"],
});

export const dispatcher = ac.newRole({
  member: ["create", "update"],
  invitation: ["create", "cancel"],
  bid: ["create", "withdraw"],
  load: ["view", "assign-driver"],
  trip: ["update-status"],
  payout: ["view"],
});

export const driver = ac.newRole({
  load: ["view"],
  trip: ["update-status", "share-location"],
});

export const carrierRoles = { owner, dispatcher, driver };
export type CarrierRole = keyof typeof carrierRoles;
