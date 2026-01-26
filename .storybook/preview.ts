import type { Preview } from '@storybook/react';
import React from 'react';
import { Theme } from '@radix-ui/themes';

import { vars } from '../src/styles/tokens.css';
import MockProviders from './providers';

import '@radix-ui/themes/styles.css';
import '../src/styles/fonts.css.ts';
import '../src/styles/site.css.ts';
import '../src/styles/tokens.semantic.css';
import '../src/styles/components.css';

const preview: Preview = {
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i
            }
        },
        backgrounds: {
            options: {
                dark: { name: 'dark', value: vars.colors.background },
                light: { name: 'light', value: '#ffffff' },
                surface: { name: 'surface', value: vars.colors.surface }
            }
        },
        viewport: {
            options: {
                mobile: { name: 'Mobile', styles: { width: '375px', height: '667px' } },
                tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
                desktop: { name: 'Desktop', styles: { width: '1280px', height: '800px' } },
                wide: { name: 'Wide', styles: { width: '1920px', height: '1080px' } }
            }
        },
        a11y: {
            config: {
                rules: [{ id: 'color-contrast', enabled: true }]
            },

            // 'todo' - show a11y violations in the test UI only
            // 'error' - fail CI on a11y violations
            // 'off' - skip a11y checks entirely
            test: 'todo'
        }
    },

    globalTypes: {
        locale: {
            name: 'Locale',
            description: 'Internationalization locale',
            defaultValue: 'ltr',
            toolbar: {
                icon: 'globe',
                items: [
                    { value: 'ltr', title: 'LTR' },
                    { value: 'rtl', title: 'RTL' }
                ]
            }
        },
        appearance: {
            name: 'Appearance',
            description: 'Radix UI theme appearance',
            defaultValue: 'dark',
            toolbar: {
                icon: 'contrast',
                items: [
                    { value: 'light', title: 'Light' },
                    { value: 'dark', title: 'Dark' }
                ]
            }
        },
        accentColor: {
            name: 'Accent Color',
            description: 'Radix UI accent color',
            defaultValue: 'jade',
            toolbar: {
                items: [
                    { value: 'blue', title: 'Blue' },
                    { value: 'cyan', title: 'Cyan' },
                    { value: 'gold', title: 'Gold' },
                    { value: 'green', title: 'Green' },
                    { value: 'jade', title: 'Jade' },
                    { value: 'orange', title: 'Orange' },
                    { value: 'pink', title: 'Pink' },
                    { value: 'plum', title: 'Plum' },
                    { value: 'purple', title: 'Purple' },
                    { value: 'red', title: 'Red' },
                    { value: 'tomato', title: 'Tomato' },
                    { value: 'violet', title: 'Violet' }
                ]
            }
        }
    },

    decorators: [
        (Story, context) => {
            const appearance = context.globals?.appearance ?? 'dark';
            const accentColor = context.globals?.accentColor ?? 'jade';
            const isRtl = context.globals?.locale === 'rtl';

            return React.createElement(
                Theme,
                {
                    appearance,
                    accentColor,
                    grayColor: 'sage',
                    radius: 'medium',
                    scaling: '100%'
                },
                React.createElement(
                    'div',
                    {
                        style: {
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            color: 'var(--text-1)',
                            backgroundColor: 'var(--bg)',
                            padding: '1rem',
                            minHeight: '100vh',
                            direction: isRtl ? 'rtl' : 'ltr'
                        }
                    },
                    React.createElement(Story)
                )
            );
        },
        Story =>
            React.createElement(
                'div',
                {
                    style: { maxWidth: '1200px', margin: '0 auto' }
                },
                React.createElement(Story)
            ),
        (Story, context) => {
            const { providers } = context.parameters;
            if (!providers) return React.createElement(Story);
            return React.createElement(
                MockProviders,
                {
                    audioStore: providers.audioStore,
                    serverStore: providers.serverStore,
                    playbackStore: providers.playbackStore,
                    themeStore: providers.themeStore,
                    notificationsStore: providers.notificationsStore,
                    i18n: providers.i18n !== false
                },
                React.createElement(Story)
            );
        }
    ],

    initialGlobals: {
        backgrounds: {
            value: 'dark'
        },
        appearance: 'dark',
        accentColor: 'jade'
    }
};

export default preview;
