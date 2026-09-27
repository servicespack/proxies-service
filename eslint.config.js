import antfu from '@antfu/eslint-config'

export default antfu(
  {
    ignores: [
      'dist',
      'coverage',
      '.stryker-tmp',
    ],
    rules: {
      'test/prefer-lowercase-title': 'off',
      'test/prefer-hooks-in-order': 'off',
      'node/prefer-global/process': 'off',
      'antfu/no-top-level-await': 'off',
      'jsdoc/require-returns-description': 'off',
    },
  },
  {
    files: ['**/*.spec.ts', 'test/**/*.spec.js', 'test/**/*.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
      },
    },
  },
)
