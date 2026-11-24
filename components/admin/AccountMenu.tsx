"use client";

import { Popup, PopupList, useAuth, useConfig } from "@payloadcms/ui";

import { avatarColor, initialsOf } from "@/lib/admin/initials";

/**
 * The avatar at the top right of the admin (the user's initials in a colour of
 * their own, see lib/admin/initials.ts), with a menu: who is signed in,
 * Account, and Log out. Replaces Payload's avatar link (hidden in custom.scss),
 * which can only open the account page.
 */
export function AccountMenu() {
  const { user } = useAuth();
  const { config } = useConfig();
  if (!user) return null;
  const admin = config.routes.admin;
  const logout = config.admin.routes?.logout ?? "/logout";

  return (
    <Popup
      className="account-menu"
      buttonType="custom"
      button={
        <span className="account-menu__avatar">
          <span className="account-menu__initials" style={{ backgroundColor: avatarColor(user.id) }} aria-hidden="true">
            {initialsOf(
              "firstName" in user ? (user.firstName as string | null) : null,
              "lastName" in user ? (user.lastName as string | null) : null,
              "email" in user ? (user.email as string) : null,
            )}
          </span>
          <span className="account-menu__label">Account menu</span>
        </span>
      }
      horizontalAlign="right"
      size="fit-content"
      caret={false}
    >
      <PopupList.ButtonGroup>
        {"email" in user && typeof user.email === "string" && <p className="account-menu__who">{user.email}</p>}
        <PopupList.Button href={`${admin}/account`}>Account</PopupList.Button>
        <PopupList.Button href={`${admin}${logout}`}>Log out</PopupList.Button>
      </PopupList.ButtonGroup>
    </Popup>
  );
}
