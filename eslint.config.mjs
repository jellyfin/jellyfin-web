// @ts-check

import eslint from '@eslint/js';
import comments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import compat from 'eslint-plugin-compat';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import restrictedGlobals from 'confusing-browser-globals';
import sonarjs from 'eslint-plugin-sonarjs';
import stylistic from '@stylistic/eslint-plugin';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommended,
    // @ts-expect-error Harmless type mismatch in dependency
    comments.recommended,
    compat.configs['flat/recommended'],
    importPlugin.flatConfigs.errors,
    sonarjs.configs.recommended,

    reactPlugin.configs.flat.recommended,
    {
        settings: {
            react: {
                version: 'detect'
            }
        }
    },
    jsxA11y.flatConfigs.recommended,

    {
        ignores: [
            'node_modules',
            'coverage',
            'dist',
            '.idea',
            '.vscode',
            '*.min.js',
            '*.d.ts',
            'src/**/pkg/**',
            'src/**/mcp-servers/**'
        ]
    },

    {
        plugins: {
            '@stylistic': stylistic
        },
        extends: [ importPlugin.flatConfigs.typescript ],
        rules: {
            'array-callback-return': ['error', { 'checkForEach': true }],
            'curly': ['error', 'multi-line', 'consistent'],
            'default-case-last': 'error',
            'max-params': ['error', 5],
            'new-cap': [
                'error',
                {
                    'capIsNewExceptions': ['jQuery.Deferred'],
                    'newIsCapExceptionPattern': '\\.default$'
                }
            ],
            // Use utils/logger instead of console directly for consistent logging
            'no-console': 'error',
            'no-duplicate-imports': 'error',
            'no-empty-function': 'error',
            'no-extend-native': 'error',
            'no-lonely-if': 'error',
            'no-nested-ternary': 'error',
            'no-redeclare': 'off',
            '@typescript-eslint/no-redeclare': ['error', { builtinGlobals: false }],
            'no-restricted-globals': ['error', ...restrictedGlobals],
            'no-return-assign': 'error',
            'no-return-await': 'error',
            'no-sequences': ['error', { 'allowInParentheses': false }],
            'no-shadow': 'off',
            '@typescript-eslint/no-shadow': 'error',
            'no-throw-literal': 'error',
            'no-undef-init': 'error',
            'no-unneeded-ternary': 'error',
            'no-unused-expressions': 'off',
            '@typescript-eslint/no-unused-expressions': ['error', {
                'allowShortCircuit': true,
                'allowTernary': true,
                'allowTaggedTemplates': true
            }],
            'no-unused-private-class-members': 'error',
            '@typescript-eslint/no-unused-vars': ['error', {
                'argsIgnorePattern': '^_',
                'varsIgnorePattern': '^_',
                'destructuredArrayIgnorePattern': '^_'
            }],
            'no-useless-rename': 'error',
            'no-useless-constructor': 'off',
            '@typescript-eslint/no-useless-constructor': 'error',
            'prefer-arrow-callback': ['error', { 'allowNamedFunctions': false }],
            'no-var': 'error',
            'no-void': ['error', { 'allowAsStatement': true }],
            'no-warning-comments': ['warn', { 'terms': ['hack', 'xxx', 'fixme'] }],
            'one-var': ['error', 'never'],
            'prefer-const': ['error', { 'destructuring': 'all' }],
            'prefer-promise-reject-errors': ['warn', { 'allowEmptyReject': true }],
            '@typescript-eslint/prefer-for-of': 'error',
            'radix': 'error',
            'yoda': 'error',

            'sonarjs/fixme-tag': 'warn',
            'sonarjs/todo-tag': 'off',
            'sonarjs/deprecation': 'off',
            'sonarjs/no-alphabetical-sort': 'warn',
            'sonarjs/no-inverted-boolean-check': 'error',
            'sonarjs/no-selector-parameter': 'off',
            'sonarjs/pseudo-random': 'warn',
            'sonarjs/no-duplicate-string': 'off',
            'sonarjs/no-nested-functions': ['error', { 'threshold': 4 }],

            '@stylistic/block-spacing': 'error',
            '@stylistic/brace-style': ['error', '1tbs', { 'allowSingleLine': true }],
            '@stylistic/comma-dangle': ['error', 'never'],
            '@stylistic/comma-spacing': 'error',
            '@stylistic/eol-last': 'error',
            '@stylistic/indent': ['error', 4, { 'SwitchCase': 1 }],
            '@stylistic/jsx-quotes': ['error', 'prefer-single'],
            '@stylistic/keyword-spacing': 'error',
            '@stylistic/max-statements-per-line': 'error',
            '@stylistic/no-floating-decimal': 'error',
            '@stylistic/no-mixed-spaces-and-tabs': 'error',
            '@stylistic/no-multi-spaces': ['error', { 'ignoreEOLComments': true }],
            '@stylistic/no-multiple-empty-lines': ['error', { 'max': 1 }],
            '@stylistic/no-trailing-spaces': 'error',
            '@stylistic/object-curly-spacing': ['error', 'always'],
            '@stylistic/operator-linebreak': ['error', 'before', {
                overrides: {
                    '?': 'after',
                    ':': 'after',
                    '=': 'after'
                }
            }],
            '@stylistic/padded-blocks': ['error', 'never'],
            '@stylistic/quotes': ['error', 'single', {
                'avoidEscape': true,
                'allowTemplateLiterals': false
            }],
            '@stylistic/semi': 'error',
            '@stylistic/space-before-blocks': 'error',
            '@stylistic/space-infix-ops': 'error',
            '@stylistic/type-generic-spacing': 'error',

            '@typescript-eslint/no-restricted-imports': [
                'error',
                {
                    paths: [
                        {
                            name: '@jellyfin/sdk/lib/generated-client',
                            message: 'Use direct file imports for tree-shaking',
                            allowTypeImports: true
                        },
                        {
                            name: '@jellyfin/sdk/lib/generated-client/api',
                            message: 'Use direct file imports for tree-shaking',
                            allowTypeImports: true
                        },
                        {
                            name: '@jellyfin/sdk/lib/generated-client/models',
                            message: 'Use direct file imports for tree-shaking',
                            allowTypeImports: true
                        },
                        {
                            name: '@mui/icons-material',
                            message: 'Use direct file imports for tree-shaking',
                            allowTypeImports: true
                        },
                        {
                            name: '@mui/material',
                            message: 'Use direct file imports for tree-shaking',
                            allowTypeImports: true
                        },
                        {
                            name: '@mui/material',
                            importNames: ['Grid'],
                            message: 'Grid is deprecated. Use Grid2 instead'
                        }
                    ]
                }
            ]
        }
    },

    {
        ignores: [ 'src' ],
        languageOptions: {
            globals: {
                ...globals.node
            }
        }
    },

    {
        files: [ '**/*.{cjs,js}' ],
        ignores: [ 'src' ],
        languageOptions: {
            sourceType: 'commonjs'
        },
        rules: {
            '@typescript-eslint/no-require-imports': 'off'
        }
    },

    {
        files: [ 'scripts/**/*.{js,cjs}' ],
        rules: {
            '@stylistic/indent': 'off',
            'sonarjs/cognitive-complexity': 'off',
            'compat/compat': 'off',
            '@typescript-eslint/no-shadow': 'off',
            '@typescript-eslint/no-unused-vars': 'off'
        }
    },

    {
        files: [ 'src/**/*.{js,jsx,ts,tsx}' ],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname
            },
            globals: {
                ...globals.browser,
                'tizen': false,
                'webapis': false,
                'webOS': false,
                '$': false,
                'jQuery': false,
                'ApiClient': true,
                'Events': true,
                'chrome': true,
                'Emby': false,
                'Hls': true,
                'LibraryMenu': true,
                'Windows': false,
                '__COMMIT_SHA__': false,
                '__JF_BUILD_VERSION__': false,
                '__PACKAGE_JSON_NAME__': false,
                '__PACKAGE_JSON_VERSION__': false,
                '__USE_SYSTEM_FONTS__': false,
                '__WEBPACK_SERVE__': false
            }
        },
        settings: {
            'import/resolver': {
                node: {
                    extensions: ['.js', '.ts', '.jsx', '.tsx'],
                    moduleDirectory: ['node_modules', 'src']
                }
            },
            polyfills: [
                'Promise', 'fetch', 'document.registerElement',
                'ResizeObserver', 'TextEncoder', 'IntersectionObserver',
                'Object.assign', 'Object.is', 'Object.setPrototypeOf',
                'Object.toString', 'Object.freeze', 'Object.seal',
                'Object.preventExtensions', 'Object.isFrozen', 'Object.isSealed',
                'Object.isExtensible', 'Object.getOwnPropertyDescriptor',
                'Object.getPrototypeOf', 'Object.keys', 'Object.entries',
                'Object.getOwnPropertyNames', 'Function.name',
                'Function.hasInstance', 'Array.from', 'Array.arrayOf',
                'Array.copyWithin', 'Array.fill', 'Array.find',
                'Array.findIndex', 'Array.iterator', 'String.fromCodePoint',
                'String.raw', 'String.iterator', 'String.codePointAt',
                'String.endsWith', 'String.includes', 'String.repeat',
                'String.startsWith', 'String.trim', 'String.anchor',
                'String.big', 'String.blink', 'String.bold',
                'String.fixed', 'String.fontcolor', 'String.fontsize',
                'String.italics', 'String.link', 'String.small',
                'String.strike', 'String.sub', 'String.sup',
                'RegExp', 'Number', 'Math', 'Date', 'async',
                'Symbol', 'Map', 'Set', 'WeakMap', 'WeakSet',
                'ArrayBuffer', 'DataView', 'Int8Array', 'Uint8Array',
                'Uint8ClampedArray', 'Int16Array', 'Uint16Array',
                'Int32Array', 'Uint32Array', 'Float32Array',
                'Float64Array', 'Reflect'
            ]
        },
        rules: {
            '@typescript-eslint/naming-convention': [
                'error',
                {
                    selector: 'default',
                    format: [ 'camelCase', 'PascalCase' ],
                    leadingUnderscore: 'allow'
                },
                {
                    selector: 'variable',
                    format: [ 'camelCase', 'PascalCase', 'UPPER_CASE' ],
                    leadingUnderscore: 'allowSingleOrDouble',
                    trailingUnderscore: 'allowSingleOrDouble'
                },
                {
                    selector: 'typeLike',
                    format: [ 'PascalCase' ]
                },
                {
                    selector: 'enumMember',
                    format: [ 'PascalCase', 'UPPER_CASE' ]
                },
                {
                    selector: [ 'objectLiteralProperty', 'typeProperty' ],
                    format: [ 'camelCase', 'PascalCase' ],
                    leadingUnderscore: 'allowSingleOrDouble',
                    trailingUnderscore: 'allowSingleOrDouble'
                },
                {
                    selector: [ 'objectLiteralProperty', 'typeProperty' ],
                    format: null,
                    filter: {
                        regex: '[ &\\-]|^([0-9]+)$',
                        match: true
                    }
                }
            ],
            '@typescript-eslint/no-deprecated': 'warn',
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/prefer-string-starts-ends-with': 'error',
            // Strict boolean expressions with practical defaults for AI development
            '@typescript-eslint/strict-boolean-expressions': [
                'error',
                {
                    allowAny: false,
                    allowNumber: false,
                    allowString: false,
                    allowNullableBoolean: true,  // Allow ?. chaining patterns
                    allowNullableNumber: false,
                    allowNullableString: false,
                    allowNullableObject: true    // Allow object truthiness checks
                }
            ],
            '@typescript-eslint/consistent-type-imports': ['error', {
                'prefer': 'type-imports',
                'fixStyle': 'inline-type-imports'
            }],
            '@typescript-eslint/consistent-type-exports': 'error',
            '@typescript-eslint/no-inferrable-types': 'error',
            '@typescript-eslint/non-nullable-type-assertion-style': 'error',
            '@typescript-eslint/prefer-optional-chain': 'error'
        }
    },

    {
        files: [ 'src/**/*.{jsx,tsx}' ],
        plugins: {
            'react-hooks': reactHooks
        },
        rules: {
            'react/jsx-filename-extension': ['error', { 'extensions': ['.jsx', '.tsx'] }],
            'react/jsx-no-bind': 'error',
            'react/jsx-no-useless-fragment': 'error',
            'react/no-array-index-key': 'error',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'error',
            'react/jsx-uses-react': 'off',
            'react/react-in-jsx-scope': 'off'
        }
    },

    {
        files: [ 'src/serviceworker.js' ],
        languageOptions: {
            globals: {
                ...globals.serviceworker
            }
        }
    },

    // Legacy JS files - relaxed rules during migration
    // These files are pending TypeScript conversion
    {
        files: [ 'src/**/*.{js,jsx}' ],
        rules: {
            '@typescript-eslint/no-floating-promises': 'off',
            '@typescript-eslint/no-this-alias': 'off',
            'sonarjs/public-static-readonly': 'off',
            'sonarjs/cognitive-complexity': 'off',
            'sonarjs/constructor-for-side-effects': 'off',
            'sonarjs/function-return-type': 'off',
            'sonarjs/no-async-constructor': 'off',
            'sonarjs/no-duplicate-string': 'off',
            'sonarjs/no-ignored-exceptions': 'off',
            'sonarjs/no-invariant-returns': 'warn',
            'sonarjs/no-nested-functions': 'off',
            'sonarjs/void-use': 'off'
        }
    },

    // TypeScript files - strict rules for AI-assisted development
    // Strict rules help AI generate consistent, type-safe code
    {
        files: [ 'src/**/*.{ts,tsx}' ],
        rules: {
            // Require explicit return types for better AI code generation
            '@typescript-eslint/explicit-function-return-type': ['warn', {
                allowExpressions: true,
                allowTypedFunctionExpressions: true,
                allowHigherOrderFunctions: true
            }],
            // Require explicit member accessibility for clarity
            '@typescript-eslint/explicit-member-accessibility': ['error', {
                accessibility: 'explicit',
                overrides: { constructors: 'no-public' }
            }],
            // Prevent any type - encourages proper typing
            '@typescript-eslint/no-explicit-any': 'error',
            // Require proper null handling
            '@typescript-eslint/no-non-null-assertion': 'warn',
            // Encourage immutability patterns
            '@typescript-eslint/prefer-readonly': 'warn',
            // Use nullish coalescing for cleaner code
            '@typescript-eslint/prefer-nullish-coalescing': 'warn',
            // Require enum members to have initial values
            '@typescript-eslint/prefer-enum-initializers': 'warn',
            // Consistent type definitions
            '@typescript-eslint/consistent-type-definitions': ['error', 'interface']
        }
    }
);
