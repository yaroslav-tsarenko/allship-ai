import type { Metadata } from "next";
import { Reveal } from "@/components/motion/reveal";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { callIcon, mailIcon } from "@/components/ui/icons.generated";
import { PageHeader } from "@/components/ui/page-header";
import { requireCarrierStaff } from "@/features/board/eligibility";
import { AddDriverButton } from "@/features/team/add-driver-dialog";
import { InviteForm } from "@/features/team/invite-form";
import { InvitationActions, MemberRoleSelect, RemoveMemberButton } from "@/features/team/member-actions";
import { Avatar, RoleChip } from "@/features/team/roles";
import { teamFor } from "@/server/team/service";
import { getViewer } from "@/server/viewer/viewer";

export const metadata: Metadata = { title: "Team" };

const joinedFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

function expiresIn(date: Date) {
  const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  return days <= 1 ? "Expires today" : `Expires in ${days} days`;
}

export default async function TeamPage() {
  const viewer = await getViewer();
  const org = requireCarrierStaff(viewer);
  const isOwner = viewer.role === "owner";
  const { members, invitations } = await teamFor(org.orgId!);
  const drivers = members.filter((m) => m.role === "driver").length;

  return (
    <div className="mx-auto max-w-[960px]">
      <PageHeader
        title="Team"
        description={`${org.orgName} · ${members.length} ${members.length === 1 ? "person" : "people"}, ${drivers} ${drivers === 1 ? "driver" : "drivers"}`}
        actions={<AddDriverButton variant="tonal" />}
      />
      <Reveal stagger={0.06} className="flex flex-col gap-6">
        <Card as="section" data-tour="team-invite" aria-labelledby="invite-title" className="p-5 medium:p-6">
          <h2 id="invite-title" className="text-title-lg">
            Invite someone
          </h2>
          <p className="mt-1 mb-4 text-body-md text-on-surface-variant">
            {isOwner
              ? "They get an email with a link to join. Drivers only see the trips you assign to them."
              : "Dispatchers can invite drivers. They get an email with a link to join."}
          </p>
          <InviteForm canInviteDispatchers={isOwner} />
        </Card>

        <Card as="section" data-tour="team-members" aria-labelledby="members-title" className="overflow-hidden">
          <h2 id="members-title" className="px-5 pt-5 pb-3 text-title-lg medium:px-6">
            People
          </h2>
          <ul>
            {members.map((m) => {
              const isSelf = m.userId === viewer.user.id;
              const editable = isOwner && m.role !== "owner" && !isSelf;
              return (
                <li key={m.memberId} className="flex items-center gap-3 border-t border-outline-variant px-5 py-3.5 medium:gap-4 medium:px-6">
                  <Avatar name={m.name} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="truncate text-title-md text-on-surface">
                        {m.name}
                        {isSelf && <span className="text-on-surface-variant"> (you)</span>}
                      </span>
                      {!editable && <RoleChip role={m.role} />}
                    </p>
                    <p className="mt-0.5 flex flex-wrap gap-x-3 text-body-sm text-on-surface-variant">
                      <a href={`mailto:${m.email}`} className="inline-flex min-w-0 items-center gap-1 truncate rounded-xs hover:text-on-surface">
                        <Icon icon={mailIcon} size={14} />
                        <span className="truncate">{m.email}</span>
                      </a>
                      {m.phone && (
                        <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1 rounded-xs hover:text-on-surface">
                          <Icon icon={callIcon} size={14} />
                          {m.phone}
                        </a>
                      )}
                    </p>
                    <p className="mt-0.5 text-body-sm text-on-surface-variant">
                      Joined {joinedFmt.format(m.joinedAt)}
                      {m.activeTrips > 0 ? ` · ${m.activeTrips} active ${m.activeTrips === 1 ? "trip" : "trips"}` : ""}
                    </p>
                  </div>
                  {editable && (
                    <div className="flex shrink-0 items-center gap-1">
                      <MemberRoleSelect memberId={m.memberId} name={m.name} role={m.role as "dispatcher" | "driver"} />
                      <RemoveMemberButton memberId={m.memberId} name={m.name} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>

        <Card as="section" data-tour="team-pending" aria-labelledby="pending-title" className="overflow-hidden">
          <h2 id="pending-title" className="px-5 pt-5 pb-3 text-title-lg medium:px-6">
            Pending invitations
          </h2>
          {invitations.length === 0 ? (
            <p className="border-t border-outline-variant px-5 py-4 text-body-md text-on-surface-variant medium:px-6">No pending invitations.</p>
          ) : (
            <ul>
              {invitations.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-outline-variant px-5 py-3 medium:flex-nowrap medium:px-6">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-body-lg text-on-surface">{i.email}</span>
                      <RoleChip role={i.role} />
                    </p>
                    <p className="text-body-sm text-on-surface-variant">
                      Invited by {i.inviterName} · {expiresIn(i.expiresAt)}
                    </p>
                  </div>
                  {(isOwner || i.role === "driver") && <InvitationActions invitationId={i.id} email={i.email} />}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </Reveal>
    </div>
  );
}
