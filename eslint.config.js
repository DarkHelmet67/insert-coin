// @ts-check
import js from '@eslint/js';
import functional from 'eslint-plugin-functional';
import jsdoc from 'eslint-plugin-jsdoc';
import tseslint from 'typescript-eslint';

// Rules follow the "code for humans" guidelines in CLAUDE.md.
const SOURCE = ['packages/*/src/**/*.ts', 'games/*/src/**/*.ts'];
const TESTS = ['**/*.test.ts', '**/test-*.ts'];

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '_site/**'] },
  js.configs.recommended,
  ...tseslint.configs.strict,

  // ES6 style: arrow functions only, as short as possible.
  {
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'FunctionDeclaration, FunctionExpression',
          message: 'Use an arrow function: const name = (...) => ...',
        },
      ],
      'prefer-arrow-callback': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // Functional and immutable code, with every function documented.
  {
    files: SOURCE,
    languageOptions: { parserOptions: { projectService: true } },
    plugins: { functional, jsdoc },
    rules: {
      'functional/no-classes': 'error',
      'functional/no-this-expressions': 'error',
      // `let` only inside functions, e.g. the private state of the game loop closure.
      'functional/no-let': ['error', { allowInFunctions: true }],
      // The canvas context is the screen: drawing on it (and sizing its canvas) is the one
      // allowed mutation.
      'functional/immutable-data': ['error', { ignoreAccessorPattern: ['ctx.*', 'ctx.canvas.*'] }],
      'functional/prefer-property-signatures': 'error',
      'functional/readonly-type': ['error', 'keyword'],
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: false,
          require: { ArrowFunctionExpression: false, FunctionDeclaration: true },
          contexts: [
            'VariableDeclaration > VariableDeclarator > ArrowFunctionExpression',
            'TSInterfaceDeclaration',
            'TSTypeAliasDeclaration',
          ],
        },
      ],
      'jsdoc/no-types': 'error',
      'jsdoc/check-tag-names': 'error',
      'jsdoc/check-param-names': 'error',
    },
  },

  // Web Audio nodes are configured by assignment (`oscillator.type = ...`), like the canvas context.
  {
    files: ['packages/audio/src/synth.ts'],
    rules: { 'functional/immutable-data': 'off' },
  },

  // Tests may use mocks and mutable fixtures.
  {
    files: TESTS,
    rules: {
      'functional/immutable-data': 'off',
      'functional/no-let': 'off',
    },
  },
);
