// v62: window events used by PushManager.
export const ASK_PUSH_EVENT = "jm:ask-push";
export const BANNER_EVENT = "jm:push-banner";

/** Call after a user's first post or chat message: may show the "Turn on alerts?" sheet once. */
export function askForPushSoon() {
  setTimeout(() => window.dispatchEvent(new Event(ASK_PUSH_EVENT)), 1200);
}
