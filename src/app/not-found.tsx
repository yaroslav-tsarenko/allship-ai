import type { Metadata } from "next";
import { NotFoundView } from "@/components/feedback/not-found-view";
import { Logo } from "@/components/ui/logo";

export const metadata: Metadata = { title: "Page not found", robots: { index: false, follow: true } };

export default function NotFound() {
  return (
    <>
      <header className="mx-auto flex h-16 max-w-[1280px] items-center px-4 medium:px-8">
        <Logo />
      </header>
      <main id="main">
        <NotFoundView />
      </main>
    </>
  );
}
