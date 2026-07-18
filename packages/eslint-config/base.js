import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import onlyWarn from "eslint-plugin-only-warn";
import tseslint from "typescript-eslint";

/**
 * Shared ESLint config for plain TypeScript packages (no framework).
 *
 * `eslint-config-prettier` turns off stylistic rules that Prettier owns (formatting is not
 * ESLint's job here). `only-warn` downgrades everything to a warning, so lint informs but
 * never fails a build — drop it if you want lint to gate.
 */
export const config = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    plugins: { onlyWarn },
  },
  {
    ignores: ["dist/**", "coverage/**"],
  },
];
