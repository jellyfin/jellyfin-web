module.exports = {
    root: true,
    plugins: [
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
            impliedStrict: true
        }
    },
    extends: [
        'eslint:recommended',
        // 'plugin:promise/recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:eslint-comments/recommended',
        'plugin:compat/recommended'
    ],
    rules: {
        'block-spacing': ['error'],
        'brace-style': ['error'],
        'comma-dangle': ['error', 'never'],
        'comma-spacing': ['error'],
        'eol-last': ['error'],
        'indent': ['error', 4, { 'SwitchCase': 1 }],
        'keyword-spacing': ['error'],
        'max-statements-per-line': ['error'],
        'no-floating-decimal': ['error'],
        'no-multi-spaces': ['error'],
        'no-multiple-empty-lines': ['error', { 'max': 1 }],
        'no-trailing-spaces': ['error'],
        'one-var': ['error', 'never'],
        'quotes': ['error', 'single', { 'avoidEscape': true, 'allowTemplateLiterals': false }],
        'semi': ['error'],
        'space-before-blocks': ['error'],
        'space-infix-ops': 'error'
    },
    overrides: [
        {
            files: [
                './src/**/*.js'
            ],
            parser: 'babel-eslint',
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
                'requirejs': 'readonly',
                // Jellyfin globals
                'ApiClient': 'writable',
                'AppInfo': 'writable',
                'chrome': 'writable',
                'ConnectionManager': 'writable',
                'DlnaProfilePage': 'writable',
                'Dashboard': 'writable',
                'DashboardPage': 'writable',
                'Emby': 'readonly',
                'Events': 'writable',
                'getParameterByName': 'writable',
                'getWindowLocationSearch': 'writable',
                'Globalize': 'writable',
                'Hls': 'writable',
                'dfnshelper': 'writable',
                'LibraryMenu': 'writable',
                'LinkParser': 'writable',
                'LiveTvHelpers': 'writable',
                'MetadataEditor': 'writable',
                'pageClassOn': 'writable',
                'pageIdOn': 'writable',
                'PlaylistViewer': 'writable',
                'UserParentalControlPage': 'writable',
                'Windows': 'readonly'
            },
            rules: {
                // TODO: Fix warnings and remove these rules
                'no-redeclare': ['warn'],
                'no-unused-vars': ['warn'],
                'no-useless-escape': ['warn'],
                // TODO: Remove after ES6 migration is complete
                'import/no-unresolved': ['off']
            },
            settings: {
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
            }
        }
    ]
}
