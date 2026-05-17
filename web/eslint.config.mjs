import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Stabilization pass: keep broad legacy cleanup visible without blocking builds.
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react/no-unescaped-entities": "warn",
      "prefer-const": "warn",
      /**
       * Inline `style={{ }}` is the root cause of the design-system drift
       * documented in the UI audit (1,980 inline-style sites). New code must
       * use the shadcn primitives + Tailwind tokens. Warning level keeps
       * legacy surfaces visible without blocking the build during the
       * incremental migration.
       */
      "react/forbid-dom-props": [
        "warn",
        {
          forbid: [
            {
              propName: "style",
              message:
                "Inline `style` is banned in new code. Use the shadcn primitives or Tailwind utilities. See the UI audit for the migration plan.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
