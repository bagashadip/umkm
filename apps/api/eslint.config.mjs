import js from "@eslint/js";
import tseslint from "typescript-eslint";

/**
 * The API ships a `lint` script, but ESLint 9 needs a flat config and this
 * package never had one — the script failed for anyone who ran it.
 */
export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", "test-results/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        // Types are not checked here; `tsc --noEmit` in CI covers that, and
        // without this eslint tries to load the type program twice.
        projectService: false,
      },
    },
    rules: {
      // NestJS and Jest both rely on parameters that eslint cannot see used.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      // A fallback that quietly changes rendering must stay observable.
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  {
    files: ["**/*.spec.ts", "scripts/**/*.ts", "api/**/*.js"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
