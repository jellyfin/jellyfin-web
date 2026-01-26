// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
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
import storybook from 'eslint-plugin-storybook';

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommended,
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
            'dist.bak',
            'storybook-static',
            'test-results',
            '.idea',
            '.vscode',
            '*.min.js',
            '*.d.ts',
            'src/**/pkg/**',

            'src/**/target/**',
            'rust-audio/target/**',
            '**/*.backup.*',
            '**/*.orig.*',
            '**/*.rej/**',
            '**/.gitkeep'
        ]
    },
    {
        plugins: {
            '@stylistic': stylistic
        },
        extends: [importPlugin.flatConfigs.typescript],
        rules: {
            'array-callback-return': ['error', { checkForEach: true }],
            curly: ['error', 'multi-line', 'consistent'],
            'default-case-last': 'error',
            'max-params': ['error', 5],
            'new-cap': [
                'error',
                {
                    capIsNewExceptions: ['jQuery.Deferred'],
                    newIsCapExceptionPattern: '.default$'
                }
            ],
            // Use utils/logger instead of console directly for consistent logging
            'no-console': 'error',
            'no-duplicate-imports': 'error',
            'react/function-component-definition': [
                'error',
                { namedComponents: 'arrow-function', unnamedComponents: 'arrow-function' }
            ],
            'no-restricted-syntax': [
                'error',
                {
                    selector: 'ClassDeclaration[superClass.name=/(Component|PureComponent)$/]',
                    message: 'No class components. Use functional components with hooks only.'
                }
            ],
            'import/order': [
                'error',
                {
                    groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
                    pathGroups: [
                        { pattern: 'components/**', group: 'internal' },
                        { pattern: 'apps/**', group: 'internal' },
                        { pattern: 'store/**', group: 'internal' },
                        { pattern: 'hooks/**', group: 'internal' },
                        { pattern: 'lib/**', group: 'internal' },
                        { pattern: 'utils/**', group: 'internal' },
                        { pattern: 'styles/**', group: 'internal' }
                    ],
                    pathGroupsExcludedImportTypes: ['builtin'],
                    'newlines-between': 'always',
                    alphabetize: { order: 'asc', caseInsensitive: true }
                }
            ],
            'no-empty-function': 'error',
            'no-extend-native': 'error',
            'no-lonely-if': 'error',
            'no-nested-ternary': 'error',
            'no-redeclare': 'off',
            '@typescript-eslint/no-redeclare': ['error', { builtinGlobals: false }],
            'no-restricted-globals': ['error', ...restrictedGlobals],
            'no-return-assign': 'error',
            'no-return-await': 'error',
            'no-sequences': ['error', { allowInParentheses: false }],
            'no-shadow': 'off',
            '@typescript-eslint/no-shadow': 'error',
            'no-throw-literal': 'error',
            'no-undef-init': 'error',
            'no-unneeded-ternary': 'error',
            'no-unused-expressions': 'off',
            '@typescript-eslint/no-unused-expressions': [
                'error',
                {
                    allowShortCircuit: true,
                    allowTernary: true,
                    allowTaggedTemplates: true
                }
            ],
            'no-unused-private-class-members': 'error',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    destructuredArrayIgnorePattern: '^_'
                }
            ],

            'no-useless-rename': 'error',
            'no-useless-constructor': 'off',
            '@typescript-eslint/no-useless-constructor': 'error',
            'prefer-arrow-callback': ['error', { allowNamedFunctions: false }],
            'no-var': 'error',
            'no-void': ['error', { allowAsStatement: true }],
            'no-warning-comments': ['warn', { terms: ['hack', 'xxx', 'fixme'] }],
            'one-var': ['error', 'never'],
            'prefer-const': ['error', { destructuring: 'all' }],
            'prefer-promise-reject-errors': ['warn', { allowEmptyReject: true }],
            '@typescript-eslint/prefer-for-of': 'error',
            radix: 'error',
            yoda: 'error',

            'sonarjs/fixme-tag': 'warn',
            'sonarjs/todo-tag': 'off',
            'sonarjs/deprecation': 'off',
            'sonarjs/no-alphabetical-sort': 'warn',
            'sonarjs/no-inverted-boolean-check': 'error',
            'sonarjs/no-selector-parameter': 'off',
            'sonarjs/pseudo-random': 'warn',
            'sonarjs/no-duplicate-string': 'off',
            'sonarjs/no-nested-functions': ['error', { threshold: 4 }],

            '@stylistic/block-spacing': 'error',
            '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
            '@stylistic/comma-dangle': ['error', 'never'],
            '@stylistic/comma-spacing': 'error',
            '@stylistic/eol-last': 'error',
            '@stylistic/indent': ['error', 4, { SwitchCase: 1 }],
            '@stylistic/jsx-quotes': ['error', 'prefer-single'],
            '@stylistic/keyword-spacing': 'error',
            '@stylistic/max-statements-per-line': 'error',
            '@stylistic/no-floating-decimal': 'error',
            '@stylistic/no-mixed-spaces-and-tabs': 'error',
            '@stylistic/no-multi-spaces': ['error', { ignoreEOLComments: true }],
            '@stylistic/no-multiple-empty-lines': ['error', { max: 1 }],
            '@stylistic/no-trailing-spaces': 'error',
            '@stylistic/object-curly-spacing': ['error', 'always'],
            '@stylistic/operator-linebreak': [
                'error',
                'before',
                {
                    overrides: {
                        '?': 'after',
                        ':': 'after',
                        '=': 'after'
                    }
                }
            ],
            '@stylistic/padded-blocks': ['error', 'never'],
            '@stylistic/quotes': [
                'error',
                'single',
                {
                    avoidEscape: true,
                    allowTemplateLiterals: 'never'
                }
            ],
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
                        },
                        {
                            name: 'components',
                            message:
                                'Barrel exports hurt tree-shaking. Import from specific component path: components/dialogs, components/playback, etc.'
                        },
                        {
                            name: 'components/dialogs',
                            message: 'Use named imports only. Do not use wildcard imports.'
                        },
                        {
                            name: 'components/feedback',
                            message: 'Use named imports only. Do not use wildcard imports.'
                        },
                        {
                            name: 'components/forms',
                            message: 'Use named imports only. Do not use wildcard imports.'
                        },
                        {
                            name: 'components/media',
                            message: 'Use named imports only. Do not use wildcard imports.'
                        },
                        {
                            name: 'components/playback',
                            message: 'Use named imports only. Do not use wildcard imports.'
                        },
                        {
                            name: 'components/queue',
                            message: 'Use named imports only. Do not use wildcard imports.'
                        },
                        {
                            name: 'components/remote',
                            message: 'Use named imports only. Do not use wildcard imports.'
                        },
                        {
                            name: 'components/settings',
                            message: 'Use named imports only. Do not use wildcard imports.'
                        },
                        {
                            name: 'components/userdata',
                            message: 'Use named imports only. Do not use wildcard imports.'
                        },
                        {
                            name: 'apps',
                            message: 'Barrel exports hurt tree-shaking. Import directly from concrete file paths.'
                        },
                        {
                            name: 'store',
                            message: 'Barrel exports hurt tree-shaking. Import directly from concrete file paths.'
                        },
                        {
                            name: 'hooks',
                            message: 'Barrel exports hurt tree-shaking. Import directly from concrete file paths.'
                        },
                        {
                            name: 'lib',
                            message: 'Barrel exports hurt tree-shaking. Import directly from concrete file paths.'
                        },
                        {
                            name: 'utils',
                            message: 'Barrel exports hurt tree-shaking. Import directly from concrete file paths.'
                        },
                        {
                            name: 'styles',
                            message: 'Barrel exports hurt tree-shaking. Import directly from concrete file paths.'
                        }
                    ]
                }
            ]
        }
    },
    {
        ignores: ['src'],
        languageOptions: {
            globals: {
                ...globals.node
            }
        }
    },
    {
        files: ['eslint.config.mjs'],
        rules: {
            'import/no-unresolved': 'off'
        }
    },
    {
        files: ['vite.config.ts'],
        rules: {
            'import/no-unresolved': 'off'
        }
    },
    {
        files: ['src/**/*.stories.tsx'],
        rules: {
            'import/no-unresolved': 'off'
        }
    },
    {
        files: ['**/*.{cjs,js}'],
        ignores: ['src'],
        languageOptions: {
            sourceType: 'commonjs'
        },
        rules: {
            '@typescript-eslint/no-require-imports': 'off'
        }
    },
    {
        files: ['scripts/**/*.{js,cjs,mjs,ts}'],
        rules: {
            '@stylistic/indent': 'off',
            'sonarjs/cognitive-complexity': 'off',
            'compat/compat': 'off',
            '@typescript-eslint/no-shadow': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            'no-console': 'off'
        }
    },
    {
        files: ['src/**/*.{js,jsx,ts,tsx}'],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname
            },
            globals: {
                ...globals.browser,
                tizen: false,
                webapis: false,
                webOS: false,
                $: false,
                jQuery: false,
                ApiClient: true,
                Events: true,
                chrome: true,
                Emby: false,
                Hls: true,
                LibraryMenu: true,
                Windows: false,
                __COMMIT_SHA__: false,
                __JF_BUILD_VERSION__: false,
                __PACKAGE_JSON_NAME__: false,
                __PACKAGE_JSON_VERSION__: false,
                __USE_SYSTEM_FONTS__: false,
                __WEBPACK_SERVE__: false
            }
        },
        settings: {
            'import/resolver': {
                node: {
                    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css.ts'],
                    moduleDirectory: ['node_modules', 'src']
                }
            },
            polyfills: [
                'Promise',
                'fetch',
                'document.registerElement',
                'ResizeObserver',
                'TextEncoder',
                'IntersectionObserver',
                'Object.assign',
                'Object.is',
                'Object.setPrototypeOf',
                'Object.toString',
                'Object.freeze',
                'Object.seal',
                'Object.preventExtensions',
                'Object.isFrozen',
                'Object.isSealed',
                'Object.isExtensible',
                'Object.getOwnPropertyDescriptor',
                'Object.getPrototypeOf',
                'Object.keys',
                'Object.entries',
                'Object.getOwnPropertyNames',
                'Function.name',
                'Function.hasInstance',
                'Array.from',
                'Array.arrayOf',
                'Array.copyWithin',
                'Array.fill',
                'Array.find',
                'Array.findIndex',
                'Array.iterator',
                'String.fromCodePoint',
                'String.raw',
                'String.iterator',
                'String.codePointAt',
                'String.endsWith',
                'String.includes',
                'String.repeat',
                'String.startsWith',
                'String.trim',
                'String.anchor',
                'String.big',
                'String.blink',
                'String.bold',
                'String.fixed',
                'String.fontcolor',
                'String.fontsize',
                'String.italics',
                'String.link',
                'String.small',
                'String.strike',
                'String.sub',
                'String.sup',
                'RegExp',
                'Number',
                'Math',
                'Date',
                'async',
                'Symbol',
                'Map',
                'Set',
                'WeakMap',
                'WeakSet',
                'ArrayBuffer',
                'DataView',
                'Int8Array',
                'Uint8Array',
                'Uint8ClampedArray',
                'Int16Array',
                'Uint16Array',
                'Int32Array',
                'Uint32Array',
                'Float32Array',
                'Float64Array',
                'Reflect'
            ]
        },
        rules: {
            '@typescript-eslint/naming-convention': [
                'error',
                {
                    selector: 'default',
                    format: ['camelCase', 'PascalCase'],
                    leadingUnderscore: 'allow'
                },
                {
                    selector: 'variable',
                    format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
                    leadingUnderscore: 'allowSingleOrDouble',
                    trailingUnderscore: 'allowSingleOrDouble'
                },
                {
                    selector: 'typeLike',
                    format: ['PascalCase']
                },
                {
                    selector: 'enumMember',
                    format: ['PascalCase', 'UPPER_CASE']
                },
                {
                    selector: ['objectLiteralProperty', 'typeProperty'],
                    format: ['camelCase', 'PascalCase'],
                    leadingUnderscore: 'allowSingleOrDouble',
                    trailingUnderscore: 'allowSingleOrDouble'
                },
                {
                    selector: ['objectLiteralProperty', 'typeProperty'],
                    format: null,
                    filter: {
                        regex: '^[:@& ].*|[ &-]|^([0-9]+)%?$',
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
                    allowNullableBoolean: true, // Allow ?. chaining patterns
                    allowNullableNumber: false,
                    allowNullableString: false,
                    allowNullableObject: true // Allow object truthiness checks
                }
            ],
            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    prefer: 'type-imports',
                    fixStyle: 'inline-type-imports'
                }
            ],
            '@typescript-eslint/consistent-type-exports': 'error',
            '@typescript-eslint/no-inferrable-types': 'error',
            '@typescript-eslint/non-nullable-type-assertion-style': 'error',
            '@typescript-eslint/prefer-optional-chain': 'error'
        }
    },
    {
        files: ['src/**/*.{jsx,tsx}'],
        plugins: {
            'react-hooks': reactHooks
        },
        rules: {
            'react/jsx-filename-extension': ['error', { extensions: ['.jsx', '.tsx'] }],
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
        files: ['src/serviceworker.js'],
        languageOptions: {
            globals: {
                ...globals.serviceworker
            }
        }
    },
    // Legacy JS files - relaxed rules during migration
    // These files are pending TypeScript conversion
    {
        files: ['src/**/*.{js,jsx}'],
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
        files: ['src/**/*.{ts,tsx}'],
        rules: {
            // Require explicit return types for better AI code generation
            '@typescript-eslint/explicit-function-return-type': [
                'warn',
                {
                    allowExpressions: true,
                    allowTypedFunctionExpressions: true,
                    allowHigherOrderFunctions: true
                }
            ],
            // Require explicit member accessibility for clarity
            '@typescript-eslint/explicit-member-accessibility': [
                'error',
                {
                    accessibility: 'explicit',
                    overrides: { constructors: 'no-public' }
                }
            ],
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
    },
    // Test files - relaxed rules for common test patterns
    {
        files: ['src/**/*.{test,spec}.{ts,tsx}'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-member-accessibility': 'off',
            '@typescript-eslint/no-floating-promises': 'off',
            '@typescript-eslint/strict-boolean-expressions': 'off',
            '@typescript-eslint/no-unused-vars': 'warn',
            'no-empty-function': 'off'
        }
    },
    // Tree-shaking enforcement - Prevent wildcard imports that defeat dead code elimination
    {
        files: ['src/**/*.{ts,tsx}'],
        rules: {
            // Wildcard imports prevent tree-shaking. Force explicit named imports.
            'no-restricted-syntax': [
                'error',
                {
                    selector:
                        'ImportNamespaceSpecifier[parent.source.value=/^(components|apps|store|hooks|lib|utils|styles)/]',
                    message:
                        'Wildcard imports from internal modules hurt tree-shaking. Use explicit named imports instead: import { ComponentName } from "components/dialogs"'
                },
                {
                    selector: 'ImportNamespaceSpecifier[parent.source.value=/^./.*/(index|)$/]',
                    message:
                        'Wildcard imports from barrel exports hurt tree-shaking. Use explicit named imports instead.'
                }
            ]
        }
    },
    // React patterns - No legacy patterns
    {
        files: ['src/**/*.{tsx,jsx}'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    paths: [
                        {
                            name: '@vanilla-extract/css',
                            message: 'Move styles to a .css.ts file and import them from there.'
                        }
                    ]
                }
            ],
            // Prevent namespace imports from vanilla-extract CSS files in TSX
            'import/no-namespace': [
                'error',
                {
                    ignoreExternal: true,
                    allowComputedKeys: true
                }
            ],
            // Prefer arrow functions for components
            'react/function-component-definition': [
                'error',
                { namedComponents: 'function-declaration', unnamedComponents: 'arrow-function' }
            ],
            // Require hooks dependencies
            'react-hooks/exhaustive-deps': 'error',
            // Prefer Text/Heading over raw HTML typography
            'react/no-danger': 'error',
            'react/no-danger-with-children': 'error',
            // Enforce named imports for CSS files to prevent namespace usage
            'no-restricted-syntax': [
                'error',
                {
                    selector: 'ImportDeclaration[source.value=/.css$/] > ImportNamespaceSpecifier',
                    message: 'Use named imports from CSS files instead of namespace imports (import * as styles).'
                },
                {
                    selector: 'Literal[value=/transition.*[2345]s/]',
                    message: 'Avoid long CSS transitions. Use Motion animations instead for better performance.'
                },
                {
                    selector: 'Literal[value=/<[a-z]+[^>]*>[^<]*</[a-z]+>/]',
                    message: 'Avoid HTML template strings. Use React TSX components instead.'
                }
            ]
        }
    },
    {
        files: ['src/**/*.{ts,tsx}'],
        rules: {
            // State, Forms, Queries, API patterns
            'no-restricted-syntax': [
                'error',
                {
                    selector: 'CallExpression[callee.name=/^useStore$/]',
                    message: 'Use typed selectors from store hooks (e.g., useAudioStore.getState) or custom hooks'
                },
                {
                    selector: 'CallExpression[callee.name=/^useForm$/]',
                    message: 'Use @tanstack/react-form with Zod schema for form validation'
                },
                {
                    selector: 'CallExpression[callee.name=/validate|validateSync/]',
                    message: 'Use Zod schema validation instead of manual validation'
                },
                {
                    selector: 'CallExpression[callee.object.name="useQuery"][arguments.length>0]',
                    message: 'useQuery should have an `enabled` flag when used in components that might run on server'
                },
                {
                    selector: 'CallExpression[callee.object.name="useQuery"]',
                    message: 'useQuery requires a queryKey array as first argument'
                },
                {
                    selector: 'CallExpression[callee.property.name=/^get.*Api$/]',
                    message: 'Use typed API helpers from @jellyfin/sdk/lib/utils/api/'
                }
            ],

            // Modularization, Tree Shaking, Lazy Loading patterns
            'no-restricted-exports': [
                'error',
                {
                    restrictedNamedExports: ['default'],
                    message: 'Default exports prevent tree-shaking and complicate refactoring. Use named exports only.'
                }
            ],
            'prefer-const': 'error',
            'no-param-reassign': 'error',
            'no-restricted-globals': ['error', 'global'],
            // Enforce explicit import paths for all internal modules
            'import/no-useless-path-segments': ['error', { noUselessIndex: true }]
        }
    },
    // Strict tree-shaking rules for component files
    {
        files: [
            'src/components/**/*.tsx',
            'src/components/**/*.ts',
            '!src/components/**/*.test.ts',
            '!src/components/**/*.test.tsx'
        ],
        rules: {
            // Each component file should have a single export
            'no-restricted-exports': [
                'error',
                {
                    restrictedNamedExports: ['default']
                }
            ],
            // Barrel exports (index.ts) should ONLY re-export, never define components
            'no-unused-expressions': 'error'
        }
    },
    storybook.configs['flat/recommended']
);
