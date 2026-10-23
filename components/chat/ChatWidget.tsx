"use client";

import { cn } from "cn";
import { MessageCircle, RotateCcw, Send, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { ChatMessage } from "@/lib/chat/validate";
import { CHAT_LIMITS } from "@/lib/chat/validate";

const WELCOME =
  "Hello! Ask me about MONIP Group's services, product samples, or how we work. For quotes and pricing, use the contact form.";

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
  const toggleRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const opened = useRef(false);

  // Focus the input on open; return focus to the toggle after closing (it is
  // hidden on phones while the full-screen panel is open).
  useEffect(() => {
    if (open) inputRef.current?.focus();
    else if (opened.current) toggleRef.current?.focus();
    opened.current ||= open;
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, pending, error, open]);

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
      if (data.reply) setMessages([...history, { role: "assistant", content: data.reply }]);
      else setError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("Could not reach the chat service. Check your connection and try again.");
    } finally {
      setPending(false);
      inputRef.current?.focus();
    }
  };

  const restart = () => {
    setMessages([]);
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
          className="fixed inset-0 z-[60] flex flex-col bg-white sm:inset-auto sm:bottom-24 sm:right-4 sm:h-[min(600px,calc(100dvh-8rem))] sm:w-[380px] sm:overflow-hidden sm:rounded-2xl sm:border sm:border-border sm:shadow-card-hover"
        >
          <header className="flex items-center gap-2 bg-navy px-4 py-3 text-white">
            <h2 className="font-display flex-1 text-lg font-semibold">Chat with us</h2>
            <button type="button" onClick={restart} className={iconButton} title="New conversation">
              <RotateCcw aria-hidden="true" className="size-4" />
              <span className="sr-only">New conversation</span>
            </button>
            <button type="button" onClick={close} className={iconButton} title="Close chat">
              <X aria-hidden="true" className="size-5" />
              <span className="sr-only">Close chat</span>
            </button>
          </header>

          <div role="log" aria-live="polite" aria-label="Conversation" className="flex flex-1 flex-col gap-3 overflow-y-auto bg-tint p-4">
            <Bubble role="assistant">{WELCOME}</Bubble>
            {messages.map((message, index) => (
              <Bubble key={index} role={message.role}>
                {message.content}
              </Bubble>
            ))}
            {pending && (
              <p className="self-start rounded-2xl bg-white px-4 py-2 text-sm text-muted-foreground shadow-sm">
                Typing<span className="animate-pulse">...</span>
              </p>
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
                className="max-h-32 min-h-11 flex-1 resize-none rounded-lg border border-input px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <button
                type="submit"
                disabled={pending || !draft.trim()}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
              >
                <Send aria-hidden="true" className="size-4" />
                <span className="sr-only">Send message</span>
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Replies are generated by AI and may be wrong. Please do not share personal or confidential details.
            </p>
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
          "fixed bottom-4 right-4 z-50 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card-hover transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50 size-14",
          open ? "hidden sm:inline-flex" : "inline-flex",
        )}
      >
        {open ? <X aria-hidden="true" className="size-6" /> : <MessageCircle aria-hidden="true" className="size-6" />}
        <span className="sr-only">{open ? "Close chat" : "Chat with us"}</span>
      </button>
    </>
  );
}

const iconButton =
  "inline-flex size-9 items-center justify-center rounded-lg text-white/90 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

function Bubble({ role, children }: { role: ChatMessage["role"]; children: string }) {
  return (
    <p
      className={cn(
        "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-sm leading-relaxed",
        role === "user" ? "self-end bg-primary text-primary-foreground" : "self-start bg-white text-foreground shadow-sm",
      )}
    >
      <span className="sr-only">{role === "user" ? "You: " : "MONIP: "}</span>
      {children}
    </p>
  );
}
