/// <reference types="vitest" />
/// <reference types="vite/client" />
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// Plugin to handle HTML template imports as raw text
const htmlAsStringPlugin = {
    name: 'html-as-string',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
        if (id.endsWith('.html')) {
            return {
                code: `export default ${JSON.stringify(code)};`,
                map: null,
            };
        }
    },
};

export default defineConfig({
    plugins: [ htmlAsStringPlugin, tsconfigPaths() ],
    test: {
        globals: true,
        coverage: {
            include: [ 'src' ]
        },
        environment: 'jsdom',
        restoreMocks: true
    }
});
