const restrictedGlobals = require('confusing-browser-globals');

module.exports = {
    root: true,
    plugins: [
        '@babel',
        'react',
        'promise',
        'import',
        'eslint-comments'
    ],
    env: {
        node: true,
        es6: true,
        es2017: true,
        es2020: true
    },
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
            impliedStrict: true,
            jsx: true
        }
    },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        // 'plugin:promise/recommended',
        'plugin:import/errors',
        'plugin:eslint-comments/recommended',
        'plugin:compat/recommended'
    ],
    rules: {
        'array-callback-return': ['error'],
        'block-spacing': ['error'],
        'brace-style': ['error', '1tbs', { 'allowSingleLine': true }],
        'comma-dangle': ['error', 'never'],
        'comma-spacing': ['error'],
        'default-case-last': ['error'],
        'eol-last': ['error'],
        'indent': ['error', 4, { 'SwitchCase': 1 }],
        'jsx-quotes': ['error', 'prefer-single'],
        'keyword-spacing': ['error'],
        'no-throw-literal': ['error'],
        'max-statements-per-line': ['error'],
        'no-duplicate-imports': ['error'],
        'no-empty-function': ['error'],
        'no-floating-decimal': ['error'],
        'no-multi-spaces': ['error'],
        'no-multiple-empty-lines': ['error', { 'max': 1 }],
        'no-restricted-globals': ['error'].concat(restrictedGlobals),
        'no-return-await': ['error'],
        'no-trailing-spaces': ['error'],
        '@babel/no-unused-expressions': ['error', { 'allowShortCircuit': true, 'allowTernary': true, 'allowTaggedTemplates': true }],
        'no-void': ['error', { 'allowAsStatement': true }],
        'no-nested-ternary': ['error'],
        'one-var': ['error', 'never'],
        'padded-blocks': ['error', 'never'],
        'prefer-const': ['error', { 'destructuring': 'all' }],
        'quotes': ['error', 'single', { 'avoidEscape': true, 'allowTemplateLiterals': false }],
        '@babel/semi': ['error'],
        'no-var': ['error'],
        'space-before-blocks': ['error'],
        'space-infix-ops': 'error',
        'yoda': 'error',
        'no-sequences': ['error', { 'allowInParentheses': false }]
    },
    settings: {
        react: {
            version: 'detect'
        },
        'import/extensions': [
            '.js',
            '.ts',
            '.jsx',
            '.tsx'
        ],
        'import/parsers': {
            '@typescript-eslint/parser': [ '.ts', '.tsx' ]
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
                './src/**/*.js',
                './src/**/*.ts'
            ],
            parser: '@babel/eslint-parser',
            env: {
                node: false,
                amd: true,
                browser: true,
                es6: true,
                es2017: true,
                es2020: true
            },
            globals: {
                // Browser globals
                'MediaMetadata': 'readonly',
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
                'DlnaProfilePage': 'writable',
                'DashboardPage': 'writable',
                'Emby': 'readonly',
                'Globalize': 'writable',
                'Hls': 'writable',
                'dfnshelper': 'writable',
                'LibraryMenu': 'writable',
                'LinkParser': 'writable',
                'LiveTvHelpers': 'writable',
                'Loading': 'writable',
                'MetadataEditor': 'writable',
                'ServerNotifications': 'writable',
                'TaskButton': 'writable',
                'UserParentalControlPage': 'writable',
                'Windows': 'readonly'
            },
            rules: {
            }
        },
        // TypeScript source files
        {
            files: [
                './src/**/*.ts',
                './src/**/*.tsx'
            ],
            parser: '@typescript-eslint/parser',
            plugins: ['@typescript-eslint'],
            extends: [
                'eslint:recommended',
                'plugin:import/typescript',
                'plugin:@typescript-eslint/recommended',
                'plugin:eslint-comments/recommended',
                'plugin:react/recommended',
                'plugin:react-hooks/recommended',
                'plugin:jsx-a11y/recommended'
            ]
        }
    ]
};
