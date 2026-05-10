// Multi-project Jest config:
//   unit      — pure-TS Node tests (ts-jest), the existing 150 tests live here.
//   component — jest-expo/jsdom for React Native + Expo component tests.
/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: "unit",
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
      testMatch: ["<rootDir>/lib/**/__tests__/**/*.test.ts", "<rootDir>/constants/**/__tests__/**/*.test.ts"],
      moduleFileExtensions: ["ts", "tsx", "js", "json"],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
      },
    },
    {
      displayName: "component",
      preset: "jest-expo/web",
      setupFilesAfterEnv: ["<rootDir>/test/setup-component.ts"],
      testMatch: [
        "<rootDir>/components/**/__tests__/**/*.test.tsx",
        "<rootDir>/components/**/__tests__/**/*.test.ts",
        "<rootDir>/app/**/__tests__/**/*.test.tsx",
        "<rootDir>/test/**/__tests__/**/*.test.tsx",
      ],
      transformIgnorePatterns: [
        "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-clone-referenced-element|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|pitchy|fft\\.js|@sentry/.*))",
      ],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
      },
    },
  ],
  // Coverage settings live on the global config (Jest collects across projects).
  collectCoverageFrom: [
    "lib/**/*.ts",
    "!lib/**/*.d.ts",
    "!lib/**/*.web.ts",
    "!lib/**/*.native.ts",
    "!lib/**/__tests__/**",
  ],
};
