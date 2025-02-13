const restrictedGlobals = require('confusing-browser-globals');

module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: [
        '@stylistic',
        '@typescript-eslint',
        'react',
        'import',
        'sonarjs'
    ],
    env: {
        node: true,
        es6: true,
        es2017: true,
        es2020: true
    },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:import/errors',
        'plugin:@eslint-community/eslint-comments/recommended',
        'plugin:compat/recommended',
        'plugin:sonarjs/recommended'
    ],
    rules: {
        'array-callback-return': ['error', { 'checkForEach': true }],
        'curly': ['error', 'multi-line', 'consistent'],
        'default-case-last': ['error'],
        'max-params': ['error', 7],
        'new-cap': [
            'error',
            {
                'capIsNewExceptions': ['jQuery.Deferred'],
                'newIsCapExceptionPattern': '\\.default$'
            }
        ],
        'no-duplicate-imports': ['error'],
        'no-empty-function': ['error'],
        'no-extend-native': ['error'],
        'no-lonely-if': ['error'],
        'no-nested-ternary': ['error'],
        'no-redeclare': ['off'],
        '@typescript-eslint/no-redeclare': ['error', { builtinGlobals: false }],
        'no-restricted-globals': ['error'].concat(restrictedGlobals),
        'no-return-assign': ['error'],
        'no-return-await': ['error'],
        'no-sequences': ['error', { 'allowInParentheses': false }],
        'no-shadow': ['off'],
        '@typescript-eslint/no-shadow': ['error'],
        'no-throw-literal': ['error'],
        'no-undef-init': ['error'],
        'no-unneeded-ternary': ['error'],
        'no-unused-expressions': ['off'],
        '@typescript-eslint/no-unused-expressions': ['error', { 'allowShortCircuit': true, 'allowTernary': true, 'allowTaggedTemplates': true }],
        'no-unused-private-class-members': ['error'],
        'no-useless-rename': ['error'],
        'no-useless-constructor': ['off'],
        '@typescript-eslint/no-useless-constructor': ['error'],
        'no-var': ['error'],
        'no-void': ['error', { 'allowAsStatement': true }],
        'no-warning-comments': ['warn', { 'terms': ['fixme', 'hack', 'xxx'] }],
        'one-var': ['error', 'never'],
        'prefer-const': ['error', { 'destructuring': 'all' }],
        'prefer-promise-reject-errors': ['warn', { 'allowEmptyReject': true }],
        '@typescript-eslint/prefer-for-of': ['error'],
        'radix': ['error'],
        'yoda': 'error',

        'react/jsx-filename-extension': ['error', { 'extensions': ['.jsx', '.tsx'] }],
        'react/jsx-no-bind': ['error'],
        'react/jsx-no-useless-fragment': ['error'],
        'react/jsx-no-constructed-context-values': ['error'],
        'react/no-array-index-key': ['error'],

        'sonarjs/no-inverted-boolean-check': ['error'],
        // TODO: Enable the following rules and fix issues
        'sonarjs/cognitive-complexity': ['off'],
        'sonarjs/no-duplicate-string': ['off'],

        '@stylistic/block-spacing': ['error'],
        '@stylistic/brace-style': ['error', '1tbs', { 'allowSingleLine': true }],
        '@stylistic/comma-dangle': ['error', 'never'],
        '@stylistic/comma-spacing': ['error'],
        '@stylistic/eol-last': ['error'],
        '@stylistic/indent': ['error', 4, { 'SwitchCase': 1 }],
        '@stylistic/jsx-quotes': ['error', 'prefer-single'],
        '@stylistic/keyword-spacing': ['error'],
        '@stylistic/max-statements-per-line': ['error'],
        '@stylistic/no-floating-decimal': ['error'],
        '@stylistic/no-multi-spaces': ['error'],
        '@stylistic/no-multiple-empty-lines': ['error', { 'max': 1 }],
        '@stylistic/no-trailing-spaces': ['error'],
        '@stylistic/object-curly-spacing': ['error', 'always'],
        '@stylistic/operator-linebreak': ['error', 'before', { overrides: { '?': 'after', ':': 'after', '=': 'after' } }],
        '@stylistic/padded-blocks': ['error', 'never'],
        '@stylistic/quotes': ['error', 'single', { 'avoidEscape': true, 'allowTemplateLiterals': false }],
        '@stylistic/semi': ['error'],
        '@stylistic/space-before-blocks': ['error'],
        '@stylistic/space-infix-ops': ['error']
    },
    settings: {
        react: {
            version: 'detect'
        },
        'import/parsers': {
            '@typescript-eslint/parser': [ '.ts', '.tsx' ]
        },
        'import/resolver': {
            node: {
                extensions: [
                    '.js',
                    '.ts',
                    '.jsx',
                    '.tsx'
                ],
                moduleDirectory: [
                    'node_modules',
                    'src'
                ]
            }
        },
        polyfills: [
            // Native Promises Only
            'Promise',
            // whatwg-fetch
            'fetch',
            // document-register-element
            'document.registerElement',
            // resize-observer-polyfill
            'ResizeObserver',
            // fast-text-encoding
            'TextEncoder',
            // intersection-observer
            'IntersectionObserver',
            // Core-js
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
            'Reflect',
            // Temporary while eslint-compat-plugin is buggy
            'document.querySelector'
        ]
    },
    overrides: [
        // Config files and development scripts
        {
            files: [
                './babel.config.js',
                './.eslintrc.js',
                './postcss.config.js',
                './webpack.*.js',
                './scripts/**/*.js'
            ]
        },
        // JavaScript source files
        {
            files: [
                './src/**/*.{js,jsx,ts,tsx}'
            ],
            parserOptions: {
                project: ['./tsconfig.json']
            },
            env: {
                node: false,
                browser: true,
                es6: true,
                es2017: true,
                es2020: true
            },
            globals: {
                // Tizen globals
                'tizen': 'readonly',
                'webapis': 'readonly',
                // WebOS globals
                'webOS': 'readonly',
                // Dependency globals
                '$': 'readonly',
                'jQuery': 'readonly',
                // Jellyfin globals
                'ApiClient': 'writable',
                'Events': 'writable',
                'chrome': 'writable',
                'Emby': 'readonly',
                'Hls': 'writable',
                'LibraryMenu': 'writable',
                'Windows': 'readonly',
                // Build time definitions
                __COMMIT_SHA__: 'readonly',
                __JF_BUILD_VERSION__: 'readonly',
                __PACKAGE_JSON_NAME__: 'readonly',
                __PACKAGE_JSON_VERSION__: 'readonly',
                __USE_SYSTEM_FONTS__: 'readonly',
                __WEBPACK_SERVE__: 'readonly'
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
                    // Ignore numbers, locale strings (en-us), aria/data attributes, CSS selectors,
                    // and api_key parameter
                    {
                        selector: [ 'objectLiteralProperty', 'typeProperty' ],
                        format: null,
                        filter: {
                            regex: '[ &\\-]|^([0-9]+)$|^api_key$',
                            match: true
                        }
                    }
                ],
                '@typescript-eslint/prefer-string-starts-ends-with': ['error']
            }
        },
        // TypeScript source files
        {
            files: [
                './src/**/*.{ts,tsx}'
            ],
            extends: [
                'eslint:recommended',
                'plugin:import/typescript',
                'plugin:@typescript-eslint/recommended',
                'plugin:@eslint-community/eslint-comments/recommended',
                'plugin:react/recommended',
                'plugin:react-hooks/recommended',
                'plugin:jsx-a11y/recommended'
            ],
            rules: {
                '@typescript-eslint/no-floating-promises': ['error'],
                '@typescript-eslint/no-unused-vars': ['error'],

                'sonarjs/cognitive-complexity': ['error']
            }
        }
    ]
};
