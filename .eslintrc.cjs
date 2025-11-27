/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended", // must be end
  ],
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": "warn",
  },
};
