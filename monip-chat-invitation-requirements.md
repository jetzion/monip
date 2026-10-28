# Requirements: Timed AI Chat Invitation for MONIP Group

Status: implemented 2026-10-28 (PLAN.md section 18). Off until an admin switches it on.

## Goal

Add a small, optional invitation bubble to MONIP Group’s existing **“Chat with us”** button. The bubble should invite visitors to start a conversation, then disappear on its own after a short time. Visitors should never have to dismiss it.

## Visitor experience

1. The existing **“Chat with us”** button remains fixed in the bottom-right corner.
2. On eligible pages, a short invitation bubble appears beside the button after a brief delay.
3. The bubble remains visible for **10 seconds**, then fades away automatically.
4. Clicking either the invitation or the chat button opens the chat.
5. If the visitor does nothing, the bubble disappears and the chat button remains available.
6. The invitation is shown on up to the number of page views per visit an admin sets (1 to 10, default 1), at most once per page view. A visit is one browser-tab session: a new tab or a later return is a new visit.

## Eligible pages

- **Shown on:** Home, Products (list and detail), Services, Success Stories (list and detail), About, and Clients.
- **Never shown on:** Contact (it already has a form), Privacy, and the 404 page.

## Invitation questions (CMS)

- Editors manage the invitation questions in the CMS, with several questions per page type (Home, Products list, Product detail, Services, Success Stories list, Success Story detail, About, Clients).
- For each page, AI picks the question it judges most relevant to that page's content from the questions entered for that page type. On a product detail page, for example, it picks the question that best fits that product.
- Example questions:
  - **Home:** “Looking for the right products for your business?”
  - **Products:** “Need help finding a product?”
  - **Product detail:** “Questions about this product?”
  - **Services:** “Have a sourcing or merchandising question?”
  - **Success Stories:** “Have a project like this in mind?”
  - **About, Clients:** “Exploring products or sourcing for your business? We can help.”
- Admins can switch the invitation on or off for the whole site in the CMS.

## Behavior requirements

- Wait **5 seconds** after the page becomes ready before showing the invitation. Only count time while the tab is visible.
- Keep the bubble visible for **10 seconds**. Pause this timer while the bubble is hovered or has keyboard focus, then fade it out.
- While the bubble is visible, the visitor can continue to use the site with no interruptions.
- Use a brief fade transition when it appears and disappears.
- Do not open the chat automatically.
- Do not require or display a dismiss button; the invitation expires automatically.
- If the visitor opens the chat, cancel the invitation timer and do not show the bubble again during that visit.
- Show the bubble on at most **Times shown per visit** page views per visit (admin-only setting, 1 to 10, default 1).
- If the visitor navigates away before the delay finishes, do not show the stale invitation. Restart the delay on the next eligible page, using that page's question. The invitation counts as used only once it has been shown.

## Visual and accessibility requirements

- Match the chat button’s shape and style (rounded, clean typography, subtle shadow) in a contrasting amber (`--highlight`, #f5a524, navy text) so it stands out from the indigo button.
- Position the bubble immediately above or beside the existing bottom-right chat button. It must not cover the chat button or any form controls, and must stay within the screen width.
- Keep the chat button visible and usable on desktop and mobile.
- Respect reduced-motion preferences by removing or shortening the fade.
- Announce the invitation politely to assistive technology (a status message read when the screen reader is idle). Do not move focus to the bubble.
- Keep the existing chat button's clear accessible name (“Chat with us”).

## Analytics

- Record when an invitation is shown and when it is clicked, so MONIP can see how often it leads to a chat.

## Acceptance criteria

- On an eligible page, the invitation appears after 5 seconds of the tab being visible.
- It disappears automatically after 10 seconds without requiring visitor action (longer only while hovered or focused).
- Clicking the invitation opens the chat and prevents the invitation from returning during that visit.
- Ignoring the invitation leaves the chat button available.
- Page navigation does not cause repeated or stale invitations.
- The invitation never appears on Contact, Privacy, or the 404 page, or when switched off in the CMS.
- The question shown comes from that page type's questions in the CMS.
- The bubble remains legible and does not cover the chat button or form controls at desktop and mobile sizes.

## Decisions (2026-10-28)

1. **When the AI picks the question:** once when the page is published or updated, with the choice saved alongside the page. No AI call per visit, no added delay, and no visitor data sent to the AI.
2. **Fallback:** if the AI is unavailable or has not picked yet, show the first question in that page type's list.
3. **No questions entered:** if a page type has no questions, the invitation is skipped on that page.
4. **Analytics provider:** Vercel Web Analytics (cookieless). The Monip team is on the Pro plan, which includes custom events for "invitation shown" and "invitation clicked".
5. **Changes (2026-10-28, after launch review):** visible for 10 seconds instead of 6; amber instead of the button’s indigo; admins set how many page views per visit show it (1 to 10).
