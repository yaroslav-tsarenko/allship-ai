import "server-only";
import Stripe from "stripe";
import { env } from "@/env";

let client: Stripe | null | undefined;

export function getStripe() {
  if (client !== undefined) return client;
  client = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY, { appInfo: { name: "AllShip AI", url: "https://allship.ai" }, maxNetworkRetries: 2 }) : null;
  return client;
}

export const paymentsConfigured = () => Boolean(env.STRIPE_SECRET_KEY);
export const simulatedPayments = () => !env.STRIPE_SECRET_KEY && (env.NODE_ENV !== "production" || env.PAYMENTS_MODE === "simulated");
