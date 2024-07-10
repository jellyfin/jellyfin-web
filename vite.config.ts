/// <reference types="vitest" />
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globalSetup: 'vitest.setup.ts'
    },
    plugins: [tsconfigPaths()]
});
