import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Local build artifacts: `vercel build` writes here, and `playwright test`
    // writes traces/videos. Neither is source, but neither is covered by
    // eslint-config-next's own ignores — so `npm run lint` started failing
    // the moment a Vercel build had been run locally.
    ".vercel/**",
    "test-results/**",
    "playwright-report/**",
  ]),
]);

export default eslintConfig;
