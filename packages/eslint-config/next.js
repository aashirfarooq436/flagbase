import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";
import onlyWarn from "eslint-plugin-only-warn";

/** Shared ESLint config for the Next.js apps (App Router). */
export const nextJsConfig = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  eslintConfigPrettier,
  {
    plugins: { onlyWarn },
  },
  {
    ignores: [".next/**"],
  },
];
