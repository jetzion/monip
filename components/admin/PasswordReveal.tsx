"use client";

import { Eye, EyeOff } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const noSubscription = () => () => {};
const passwordInput = () => document.getElementById("field-password") as HTMLInputElement | null;

/**
 * An eye button inside the login page's Password field that shows or hides the
 * password (admin.components.afterLogin). Payload's login form offers no slot
 * in the field itself, so the button is placed next to the input with a portal.
 * Its name comes from hidden text, not aria-label, so only the input matches
 * the "Password" label. Covered by tests/e2e/login-password.spec.ts.
 */
export function PasswordReveal() {
  const input = useSyncExternalStore(noSubscription, passwordInput, () => null);
  const [shown, setShown] = useState(false);
  // After a pointer click, typing continues at the end of the password.
  const refocus = useRef(false);

  // React sets type="password" again on every render of the field (each keystroke),
  // so while shown, put "text" back whenever it does.
  useEffect(() => {
    const field = passwordInput();
    if (!field) return;
    field.type = shown ? "text" : "password";
    if (refocus.current) {
      refocus.current = false;
      field.focus();
      field.setSelectionRange(field.value.length, field.value.length);
    }
    if (!shown) return;
    const observer = new MutationObserver(() => {
      if (field.type !== "text") field.type = "text";
    });
    observer.observe(field, { attributes: true, attributeFilter: ["type"] });
    return () => observer.disconnect();
  }, [input, shown]);

  if (!input?.parentElement) return null;
  return createPortal(
    <button
      type="button"
      className="password-reveal"
      aria-pressed={shown}
      aria-controls="field-password"
      title={shown ? "Hide password" : "Show password"}
      onClick={(event) => {
        // detail is 0 for a keyboard press: keyboard users keep focus on the button.
        refocus.current = event.detail > 0;
        setShown((value) => !value);
      }}
    >
      {shown ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      <span className="password-reveal__label">Show password</span>
    </button>,
    input.parentElement,
  );
}
