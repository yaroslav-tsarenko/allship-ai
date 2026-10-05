import { AppShell } from "@/features/shell/app-shell";
import { TourProvider } from "@/features/tours/tour-provider";
import { completedTourIds } from "@/server/tours/progress";
import { getViewer } from "@/server/viewer/viewer";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  const completed = await completedTourIds(viewer.user.id).catch(() => []);
  const impersonating = Boolean(viewer.session.session.impersonatedBy);
  return (
    <TourProvider role={viewer.role} initialCompleted={completed} autoStart={!impersonating && !viewer.needsOnboarding}>
      <AppShell viewer={viewer}>{children}</AppShell>
    </TourProvider>
  );
}
