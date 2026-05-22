/// <reference types="vitest" />
/// <reference types="vite/client" />
import path from 'path';
import { defineConfig } from 'vite';

// Mirror webpack's `resolve.modules: [src, node_modules]` so bare imports like
// `scripts/foo` resolve in vitest the same way they do in the real build.
const SRC_DIR = path.resolve(__dirname, 'src');

export default defineConfig({
    resolve: {
        alias: [
            { find: /^scripts\//, replacement: path.join(SRC_DIR, 'scripts/') },
            { find: /^components\//, replacement: path.join(SRC_DIR, 'components/') },
            { find: /^utils\//, replacement: path.join(SRC_DIR, 'utils/') },
            { find: /^hooks\//, replacement: path.join(SRC_DIR, 'hooks/') },
            { find: /^elements\//, replacement: path.join(SRC_DIR, 'elements/') },
            { find: /^types\//, replacement: path.join(SRC_DIR, 'types/') },
            { find: /^apps\//, replacement: path.join(SRC_DIR, 'apps/') },
            { find: /^lib\//, replacement: path.join(SRC_DIR, 'lib/') },
            { find: /^plugins\//, replacement: path.join(SRC_DIR, 'plugins/') },
            { find: /^themes\//, replacement: path.join(SRC_DIR, 'themes/') },
            { find: /^controllers\//, replacement: path.join(SRC_DIR, 'controllers/') }
        ]
    },
    define: {
        // Webpack DefinePlugin globals consumed by src/ — stub for vitest.
        __WEBPACK_SERVE__: 'false',
        __COMMIT_SHA__: '""',
        __JF_BUILD_VERSION__: '"Test"',
        __PACKAGE_JSON_NAME__: '"jellyfin-web"',
        __PACKAGE_JSON_VERSION__: '"0.0.0"',
        __USE_SYSTEM_FONTS__: 'false'
    },
    test: {
        coverage: {
            include: [ 'src' ]
        },
        environment: 'jsdom',
        restoreMocks: true
    }
});
