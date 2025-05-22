import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import { defineConfig } from "eslint/config";

// Define the file patterns for src and demo folders
const filesToLint = [
  "src/**/*.{js,mjs,cjs,ts,jsx,tsx}",
  "demo/**/*.{js,mjs,cjs,ts,jsx,tsx}",
  "tests/**/*.{js,mjs,cjs,ts,jsx,tsx}",
];

export default defineConfig([
  { files: filesToLint, plugins: { js }, rules: js.configs.recommended.rules }, // Using rules from js.configs.recommended directly
  { files: filesToLint, languageOptions: { globals: globals.browser } },
  // Apply file patterns to tseslint recommended configs
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: filesToLint,
  })),
  // Apply file patterns to pluginReact recommended configs
  { ...pluginReact.configs.flat.recommended, files: filesToLint },
  { ...eslintPluginPrettierRecommended, files: filesToLint },
]);
