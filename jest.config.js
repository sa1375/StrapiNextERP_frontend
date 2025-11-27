//frontend/jest.config.js

const nextJest = require("next/jest")

const createJestConfig = nextJest({
  dir: "./",
})

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/setupTests.ts"],
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: [
    "<rootDir>/__tests__/**/*.test.{ts,tsx,js,jsx}",
    "<rootDir>/__tests__/**/*.spec.{ts,tsx,js,jsx}",
  ],
}

module.exports = createJestConfig(customJestConfig)
