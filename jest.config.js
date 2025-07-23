const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  
  // Performance optimizations
  maxWorkers: '50%', // Use 50% of CPU cores for parallel execution
  testTimeout: 10000, // 10 second timeout per test
  cache: true, // Enable Jest cache
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Retry flaky tests
  retryTimes: 2, // Retry failed tests up to 2 times
  
  // Suppress console output for cleaner test runs
  silent: false, // Set to true to suppress console.log/warn/error
  verbose: false, // Set to true for detailed test output
  
  // Faster test discovery
  testMatch: [
    '**/__tests__/**/*.{js,jsx,ts,tsx}',
    '**/?(*.)+(spec|test).{js,jsx,ts,tsx}'
  ],
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@supabase/.*)/)'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/__tests__/fixtures/',
    '<rootDir>/__tests__/utils/',
    '<rootDir>/__tests__/testing-patterns/'
  ],
  
  // Reduce setup overhead by only collecting coverage when needed
  collectCoverage: false, // Disable by default, enable with --coverage flag
  collectCoverageFrom: [
    'lib/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'providers/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  
  // Optimize test environment
  testEnvironmentOptions: {
    url: 'http://localhost'
  },
  
  // Clear mocks between tests for better performance
  clearMocks: true,
  restoreMocks: true,
}

module.exports = createJestConfig(customJestConfig) 