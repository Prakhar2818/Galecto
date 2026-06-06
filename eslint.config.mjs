import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: {
          jsx: true,
        },
      },
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-unsafe-function-type": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-wrapper-object-types": "warn",
      "no-undef": "off",
      "no-empty": "warn",
      "no-useless-escape": "warn",
      "no-debugger": "warn",
      "no-constant-condition": "warn",
      "no-empty-pattern": "warn",
      "no-var": "warn",
      "prefer-const": "warn",
      "no-unsafe-finally": "off",
    },
  },
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.git/**",
      "**/playwright-report/**",
      "**/test_output.txt",
      "**/.run-logs/**",
      "**/*.config.js",
      "**/*.config.ts",
      "**/scripts/**",
      "**/tests/**",
      "**/*.js",
      "**/.next/**",
      "**/prisma/**",
      "**/generate-pdf.js",
      "**/test.js",
      "**/*.d.ts",
      "**/tsconfig.json",
      "**/NGO-APP/**",
      "**/vite.config.js",
    ],
  },
];
