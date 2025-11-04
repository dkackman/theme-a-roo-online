import { fixupPluginRules } from "@eslint/compat";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        React: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": fixupPluginRules(typescriptEslint),
      react: fixupPluginRules(react),
      "react-hooks": fixupPluginRules(reactHooks),
      "jsx-a11y": fixupPluginRules(jsxA11y),
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // React rules (React 19 doesn't require React import)
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react/jsx-uses-vars": "error",
      "react/prop-types": "off",
      "react/display-name": "off",
      // Best practices
      "no-console": [
        "warn",
        {
          allow: ["warn", "error"],
        },
      ],
      // Disable base rule as TypeScript handles this
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "no-var": "error",
      "prefer-const": "error",
      "prefer-arrow-callback": "warn",
      "no-duplicate-imports": "error",
      // Code quality
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-else-return": "warn",
      "no-nested-ternary": "warn",
      // Async/Promise best practices
      "no-async-promise-executor": "error",
      "no-await-in-loop": "warn",
      "require-await": "warn",
      // React Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // TypeScript specific
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-module-boundary-types": "off",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "dist/**",
      "build/**",
      "*.config.js",
      "*.config.mjs",
      "*.config.ts",
      "edge-src/**",
    ],
  },
];
