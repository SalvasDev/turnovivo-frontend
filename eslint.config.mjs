import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Next registers the jsx-a11y plugin but enables only 6 rules; turn on the full recommended set.
  { files: ["**/*.{jsx,tsx}"], rules: jsxA11y.flatConfigs.recommended.rules },
  {
    files: ["**/*.{jsx,tsx}"],
    rules: {
      // Dialogs move focus into themselves through DS components, as WAI-ARIA recommends.
      "jsx-a11y/no-autofocus": ["error", { ignoreNonDOM: true }],
      // Scrollable regions must be keyboard focusable (axe: scrollable-region-focusable).
      "jsx-a11y/no-noninteractive-tabindex": ["error", { roles: ["tabpanel", "region"] }],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
