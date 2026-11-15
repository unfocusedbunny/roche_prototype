/* What the linter checks: the usual JavaScript mistakes, plus React's rules for hooks.
   Layout is Prettier's job (npm run format), so the last entry switches off any rule that would argue with it. */
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['dist', 'dist-single', 'node_modules'] },
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  {
    /* scripts/check.mjs runs in Node, and the functions it hands to the browser use the page's own names */
    files: ['scripts/**', '*.config.js', '**/*.test.js'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  prettier,
];
