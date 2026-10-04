import { defineConfig } from "@playwright/test";

const WEB_PORT = 3210;
const API_PORT = 3211;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 70_000,
  expect: { timeout: 8_000 },
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${WEB_PORT}`, trace: "off" },
  webServer: [
    {
      // NEXT_PUBLIC_API_URL is inlined when Next compiles, so it has to be set
      // for the build this webServer runs — without it the page falls back to
      // localhost:3001 and every API call fails with "Failed to fetch".
      command: "npm run start -- -p " + WEB_PORT,
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: true,
      timeout: 240_000,
      env: {
        NEXT_PUBLIC_API_URL:
          process.env.NEXT_PUBLIC_API_URL ?? `http://localhost:${API_PORT}/api`,
      },
    },
    {
      command: "npm run build && node dist/src/main.js",
      cwd: "../api",
      url: `http://localhost:${API_PORT}/api/features`,
      reuseExistingServer: true,
      timeout: 120_000,
      env: {
        CORS_ORIGINS: `http://localhost:${WEB_PORT}`,
        PORT: String(API_PORT),
        AI_PLANNER_CONTENT_ENABLED: process.env.AI_PLANNER_CONTENT_ENABLED ?? "",
        DATABASE_URL: process.env.DATABASE_URL ?? "",
      },
    },
  ],
});
