/// <reference types="vitest" />
/// <reference types="vite/client" />
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [ tsconfigPaths() ],
    test: {
        coverage: {
            include: [ 'src/**/*.{js,jsx,ts,tsx}' ],
            reporter: [ 'text-summary', 'html', 'lcov' ]
        },
        environment: 'jsdom',
        restoreMocks: true
    }
});
