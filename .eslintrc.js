module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'space-before-function-paren': ['error', 'never'],
    'no-trailing-spaces': 'error',
    'eol-last': 'error'
  },
  ignorePatterns: [
    'node_modules/',
    'coverage/',
    '*.min.js',
    'public/',
    'dist/'
  ]
};
