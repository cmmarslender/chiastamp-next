import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: {},
});

const eslintConfig = [
    {
        ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"],
    },
    ...compat.extends(
        "eslint:recommended",
        "next/core-web-vitals",
        "next/typescript",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/strict",
        "plugin:react/recommended",
        "plugin:prettier/recommended",
        "eslint-config-prettier",
    ),
    {
        rules: {
            strict: ["error", "global"], // Enforces 'use strict'
            "no-console": "warn", // Discourages console.log
            "no-debugger": "error", // Prevents debugger usage
            eqeqeq: ["error", "always"], // Enforces strict equality
            "@typescript-eslint/no-explicit-any": "error", // Prevents `any` usage
            "@typescript-eslint/explicit-function-return-type": "error", // Forces explicit return types
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }], // Prevents unused variables
            "@typescript-eslint/consistent-type-imports": "error", // Enforces type imports over value imports
            "react/jsx-boolean-value": ["error", "always"], // Forces explicit boolean values in JSX
            "react/prop-types": "off", // Not needed with TypeScript
            "prettier/prettier": "error", // ESLint will report formatting issues
        },
    },
];

export default eslintConfig;
