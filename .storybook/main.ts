// This file has been automatically migrated to valid ESM format by Storybook.
import { fileURLToPath } from 'node:url';
import path, { dirname } from 'path';
import type { StorybookConfig } from '@storybook/react-vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: StorybookConfig = {
    stories: [
        '../src/ui-primitives/__stories__/**/*.stories.@(js|jsx|mjs|ts|tsx)',
        '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'
    ],
    addons: [
        '@storybook/addon-a11y',
        '@storybook/addon-docs',
        '@storybook/addon-vitest'
    ],
    framework: '@storybook/react-vite',
    docs: {},
    viteFinal: async (viteConfig) => {
        // Storybook needs a minimal vite config that doesn't include app-specific plugins
        // Remove the viteStaticCopy plugin which requires files that don't exist in Storybook context
        viteConfig.plugins = viteConfig.plugins?.filter(plugin => {
            return !(
                plugin
                && typeof plugin === 'object'
                && 'name' in plugin
                && plugin.name === 'vite-static-copy'
            );
        });

        // Enable publicDir for Storybook to access locale files
        viteConfig.publicDir = path.resolve(__dirname, '../public');



        // Update build settings for Storybook
        if (viteConfig.build) {
            viteConfig.build.outDir = path.resolve(__dirname, '../storybook-static');
        }

        return viteConfig;
    }
};

export default config;
