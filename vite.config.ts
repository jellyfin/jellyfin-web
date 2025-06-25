import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'

import packageJson from './package.json' assert { type: 'json' };

let COMMIT_SHA = (await import('child_process')).execSync('git rev-parse HEAD').toString().trim()

const Assets = [
    './node_modules/native-promise-only/npo.js',
    './node_modules/libarchive.js/dist/worker-bundle.js',
    './node_modules/libarchive.js/dist/libarchive.wasm',
    './node_modules/@jellyfin/libass-wasm/dist/js/default.woff2',
    './node_modules/@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker.js',
    './node_modules/@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker.wasm',
    './node_modules/@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker-legacy.js',
    './node_modules/pdfjs-dist/build/pdf.worker.js',
    './node_modules/libpgs/dist/libpgs.worker.js'
] as const;

export default defineConfig((config) => ({
    plugins: [react()],
    // base: "/src/",
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        alias: {
            "@": './src',
            apps: './src/apps',
            assets: './src/assets',
            components: './src/components',
            constants: './src/constants',
            controllers: './src/controllers',
            elements: './src/elements',
            hooks: './src/hooks',
            lib: './src/lib',
            plugins: './src/plugins',
            scripts: './src/scripts',
            strings: './src/strings',
            styles: './src/styles',
            themes: './src/themes',
            types: './src/types',
            utils: './src/utils'
        },
    },
    build: {
        sourcemap: config.mode === 'Development',
    },
    assetsInclude: [],
    test: {
        coverage: {
            include: ['src']
        },
        environment: 'jsdom',
        restoreMocks: true
    },
    define: {
        __COMMIT_SHA__: COMMIT_SHA,
        __JF_BUILD_VERSION__: config.mode == "Development" ? 'Dev Server' : process.env.JELLYFIN_VERSION ?? 'Release',
        __PACKAGE_JSON_NAME__: packageJson.name,
        __PACKAGE_JSON_VERSION__: packageJson.version,
        __USE_SYSTEM_FONTS__: !!JSON.parse(process.env.USE_SYSTEM_FONTS ?? '0'),
        __WEBPACK_SERVE__: !!JSON.parse(process.env.WEBPACK_SERVE ?? '0')
    }
}));
