"use client";

import { track } from "@vercel/analytics";
import { cn } from "cn";
import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from "react";

import type { InvitationPage } from "@/lib/invitation/question";
import { CHAT_OPENED_EVENT, OPEN_CHAT_EVENT, canShowInvitation, recordInvitationShown } from "@/lib/invitation/session";

const DELAY_MS = 5_000;
const VISIBLE_MS = 10_000;
const FADE_MS = 300;

type Phase = "waiting" | "visible" | "fading" | "done";

const subscribeVisibility = (onChange: () => void) => {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
};

/** True while the tab is in view. */
const usePageVisible = () =>
  useSyncExternalStore(subscribeVisibility, () => document.visibilityState === "visible", () => false);

/** Calls `onDone` after `ms` of time while `running`; pausing keeps the time left. */
function usePausableTimeout(ms: number, running: boolean, onDone: () => void) {
  const remaining = useRef(ms);
  const done = useEffectEvent(onDone);
  useEffect(() => {
    if (!running) return;
    const start = Date.now();
    const id = setTimeout(done, remaining.current);
    return () => {
      clearTimeout(id);
      remaining.current -= Date.now() - start;
    };
  }, [running]);
}

/**
 * Question shown beside the "Chat with us" button: after 5 seconds of the tab
 * being in view, for 10 seconds (paused while hovered or focused), on up to
 * `maxShows` page views per tab session, and never after the chat is opened.
 * Clicking it opens the chat. Showing and clicking are recorded in Vercel Web
 * Analytics with the page type and question.
 */
export function InvitationBubble({ page, question, maxShows }: { page: InvitationPage; question: string; maxShows: number }) {
  const [phase, setPhase] = useState<Phase>("waiting");
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const visible = usePageVisible();

  usePausableTimeout(DELAY_MS, phase === "waiting" && visible, () => {
    if (!canShowInvitation(maxShows)) return setPhase("done");
    recordInvitationShown();
    track("Chat invitation shown", { page, question });
    setPhase("visible");
  });
  usePausableTimeout(VISIBLE_MS, phase === "visible" && visible && !hovered && !focused, () => setPhase("fading"));
  usePausableTimeout(FADE_MS, phase === "fading", () => setPhase("done"));

  useEffect(() => {
    const stop = () => setPhase("done");
    window.addEventListener(CHAT_OPENED_EVENT, stop);
    return () => window.removeEventListener(CHAT_OPENED_EVENT, stop);
  }, []);

  const shown = phase === "visible" || phase === "fading";

  return (
    // Phones: above the chat button. Wider screens: beside it (11.5rem = 1rem margin + 158px button + gap),
    // so it stays clear of controls near the bottom of the page, such as the hero video's pause button.
    <div
      role="status"
      className="pointer-events-none fixed bottom-[5.25rem] right-4 z-50 max-w-[calc(100vw-2rem)] sm:bottom-4 sm:right-[11.5rem] sm:max-w-xs"
    >
      {shown && (
        <button
          type="button"
          onClick={() => {
            track("Chat invitation clicked", { page, question });
            window.dispatchEvent(new Event(OPEN_CHAT_EVENT));
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={cn(
            "pointer-events-auto rounded-2xl rounded-br-sm bg-highlight px-4 py-3 text-left font-semibold text-navy shadow-card-hover transition-opacity duration-300 starting:opacity-0 hover:bg-highlight-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50 motion-reduce:transition-none",
            phase === "fading" && "pointer-events-none opacity-0",
          )}
        >
          {question}
        </button>
      )}
    </div>
  );
}
