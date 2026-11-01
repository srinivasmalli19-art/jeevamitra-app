// DEVELOPMENT/TEST ONLY. Stand-in for "@capacitor/push-notifications".
// Test hooks on window.__fakePush: setPermission, receive (app open), tap.
const listeners = {};
let permission = localStorage.getItem("fakePushPermission") || "prompt";
const log = (window.__fakePushLog = window.__fakePushLog || []);
const emit = (name, data) => (listeners[name] || []).forEach((fn) => fn(data));
export const PushNotifications = {
  async checkPermissions() { return { receive: permission }; },
  async requestPermissions() { permission = "granted"; localStorage.setItem("fakePushPermission", permission); log.push("requestPermissions"); return { receive: permission }; },
  async register() { log.push("register"); setTimeout(() => emit("registration", { value: "fake-fcm-token-123" }), 20); },
  async createChannel(c) { log.push("channel:" + c.id); },
  async addListener(name, fn) {
    (listeners[name] = listeners[name] || []).push(fn);
    return { remove: () => { listeners[name] = listeners[name].filter((f) => f !== fn); } };
  },
};
window.__fakePush = {
  setPermission: (p) => { permission = p; localStorage.setItem("fakePushPermission", p); },
  receive: (title, body, link) => emit("pushNotificationReceived", { title, body, data: { link } }),
  tap: (link) => emit("pushNotificationActionPerformed", { notification: { data: { link } } }),
  log,
};
