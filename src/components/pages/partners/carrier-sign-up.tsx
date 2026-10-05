import Link from "next/link";
import { Container } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { arrowForwardIcon, lockIcon } from "@/components/ui/icons.generated";
import { TextField } from "@/components/ui/text-field";
import { authLinks } from "@/content/site";
import { signUpSteps } from "./content";

export function CarrierSignUp({ id = "carrier-sign-up" }: { id?: string }) {
  const headingId = `${id}-title`;
  return (
    <section id={id} aria-labelledby={headingId} className="scroll-mt-20 bg-surface-container-low py-16 medium:py-24">
      <Container>
        <div className="grid gap-12 large:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] large:gap-20">
          <div>
            <p className="text-title-sm font-medium text-primary">Carrier sign-up</p>
            <h2 id={headingId} className="mt-3 text-headline-lg font-normal text-balance text-on-surface medium:text-display-sm">
              Four steps from sign-up to your first bid
            </h2>
            <p className="mt-5 max-w-[620px] text-body-lg text-pretty text-on-surface-variant medium:text-body-xl">
              Create your carrier account in a few minutes. Your data is encrypted in transit and your password is stored only as a secure hash.
            </p>
            <ol className="mt-10 border-t border-outline-variant">
              {signUpSteps.map((step, i) => (
                <li key={step.title} className="grid grid-cols-[3rem_1fr] gap-x-4 border-b border-outline-variant py-5">
                  <span className="font-mono text-title-lg text-primary tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="block text-title-lg text-on-surface">{step.title}</span>
                    <span className="mt-1 block text-body-lg text-pretty text-on-surface-variant">{step.body}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="large:sticky large:top-24 large:self-start">
            <form action={authLinks.signUp.href} method="get" className="flex flex-col gap-5 rounded-xl bg-surface p-6 shadow-elevation-1 medium:p-8" aria-labelledby={`${id}-form-title`}>
              <input type="hidden" name="type" value="carrier" />
              <div>
                <h3 id={`${id}-form-title`} className="text-headline-sm text-on-surface">
                  Start with your work email
                </h3>
                <p className="mt-2 text-body-md text-pretty text-on-surface-variant">
                  We open the carrier sign-up with your email filled in. You add your name, phone and password there, then your USDOT and MC numbers.
                </p>
              </div>
              <TextField label="Work email" name="email" type="email" autoComplete="email" inputMode="email" required />
              <Button type="submit" size="lg" trailing={<Icon icon={arrowForwardIcon} size={20} />}>
                Become a carrier
              </Button>
              <p className="flex items-start gap-2 text-body-sm text-on-surface-variant">
                <Icon icon={lockIcon} size={18} className="mt-px shrink-0" />
                No fee on your bid and no subscription. Bidding opens after verification.
              </p>
              <p className="border-t border-outline-variant pt-4 text-body-md text-on-surface-variant">
                Already have an account?{" "}
                <Link href={authLinks.signIn.href} className="rounded-xs font-medium text-primary underline-offset-4 hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </Container>
    </section>
  );
}
