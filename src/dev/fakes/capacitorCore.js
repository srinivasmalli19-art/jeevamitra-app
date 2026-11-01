// DEVELOPMENT/TEST ONLY. Stand-in for "@capacitor/core": pretends to be the
// Android app when localStorage.fakeNative === "1".
export const Capacitor = {
  isNativePlatform: () => localStorage.getItem("fakeNative") === "1",
  getPlatform: () => (localStorage.getItem("fakeNative") === "1" ? "android" : "web"),
};
