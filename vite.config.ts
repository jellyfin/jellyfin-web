/// <reference types="vitest" />
/// <reference types="vite/client" />
import { defineConfig } from 'vite';
import * as path from 'node:path';

export default defineConfig({
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
