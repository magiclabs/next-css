module.exports = {
  extends: ['@ikscodes/eslint-config'],

  parserOptions: {
    project: ['./tsconfig.json']
  },

  rules: {
    // Core ESLint rules
    'no-alert': 0,
    'no-cond-assign': 0,
    'no-param-reassign': 0,

    // Import rules
    'import/extensions': 0,
    'import/no-extraneous-dependencies': [1, { devDependencies: true }],
    'import/prefer-default-export': 0,

    // TypeScript rules
    '@typescript-eslint/await-thenable': 0,
    '@typescript-eslint/no-unsafe-call': 0,
    '@typescript-eslint/no-unsafe-return': 0,
    '@typescript-eslint/no-unsafe-assignment': 0,
    '@typescript-eslint/no-unsafe-member-access': 0,
    '@typescript-eslint/explicit-module-boundary-types': 0,
  },

  settings: {
    'import/resolver': {
      typescript: {
        project: [ './tsconfig.json'],
      }
    }
  }
}
