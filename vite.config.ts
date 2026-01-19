/// <reference types="vitest" />
/// <reference types="vite/client" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';
import { globSync } from 'fast-glob';
import { execSync } from 'child_process';
import packageJson from './package.json';

// Get commit SHA
let COMMIT_SHA = '';
try {
    COMMIT_SHA = execSync('git describe --always --dirty').toString().trim();
} catch (err) {
    // Ignore
}

// Plugin to handle HTML template imports as raw text (Webpack html-loader compatibility)
const htmlAsStringPlugin = {
    name: 'html-as-string',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
        if (id.endsWith('.html') && !id.endsWith('index.html')) {
            return {
                code: `export default ${JSON.stringify(code)};`,
                map: null,
            };
        }
    },
};

const Assets = [
    'native-promise-only/npo.js',
    'libarchive.js/dist/worker-bundle.js',
    'libarchive.js/dist/libarchive.wasm',
    '@jellyfin/libass-wasm/dist/js/default.woff2',
    '@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker.js',
    '@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker.wasm',
    '@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker-legacy.js',
    'pdfjs-dist/build/pdf.worker.mjs',
    'libpgs/dist/libpgs.worker.js'
];

// Find themes
const themeEntries = globSync('src/themes/**/*.scss').reduce((acc, file) => {
    // src/themes/dark/theme.scss -> themes/dark/theme
    const relativePath = path.relative('src', file);
    const entryName = relativePath.replace(/\.scss$/, '');
    acc[entryName] = path.resolve(__dirname, file);
    return acc;
}, {} as Record<string, string>);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        base: env.VITE_BASE || './', // Default to relative for flexibility, or override via env
        root: 'src', // Webpack context was 'src'
        publicDir: false, // We handle static assets manually to match Webpack structure
        build: {
            outDir: '../dist', // Since root is src
            emptyOutDir: true,
            rollupOptions: {
                input: {
                    main: path.resolve(__dirname, 'src/index.html'),
                    ...themeEntries
                },
                output: {
                    assetFileNames: (assetInfo) => {
                        if (assetInfo.name?.endsWith('.css') && assetInfo.name.includes('themes/')) {
                            // Output themes as themes/id/theme.css
                            // assetInfo.name might be "themes/dark/theme.css" based on input key
                            return '[name][extname]';
                        }
                        return 'assets/[name]-[hash][extname]';
                    },
                    chunkFileNames: 'assets/[name]-[hash].js',
                    entryFileNames: (chunkInfo) => {
                        // Themes might generate empty JS files, but we mainly care about CSS
                        if (chunkInfo.name.includes('themes/')) {
                            return '[name].js';
                        }
                        return 'assets/[name]-[hash].js';
                    }
                }
            }
        },
        resolve: {
            alias: {
                // Compatibility aliases if needed
            }
        },
        define: {
            __COMMIT_SHA__: JSON.stringify(COMMIT_SHA),
            __JF_BUILD_VERSION__: JSON.stringify(process.env.JELLYFIN_VERSION || 'Release'),
            __PACKAGE_JSON_NAME__: JSON.stringify(packageJson.name),
            __PACKAGE_JSON_VERSION__: JSON.stringify(packageJson.version),
            __USE_SYSTEM_FONTS__: JSON.stringify(false), // Default
            __WEBPACK_SERVE__: JSON.stringify(mode === 'development'),
            __DEV_SERVER_PROXY_TARGET__: JSON.stringify('')
        },
        plugins: [
            react(),
            tsconfigPaths({
                root: '..' // Since vite root is src, tsconfig is in parent
            }),
            htmlAsStringPlugin,
            viteStaticCopy({
                targets: [
                    { src: 'assets', dest: '.' },
                    { src: 'config.json', dest: '.' },
                    { src: 'robots.txt', dest: '.' },
                    { src: 'offline.html', dest: '.' },
                    { src: 'serviceworker.backup.js', dest: '.', rename: 'serviceworker.js' }, // Legacy SW
                    { 
                        src: '../node_modules/@jellyfin/ux-web/favicons/touchicon*.png', 
                        dest: 'favicons' 
                    },
                    { 
                        src: '../node_modules/@jellyfin/ux-web/banner-light.png', 
                        dest: 'favicons' 
                    },
                    ...Assets.map(asset => ({
                        src: `../node_modules/${asset}`,
                        dest: 'libraries'
                    }))
                ]
            })
        ],
        test: {
            globals: true,
            environment: 'jsdom',
            restoreMocks: true
        }
    };
});