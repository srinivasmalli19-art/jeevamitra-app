// v62: notification taps may only open screens inside the app.
export function safeLink(link) {
  if (typeof link !== "string") return "/";
  if (!link.startsWith("/") || link.startsWith("//")) return "/";
  return /^\/[A-Za-z0-9/_\-?=&%.]*$/.test(link) ? link : "/";
}
