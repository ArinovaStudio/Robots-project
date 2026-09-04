import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/__tests__"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "text-summary", "lcov", "json-summary"],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/__tests__/",
    "/\\.next/",
  ],
  transformIgnorePatterns: [
    "/node_modules/(?!(bad-words|badwords-list)/)",
  ],
  setupFilesAfterSetup: [],
  verbose: true,
};

export default config;
