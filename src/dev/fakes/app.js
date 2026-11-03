// DEVELOPMENT/TEST ONLY. Stand-in for "firebase/app".
export const initializeApp = () => ({ __app: true });
export const getApp = () => ({ __app: true });
