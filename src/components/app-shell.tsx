import Image from "next/image";
import { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen nexus-bg text-slate-100">
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <div className="fixed inset-y-0 right-0 left-0">
          <Image
            src="/nexus-logo.jpg"
            alt=""
            width={860}
            height={860}
            priority
            className="fixed right-[6%] top-1/2 -translate-y-1/2 opacity-[0.05] grayscale"
          />
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-5 md:px-6">{children}</div>
    </div>
  );
}
