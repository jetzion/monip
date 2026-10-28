/** How many times the invitation has been shown in this tab session. */
const SHOWN_KEY = "monip-chat-invitation-shown";

/** Set once the chat has been opened in this tab session; the invitation then stops. */
const CHAT_OPENED_KEY = "monip-chat-opened";

/** Dispatched by the invitation to open the chat. */
export const OPEN_CHAT_EVENT = "monip:open-chat";

/** Dispatched by the chat when it opens, so a waiting or visible invitation stops. */
export const CHAT_OPENED_EVENT = "monip:chat-opened";

const shownCount = () => Number(sessionStorage.getItem(SHOWN_KEY) ?? 0);

/** True while the chat has not been opened and the invitation has been shown fewer than `maxShows` times. */
export const canShowInvitation = (maxShows: number) =>
  sessionStorage.getItem(CHAT_OPENED_KEY) !== "1" && shownCount() < maxShows;

export const recordInvitationShown = () => sessionStorage.setItem(SHOWN_KEY, String(shownCount() + 1));

export const markChatOpened = () => sessionStorage.setItem(CHAT_OPENED_KEY, "1");
