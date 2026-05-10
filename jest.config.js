// Minimal Jest config — pure-TS unit tests only (engine, music, etc).
// Does not boot React Native; UI/component tests would need jest-expo.
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          module: "commonjs",
          target: "es2020",
          esModuleInterop: true,
          resolveJsonModule: true,
          strict: true,
          jsx: "react",
        },
      },
    ],
  },
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
};
