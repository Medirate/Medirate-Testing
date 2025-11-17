import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  ...compat.config({
    extends: ["next"],
    rules: {
      "react/no-unescaped-entities": "off",
      "@next/next/no-page-custom-font": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",
    "no-console": "off",
    "no-debugger": "off",
    "no-alert": "off",
    "no-undef": "off",
    "no-redeclare": "off",
    "no-dupe-keys": "off",
    "no-duplicate-case": "off",
    "no-empty": "off",
    "no-ex-assign": "off",
    "no-extra-boolean-cast": "off",
    "no-extra-semi": "off",
    "no-func-assign": "off",
    "no-inner-declarations": "off",
    "no-invalid-regexp": "off",
    "no-irregular-whitespace": "off",
    "no-obj-calls": "off",
    "no-sparse-arrays": "off",
    "no-unreachable": "off",
    "use-isnan": "off",
    "valid-typeof": "off",
    },
  }),
];

export default eslintConfig;
