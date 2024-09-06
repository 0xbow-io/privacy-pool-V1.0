/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  forceExit: true,
  transform: {
    "^.+\\.test.(ts|js)$": [
      "ts-jest",
      {
        Bun: true,
        isolatedModules: true,
        useESM: true,
        types: ["bun-types", "node"]
      }
    ]
  }
}
