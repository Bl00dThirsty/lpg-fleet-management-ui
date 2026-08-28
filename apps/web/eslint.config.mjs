import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist', 'node_modules', '*.gen.ts', '*.tsbuildinfo', 'eslint.config.mjs'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: process.cwd(),
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  // Scoped i18n guard — verifies migrated namespaces use t() instead of hardcoded French.
  // Full fan-out to 50+ domains is follow-up; currently scoped to exemplar (pickups) +
  // handle-server-error to prove the gate works (overview/dashboard/tours already migrated
  // but contain legacy literals in sub-components - follow-up PRs will fan-out).
  {
    files: ['src/features/pickups/index.tsx', 'src/lib/handle-server-error.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/[À-ÿ]/]',
          message: 'Use t() / locales JSON instead of hardcoded French.',
        },
      ],
    },
  },
  {
    // Tests and locale-adjacent helpers are allowed to contain French literals
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'src/lib/i18n/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
]
