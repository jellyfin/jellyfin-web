/// <reference types="vitest" />
/// <reference types="vite/client" />
import { defineConfig } from 'vite';
import * as path from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [ tsconfigPaths() ],
    test: {
        coverage: {
            include: [ 'src' ]
        },
        environment: 'jsdom',
        restoreMocks: true
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    }
});
