module.exports = {
  extends: ['@ikscodes/eslint-config'],

  parserOptions: {
    project: ['./tsconfig.json']
  },

  rules: {
    // Core ESLint rules
    'no-alert': 0,
    'no-cond-assign': 0,

    // Import rules
    'import/extension': 0,
    'import/no-extraneous-dependencies': [1, { devDependencies: true }],
    'import/prefer-default-export': 0,

    // TypeScript rules
    '@typescript-eslint/await-thenable': 0,
  },

  settings: {
    'import/resolver': {
      typescript: {
        project: [ './tsconfig.json'],
      }
    }
  }
}
