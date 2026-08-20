import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // First define global ignores - this should be first
  {
    ignores: [
      ".next/**",
      ".next/**/*.js",
      ".next/**/*.jsx",
      ".next/**/*.ts",
      ".next/**/*.tsx",
      ".open-next/**",
      "out/**",
      "build/**",
      "dist/**",
      "coverage/**",
      "node_modules/**",
      "**/*.js.map",
      "**/*.d.ts.map",
      "*.tsbuildinfo",
      "**/*.backup",
      "**/*.bak",
      "next-env.d.ts",
      "src/components/__tests__/PayDues.test.tsx",
      "src/components/shared/__tests__/FeatureComparisonMatrix.test.tsx",
      "src/components/shared/__tests__/Footer.test.tsx",
      "src/components/shared/__tests__/HeroSection.test.tsx",
      "src/components/shared/__tests__/PricingSection.test.tsx"
    ]
  },
  // Then extend configurations
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "react/no-unescaped-entities": ["error", {
        "forbid": [">", "}"]
      }],
      "@typescript-eslint/no-unused-vars": ["error", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }],
      "@typescript-eslint/no-explicit-any": "warn"
    }
  },
  // Mock files configuration
  {
    files: [
      "**/__mocks__/**/*.tsx",
      "**/__mocks__/**/*.ts", 
      "**/__mocks__/**/*.js",
      "**/mocks/**/*.tsx",
      "**/mocks/**/*.ts",
      "**/mocks/**/*.js"
    ],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "react/display-name": "off",
      "import/no-anonymous-default-export": "off",
      "react-hooks/exhaustive-deps": "off"
    }
  },
  {
    files: [
      "*.js", 
      "jest.config.js", 
      "scripts/*.js", 
      "server.js", 
      "simple-server.js", 
      "**/__tests__/**/*.tsx", 
      "**/__tests__/**/*.ts",
      "**/__tests__/**/*.js",
      "**/tests/**/*.tsx",
      "**/tests/**/*.ts", 
      "**/tests/**/*.js",
      "**/*.test.tsx",
      "**/*.test.ts",
      "**/*.test.js",
      "**/*.spec.tsx",
      "**/*.spec.ts", 
      "**/*.spec.js",
      "src/components/**/__tests__/**/*",
      "src/components/**/*.test.*",
      "jest.setup.js",
      "jest.env.setup.js",
      "setupTests.ts",
      "**/setupTests.ts"
    ],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-types": "off",
      "react/display-name": "off",
      "no-var": "off"
    }
  }
];

export default eslintConfig;
