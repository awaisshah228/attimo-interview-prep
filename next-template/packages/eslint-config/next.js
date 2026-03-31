import baseConfig from "./base.js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...baseConfig,
  {
    // Next.js specific rules are handled by eslint-config-next
    // which is auto-configured via next.config
    rules: {
      "react/react-in-jsx-scope": "off",
    },
  },
];
