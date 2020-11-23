module.exports = {
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "js", "json", "node"],
  collectCoverage: true,
  coveragePathIgnorePatterns: ["(tests/.*.mock).(ts)$"],
  verbose: true,
  setupFilesAfterEnv: ["./jest.setup.js"],
};
