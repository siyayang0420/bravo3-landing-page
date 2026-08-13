import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist', 'node_modules'] },
  {
    /* Build config and the content scripts run in Node, not the browser —
       without this, Node globals and `import.meta` read as undefined. */
    files: ['*.config.js', 'scripts/**/*.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: { ...globals.browser, ...globals.es2021 },
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      /* Fires on the "reset my animation state when the driving prop flips"
         pattern in BravoCoin and PhoneAiScreen. Both work correctly; the clean
         rewrite (derive during render, or key the component) is a behavioural
         change to tuned animation code. Kept visible as a warning so it gets
         fixed the next time those files are touched, rather than failing the
         build or being hidden behind a blanket disable. */
      'react-hooks/set-state-in-effect': 'warn',
      /* Unused vars are the main signal here — dead imports and stranded state
         are exactly what accumulates when a page is built in a hurry. The
         underscore escape hatch keeps intentionally-ignored args quiet. */
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
    },
  },
  {
    /* Last so it wins over js.configs.recommended above — flat config resolves
       rules in array order.
       The content scripts deliberately replace a library's error with an
       authoring one ("frontmatter is not valid YAML — …") that names the file to
       fix. Attaching the original as `cause` would print a js-yaml stack under a
       message aimed at someone editing Markdown. */
    files: ['scripts/**/*.js'],
    rules: { 'preserve-caught-error': 'off' },
  },
];
