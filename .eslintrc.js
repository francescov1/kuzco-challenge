module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json'
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'airbnb-base',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier'
  ],
  ignorePatterns: ['drizzle/**', 'drizzle.config.ts', 'dist/**', 'node_modules/**'],
  rules: {
    curly: ['error', 'all'],
    eqeqeq: 'error',
    radix: 'off',
    'no-restricted-syntax': 'off',
    'no-console': 'off',
    'no-var': 'error',
    'comma-dangle': 'off',
    'import/extensions': 'off',
    'import/prefer-default-export': 'off',
    'no-promise-executor-return': 'off',
    'max-classes-per-file': 'off',
    'no-return-await': 'off',
    'no-await-in-loop': 'off',
    'no-underscore-dangle': 'off',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'no-restricted-properties': 'error',
    camelcase: ['error', { properties: 'never', ignoreDestructuring: true }],
    'brace-style': ['error', '1tbs', { allowSingleLine: false }],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-misused-promises': 'off',

    // handled by @typescript-eslint
    'no-unused-vars': 'off',

    // handled by prettier
    quotes: 'off',
    indent: 'off',
    'max-len': 'off',
    'object-curly-newline': 'off',
    'operator-linebreak': 'off',

    // handled by ts
    'no-undef': 'off',
    'no-use-before-define': 'off',
    'no-redeclare': 'off',
    'default-case': 'off'
  },
  env: {
    node: true
  }
};
