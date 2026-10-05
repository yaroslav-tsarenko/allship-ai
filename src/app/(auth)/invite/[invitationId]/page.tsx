import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Icon } from "@/components/ui/icon";
import { errorIcon } from "@/components/ui/icons.generated";
import { env } from "@/env";
import { AuthShell } from "@/features/auth/auth-shell";
import { SignUpForm } from "@/features/auth/sign-up-form";
import { AcceptInvite, SwitchAccount } from "@/features/team/accept-invite";
import { roleMeta } from "@/features/team/roles";
import { getSession } from "@/server/auth/session";
import { invitationPreview } from "@/server/team/service";

export const metadata: Metadata = { title: "Join your team" };

type Props = { params: Promise<{ invitationId: string }> };

const unavailable = {
  accepted: { title: "Invitation already used", body: "This invitation was already accepted. Sign in to see your trips." },
  cancelled: { title: "Invitation cancelled", body: "This invitation was cancelled. Ask your dispatcher to send a new one." },
  expired: { title: "Invitation expired", body: "Invitations are valid for 7 days. Ask your dispatcher to send a new one." },
  missing: { title: "Invitation not found", body: "Check that you opened the full link from the email, or ask for a new invitation." },
};

export default async function InvitePage({ params }: Props) {
  const { invitationId } = await params;
  const [invite, session] = await Promise.all([invitationPreview(invitationId), getSession()]);
  const self = `/invite/${invitationId}`;

  if (!invite || invite.state !== "pending") {
    const copy = unavailable[invite?.state === "accepted" || invite?.state === "cancelled" || invite?.state === "expired" ? invite.state : "missing"];
    return (
      <AuthShell title={copy.title} description={copy.body}>
        <div className="flex flex-col gap-4">
          <Icon icon={errorIcon} size={40} className="text-on-surface-variant" />
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={session ? "/app" : "/sign-in"}>{session ? "Go to AllShip AI" : "Sign in"}</Link>
            </Button>
          </div>
        </div>
      </AuthShell>
    );
  }

  const role = roleMeta[invite.role];
  const description = (
    <div className="flex flex-col gap-3">
      <p>
        {invite.inviterName} invited you to join <span className="font-medium text-on-surface">{invite.companyName}</span> as {invite.role === "driver" ? "a driver" : "a dispatcher"}.
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 border-t border-outline-variant pt-3 text-body-md">
        <dt className="text-on-surface-variant">Company</dt>
        <dd className="text-on-surface">{invite.companyName}</dd>
        <dt className="text-on-surface-variant">Role</dt>
        <dd className="text-on-surface">{role.label}</dd>
        <dt className="text-on-surface-variant">Access</dt>
        <dd className="text-on-surface">{role.blurb}</dd>
        <dt className="text-on-surface-variant">Email</dt>
        <dd className="break-all text-on-surface">{invite.email}</dd>
      </dl>
    </div>
  );

  if (session) {
    const matches = session.user.email.toLowerCase() === invite.email.toLowerCase();
    return (
      <AuthShell title={`Join ${invite.companyName}`} description={description}>
        {matches ? (
          <div className="flex flex-col gap-4">
            <p className="text-body-lg text-on-surface-variant">
              You&apos;re signed in as <span className="font-medium text-on-surface">{session.user.email}</span>.
              {invite.role === "driver" ? " After you join, your trips open on the Trips page." : " After you join, you can bid on loads and assign drivers."}
            </p>
            <AcceptInvite invitationId={invite.id} companyName={invite.companyName} />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="rounded-md bg-warning-container px-4 py-3 text-body-md text-on-warning-container">
              You&apos;re signed in as {session.user.email}, but this invitation was sent to {invite.email}. Sign in with that email to accept it.
            </p>
            <SwitchAccount next={self} />
          </div>
        )}
      </AuthShell>
    );
  }

  return (
    <AuthShell title={`Join ${invite.companyName}`} description={description}>
      <div className="flex flex-col gap-3">
        <p className="text-title-md text-on-surface">Already have an account?</p>
        <Button variant="tonal" size="lg" asChild>
          <Link href={`/sign-in?next=${encodeURIComponent(self)}`}>Sign in to accept</Link>
        </Button>
      </div>
      <Divider label="or create one" />
      <SignUpForm googleEnabled={Boolean(env.GOOGLE_CLIENT_ID)} defaultType="carrier" defaultEmail={invite.email} lockType callbackURL={self} signInHref={`/sign-in?next=${encodeURIComponent(self)}`} />
    </AuthShell>
  );
}
