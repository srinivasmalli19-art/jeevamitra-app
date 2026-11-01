// DEVELOPMENT/TEST ONLY: runs the real app against in-memory Firebase fakes
// (src/dev/fakes) so every screen can be clicked through safely.
// Usage: npx vite --config vite.harness.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

const fakes = path.resolve(import.meta.dirname, "src/dev/fakes");
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^firebase\/firestore$/, replacement: `${fakes}/firestore.js` },
      { find: /^firebase\/auth$/, replacement: `${fakes}/auth.js` },
      { find: /^firebase\/storage$/, replacement: `${fakes}/storage.js` },
      { find: /^firebase\/app$/, replacement: `${fakes}/app.js` },
      { find: /^@capacitor\/core$/, replacement: `${fakes}/capacitorCore.js` },
      { find: /^@capacitor\/push-notifications$/, replacement: `${fakes}/push.js` },
    ],
  },
});
