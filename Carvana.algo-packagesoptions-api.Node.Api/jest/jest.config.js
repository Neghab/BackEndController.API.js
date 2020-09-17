module.exports = {
  verbose: true,
  rootDir: '..',
  roots: ['<rootDir>/src', '<rootDir>/server'],
  testMatch: ['<rootDir>/@(src|server)/**/*.(spec|test).[jt]s?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: ['/node_modules/', '/public/', '/dist/', '/build/'],
  modulePaths: ['<rootDir>/src'],
  snapshotSerializers: [
    'enzyme-to-json/serializer'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/src/setupTests.js',
    '@testing-library/jest-dom/extend-expect'
  ],
  testEnvironment: 'jsdom',
  testURL: 'http://localhost',
  globals: require('dotenv').config({ path: '.env.test' }),
  transform: {
    '^.+\\.(js|jsx|ts|tsx|mjs)$': 'babel-jest',
    '^.+\\.(css|less)$': require.resolve('./cssTransform.js'),
    '^.+\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
    require.resolve('./fileTransform.js')
  },
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\](?!(@carvana[/\\\\])).+\\.(js|jsx|mjs)$',
    '^.+\\.module\\.(css|sass|scss)$'
  ],
  collectCoverage: false,
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{js,jsx,ts,tsx,mjs}',
    '!src/**/index.(j|t)sx?'
  ],
  coverageReporters: ['json', 'lcov', 'text']
};
