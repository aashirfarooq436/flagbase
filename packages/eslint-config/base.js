import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import onlyWarn from "eslint-plugin-only-warn";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";

/**
 * Best-practice rules shared by every FlagBase ESLint config (base / next / react-internal).
 *
 * This is where the *rule* concerns live that Prettier deliberately does NOT own:
 *  - import ordering/grouping  → `simple-import-sort` (Prettier only formats; it never reorders)
 *  - dead-import & unused-var pruning → `eslint-plugin-unused-imports` (auto-fixable)
 *
 * Kept as a standalone fragment so the framework configs can spread the same rules.
 */
export const bestPractices = {
  plugins: {
    "simple-import-sort": simpleImportSort,
    "unused-imports": unusedImports,
  },
  rules: {
    // Deterministic import grouping: side-effects → node builtins → workspace (@flagbase/*)
    // → other third-party → app alias (@/*) → relative. Auto-fixed by `eslint --fix`.
    "simple-import-sort/imports": [
      "warn",
      {
        groups: [
          ["^\\u0000"],
          ["^node:"],
          ["^@flagbase/"],
          ["^@?\\w"],
          ["^@/"],
          ["^\\."],
        ],
      },
    ],
    "simple-import-sort/exports": "warn",

    // Remove unused imports outright (auto-fix); flag other unused bindings, respecting the
    // `_`-prefix convention for intentionally-unused args/vars.
    "@typescript-eslint/no-unused-vars": "off",
    "unused-imports/no-unused-imports": "warn",
    "unused-imports/no-unused-vars": [
      "warn",
      {
        vars: "all",
        varsIgnorePattern: "^_",
        args: "after-used",
        argsIgnorePattern: "^_",
      },
    ],
  },
};

/**
 * Shared ESLint config for plain TypeScript packages (no framework).
 *
 * `eslint-config-prettier` turns off the stylistic rules Prettier owns (formatting is not
 * ESLint's job). `only-warn` downgrades everything to a warning, so lint informs but never
 * fails a build — drop it if you want lint to gate.
 */
export const config = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    plugins: { onlyWarn },
  },
  bestPractices,
  {
    ignores: ["dist/**", "coverage/**", "**/*.tsbuildinfo"],
  },
];
