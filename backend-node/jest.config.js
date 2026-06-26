module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/controllers/postController.js',
  ],
  coverageDirectory: 'coverage',
  clearMocks: true,
};
