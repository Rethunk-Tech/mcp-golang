import eslint from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// Define which files are TypeScript files
const tsFiles = ['src/**/*.ts']

export default [
  // Base configuration for all files
  {
    ignores: ['node_modules/**', 'build/**', '.yarn/**']
  },
  eslint.configs.recommended,

  // TypeScript specific configuration
  ...tseslint.configs.recommended,

  // Custom configuration for TypeScript files
  {
    files: tsFiles,
    languageOptions: {
      globals: {
        ...globals.node
      },
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    rules: {
      // Core ESLint rules
      'indent': ['error', 2],
      'linebreak-style': ['error', 'unix'],
      'quotes': ['error', 'single'],
      'semi': ['error', 'never'],

      // TypeScript specific rules
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-explicit-any': 'error'
    }
  }
]
