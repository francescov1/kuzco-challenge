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
    quotes: 'off',
    curly: ['error', 'all'],
    eqeqeq: 'error',
    radix: 'off',
    'no-restricted-syntax': 'off',
    'no-console': 'off',
    'no-var': 'error',
    'comma-dangle': 'off',
    'import/extensions': 'off',
    'import/prefer-default-export': 'off',

    // 'import/no-extraneous-dependencies': 'off',

    'no-promise-executor-return': 'off',
    'max-classes-per-file': 'off',
    'no-return-await': 'off',
    'no-await-in-loop': 'off',
    'no-underscore-dangle': 'off',

    // handled by @typescript-eslint
    'no-unused-vars': 'off',

    // handled by prettier
    'max-len': 'off',
    'object-curly-newline': 'off',
    indent: 'off',
    'operator-linebreak': 'off',

    // handled by ts
    'no-undef': 'off',
    'no-use-before-define': 'off',
    'no-redeclare': 'off',
    'default-case': 'off',

    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'no-restricted-properties': 'error',
    camelcase: ['error', { properties: 'never', ignoreDestructuring: true }],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    'brace-style': ['error', '1tbs', { allowSingleLine: false }]

    // TODO: remove these if we dont need
    // '@typescript-eslint/no-unsafe-member-access': 'off',
    // '@typescript-eslint/no-unsafe-assignment': 'off',
    // '@typescript-eslint/no-unsafe-argument': 'off',
    // '@typescript-eslint/no-extra-non-null-assertion': 'off',

    // There's no good reason to have these two off, but VSCode complains about it when newly installed NPM modules are used (until VSCode is restarted).
    // Eventually we should figure out why this is happening and fix the root issue.
    // TODO: remove these if we dont need
    // '@typescript-eslint/no-unsafe-call': 'off',
    // '@typescript-eslint/no-unsafe-return': 'off'
  },
  settings: {
    // Add any dependencies which are made available from installing a different dependency.
    // This silences unnecessary import/no-extraneous-dependencies errors.
    // Currently not needed since we use "import/no-extraneous-dependencies: off", but if we remove it then uncomment line below.
    // 'import/core-modules': ['@firebase/util', 'firebase-admin/lib/auth/token-verifier']
  },
  env: {
    node: true
  },

  // TODO :Remove if not needed
  overrides: [
    {
      files: ['**/*.{spec,test}.{js,ts}'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off'
      }
    }
  ]
};
