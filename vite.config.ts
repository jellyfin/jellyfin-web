/// <reference types="vitest" />
/// <reference types="vite/client" />
import { defineConfig } from 'vite';

export default defineConfig({
    test: {
        coverage: {
            include: [ 'src' ]
        },
        environment: 'jsdom',
        restoreMocks: true,
        exclude: [
            // e2e tests should be executed separately from the unit tests
            '**/playwright/**',
            '**/e2e/**',
            'node_modules/**'
        ]
    }
});
