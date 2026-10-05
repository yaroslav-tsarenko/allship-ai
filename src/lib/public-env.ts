const value = (v: string | undefined) => (v ? v : undefined);

export const publicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: value(process.env.NEXT_PUBLIC_SUPABASE_URL),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: value(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: value(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: value(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
  NEXT_PUBLIC_GOOGLE_MAPS_KEY: value(process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY),
};
