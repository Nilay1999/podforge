import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["dist", "node_modules"] },

  // Base JS + TypeScript rules
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // Catches missing deps (stale closures) and conditional hook calls — real bugs
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",

      // Breaks React Fast Refresh in Vite when violated
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // Unused vars are always a mistake
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      // Enforces import type for type-only imports (helps tree-shaking)
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],

      "@typescript-eslint/no-explicit-any": "warn",
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },

  // Must be last — disables ESLint rules that would conflict with Prettier formatting
  prettier,
);
