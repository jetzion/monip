"use client";

import { cn } from "cn";
import { RotateCcw, Send, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { pickGreeting } from "@/lib/chat/greetings";
import type { ChatMessage } from "@/lib/chat/validate";
import { CHAT_LIMITS } from "@/lib/chat/validate";
import { CHAT_OPENED_EVENT, OPEN_CHAT_EVENT, markChatOpened } from "@/lib/invitation/session";

import { AssistantAvatar } from "./AssistantAvatar";
import { TypedReply } from "./TypedReply";

/** Display name of the assistant; also set in the system prompt (lib/chat/knowledge.ts). */
const ASSISTANT_NAME = "David";

/**
 * Floating chat button and panel. The conversation lives in memory: it
 * survives closing the panel and moving between pages, and clears on reload.
 */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [greeting, setGreeting] = useState(pickGreeting);
  // Index of the message David is typing; -1 is the greeting.
  const [typing, setTyping] = useState<number | null>(-1);
  const [conversation, setConversation] = useState(0);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const opened = useRef(false);

  // The chat invitation opens the chat; once open, the invitation is not shown again this visit.
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(OPEN_CHAT_EVENT, show);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, show);
  }, []);

  useEffect(() => {
    if (!open) return;
    markChatOpened();
    window.dispatchEvent(new Event(CHAT_OPENED_EVENT));
  }, [open]);

  // Focus the input on open; return focus to the toggle after closing (it is
  // hidden on phones while the full-screen panel is open).
  useEffect(() => {
    if (open) inputRef.current?.focus();
    else if (opened.current) toggleRef.current?.focus();
    opened.current ||= open;
  }, [open]);

  const scrollToEnd = () => {
    endRef.current?.scrollIntoView({ block: "end" });
  };

  useEffect(scrollToEnd, [messages, pending, error, open]);

  const close = () => setOpen(false);

  const send = async () => {
    const content = draft.trim();
    if (!content || pending) return;
    const history: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(history);
    setDraft("");
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = (await response.json()) as { reply?: string; error?: string };
      if (data.reply) {
        setMessages([...history, { role: "assistant", content: data.reply }]);
        setTyping(history.length);
      }
      else setError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("Could not reach the chat service. Check your connection and try again.");
    } finally {
      setPending(false);
      inputRef.current?.focus();
    }
  };

  const reply = (text: string, index: number) => (
    <TypedReply
      text={text}
      animate={typing === index}
      onTyped={() => setTyping(null)}
      onLetter={scrollToEnd}
      onNavigate={close}
    />
  );

  const restart = () => {
    setMessages([]);
    setGreeting(pickGreeting());
    setTyping(-1);
    setConversation(conversation + 1);
    setError(null);
    setDraft("");
    inputRef.current?.focus();
  };

  return (
    <>
      {open && (
        <section
          id="chat-panel"
          aria-label="Chat with us"
          onKeyDown={(event) => event.key === "Escape" && close()}
          className="fixed inset-0 z-[60] flex flex-col bg-white duration-300 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 sm:inset-auto sm:bottom-24 sm:right-4 sm:h-[min(600px,calc(100dvh-8rem))] sm:w-[380px] sm:overflow-hidden sm:rounded-2xl sm:border sm:border-border sm:shadow-card-hover"
        >
          <header className="header-band flex items-center gap-3 px-4 py-3 text-white">
            <AssistantAvatar className="size-10 shrink-0 rounded-full ring-2 ring-white/30" />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-lg font-semibold leading-tight">Chat with us</h2>
              <p className="text-xs text-on-dark-muted">{ASSISTANT_NAME}, MONIP&apos;s AI assistant</p>
            </div>
            <button type="button" onClick={restart} className={iconButton} title="New conversation">
              <RotateCcw aria-hidden="true" className="size-4" />
              <span className="sr-only">New conversation</span>
            </button>
            <button type="button" onClick={close} className={iconButton} title="Close chat">
              <X aria-hidden="true" className="size-5" />
              <span className="sr-only">Close chat</span>
            </button>
          </header>

          <div role="log" aria-live="polite" aria-busy={typing !== null} aria-label="Conversation" className="flex flex-1 flex-col gap-3 overflow-y-auto bg-linear-to-b from-tint to-accent p-4">
            <Bubble key={`greeting-${conversation}`} role="assistant">
              {reply(greeting, -1)}
            </Bubble>
            {messages.map((message, index) => (
              <Bubble key={index} role={message.role}>
                {message.role === "assistant" ? reply(message.content, index) : message.content}
              </Bubble>
            ))}
            {pending && (
              <Bubble role="assistant">
                <span className="sr-only">Typing</span>
                <span aria-hidden="true" className="inline-flex h-5 items-center gap-1">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="size-1.5 rounded-full bg-primary/60 motion-safe:animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </span>
              </Bubble>
            )}
            {error && (
              <p role="alert" className="rounded-lg border border-destructive/30 bg-white px-3 py-2 text-sm text-destructive">
                {error}{" "}
                <Link href="/contact" onClick={close} className="font-medium underline underline-offset-4">
                  Use the contact form
                </Link>
              </p>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
            className="border-t border-border bg-white p-3"
          >
            <div className="flex items-end gap-2">
              <label htmlFor="chat-input" className="sr-only">
                Your message
              </label>
              <textarea
                id="chat-input"
                ref={inputRef}
                rows={2}
                value={draft}
                maxLength={CHAT_LIMITS.maxMessageLength}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send();
                  }
                }}
                placeholder="Type a message"
                className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-input bg-white px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <button
                type="submit"
                disabled={pending || !draft.trim()}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
              >
                <Send aria-hidden="true" className="size-4" />
                <span className="sr-only">Send message</span>
              </button>
            </div>
          </form>
        </section>
      )}

      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls="chat-panel"
        onClick={() => (open ? close() : setOpen(true))}
        className={cn(
          "fixed bottom-4 right-4 z-50 h-14 items-center justify-center gap-2.5 rounded-full bg-primary font-semibold text-primary-foreground shadow-card-hover transition duration-200 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50 motion-safe:hover:-translate-y-0.5",
          open ? "hidden w-14 sm:inline-flex" : "inline-flex pl-2 pr-5",
        )}
      >
        {open ? (
          <>
            <X aria-hidden="true" className="size-6" />
            <span className="sr-only">Close chat</span>
          </>
        ) : (
          <>
            <AssistantAvatar className="size-10 rounded-full ring-2 ring-white/40" />
            Chat with us
          </>
        )}
      </button>
    </>
  );
}

const iconButton =
  "inline-flex size-9 items-center justify-center rounded-lg text-white/90 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

const bubble =
  "whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-sm leading-relaxed duration-300 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1";

/** A message. Assistant replies carry David's face and name. */
function Bubble({ role, children }: { role: ChatMessage["role"]; children: React.ReactNode }) {
  if (role === "user") {
    return (
      <p className={cn(bubble, "max-w-[85%] self-end rounded-br-md bg-linear-to-br from-primary to-azure text-primary-foreground shadow-sm")}>
        <span className="sr-only">You: </span>
        {children}
      </p>
    );
  }
  return (
    <div className="flex max-w-[90%] items-start gap-2 self-start">
      <AssistantAvatar className="mt-5 size-8 shrink-0 rounded-full shadow-sm" />
      <div className="flex min-w-0 flex-col gap-1">
        <span aria-hidden="true" className="flex items-center gap-1.5 text-xs font-semibold text-navy">
          {ASSISTANT_NAME}
        </span>
        <p className={cn(bubble, "rounded-tl-md border border-border bg-card text-foreground shadow-card")}>
          <span className="sr-only">{ASSISTANT_NAME}: </span>
          {children}
        </p>
      </div>
    </div>
  );
}
