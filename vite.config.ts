/// <reference types="vitest" />
/// <reference types="vite/client" />
import { defineConfig } from 'vite';

export default defineConfig({
    test: {
        coverage: {
            include: [ 'src' ]
        },
        environment: 'jsdom',
        restoreMocks: true
    }
});
