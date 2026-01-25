import type { Preview } from '@storybook/react';
import React from 'react';

import { vars } from '../src/styles/tokens.css';
import MockProviders from './providers';

import '../src/styles/fonts.css.ts';
import '../src/styles/site.css.ts';

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

    decorators: [
        (Story, context) => {
            const isRtl = context.globals?.locale === 'rtl';
            return React.createElement(
                'div',
                {
                    style: {
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        color: vars.colors.text,
                        backgroundColor: vars.colors.background,
                        padding: '1rem',
                        minHeight: '100vh',
                        direction: isRtl ? 'rtl' : 'ltr'
                    }
                },
                React.createElement(Story)
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
        }
    },

    initialGlobals: {
        backgrounds: {
            value: 'dark'
        }
    }
};

export default preview;
