import { ViewTransition } from "react";

/** Remounts on each navigation, so page content fades out and the next page fades in. */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      {children}
    </ViewTransition>
  );
}
