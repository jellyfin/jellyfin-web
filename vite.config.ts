/// <reference types="vitest" />
/// <reference types="vite/client" />
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';
import fs from 'fs';
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
const htmlAsStringPlugin: Plugin = {
    name: 'html-as-string',
    enforce: 'pre',
    async resolveId(id, importer) {
        if (id.endsWith('.html') && !id.endsWith('index.html')) {
            const res = await this.resolve(id, importer, { skipSelf: true });
            if (res) return res.id + '?html-string';
        }
    },
    load(id: string) {
        if (id.endsWith('?html-string')) {
            const file = id.replace('?html-string', '');
            const code = fs.readFileSync(file, 'utf-8');
            return `export default ${JSON.stringify(code)};`;
        }
    },
};

// Plugin to handle Webpack-style '~' prefix in CSS imports
const scssTildePlugin: Plugin = {
    name: 'scss-tilde-import',
    enforce: 'pre',
    resolveId(source) {
        if (source.startsWith('~@fontsource')) {
            return source.replace('~', '');
        }
    }
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
            target: 'es2015',
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
                    },
                    manualChunks(id) {
                        if (id.includes('node_modules')) {
                            if (id.includes('@mui')) return 'vendor-mui';
                            if (id.includes('three') || id.includes('@react-three')) return 'vendor-graphics';
                            if (id.includes('butterchurn')) return 'vendor-visualizers';
                            if (id.includes('hls.js') || id.includes('flv.js') || id.includes('wavesurfer.js')) return 'vendor-media';
                            if (id.includes('epubjs') || id.includes('pdfjs-dist') || id.includes('libarchive.js')) return 'vendor-docs';
                            if (id.includes('@jellyfin/libass-wasm') || id.includes('libpgs')) return 'vendor-subtitles';
                            if (id.includes('lodash-es') || id.includes('date-fns') || id.includes('dompurify') || id.includes('markdown-it')) return 'vendor-utils';
                            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom') || id.includes('@tanstack/react-query') || id.includes('zustand') || id.includes('framer-motion')) return 'vendor-framework';
                            if (id.includes('core-js')) return 'vendor-corejs';
                            if (id.includes('@jellyfin/sdk') || id.includes('jellyfin-apiclient')) return 'vendor-jellyfin';
                            if (id.includes('swiper') || id.includes('jstree') || id.includes('sortablejs')) return 'vendor-ui-libs';
                            return 'vendor';
                        }
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
            scssTildePlugin,
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