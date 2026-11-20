import { Api } from '@jellyfin/sdk';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import React, { type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiContext } from 'hooks/useApi';

import { getUserAvatarBackgroundClass } from 'utils/userAvatar';

import UserAvatar from './UserAvatar';

vi.mock('lib/jellyfin-apiclient', () => ({
    ServerConnections: {}
}));

const theme = createTheme({ cssVariables: true });

const CLIENT_INFO = { name: 'Test Client', version: '1.0.0' };
const DEVICE_INFO = { name: 'Test Device', id: 'test-device-id' };

const createApi = (basePath: string) => new Api(basePath, CLIENT_INFO, DEVICE_INFO);

const CONTEXT_API = createApi('https://context.example.com');
const OVERRIDE_API = createApi('https://override.example.com');

const USER: UserDto = {
    Id: 'user-id',
    Name: 'alice',
    PrimaryImageTag: 'image-tag'
};

const renderWithContext = (ui: ReactNode, api: Api | undefined = CONTEXT_API) => render(
    <ApiContext.Provider value={{ api }}>
        <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </ApiContext.Provider>
);

const getImageUrl = () => new URL(screen.getByRole('img').getAttribute('src') ?? '');

describe('UserAvatar', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('renders nothing without a user', () => {
        const { container } = renderWithContext(<UserAvatar />);

        expect(container).toBeEmptyDOMElement();
    });

    it('uses the user name as the default alt text', () => {
        renderWithContext(<UserAvatar user={USER} />);

        expect(screen.getByRole('img')).toHaveAttribute('alt', 'alice');
    });

    it('allows overriding the alt text', () => {
        renderWithContext(<UserAvatar user={USER} alt='avatar of alice' />);

        expect(screen.getByRole('img')).toHaveAttribute('alt', 'avatar of alice');
    });

    it('forwards className and merges sx with the default styles', () => {
        renderWithContext(
            <UserAvatar
                user={USER}
                size={40}
                className='custom-avatar'
                sx={[ { opacity: 0.5 }, { marginTop: '3px' } ]}
            />
        );

        const avatar = screen.getByRole('img').parentElement;
        expect(avatar).toHaveClass('custom-avatar');
        expect(avatar).toHaveStyle({ width: '40px', height: '40px', opacity: '0.5', marginTop: '3px' });
    });

    it('does not request a sized image when size is not given', () => {
        renderWithContext(<UserAvatar user={USER} />);

        const url = getImageUrl();
        expect(url.pathname).toBe('/Users/user-id/Images/Primary');
        expect(url.searchParams.get('tag')).toBe('image-tag');
        expect(url.searchParams.has('width')).toBe(false);
    });

    it('requests an image scaled by the device pixel ratio when size is given', () => {
        vi.stubGlobal('devicePixelRatio', 1.5);

        renderWithContext(<UserAvatar user={USER} size={45} />);

        expect(getImageUrl().searchParams.get('width')).toBe('68');
    });

    it('prefers the api prop over the api from the context', () => {
        renderWithContext(<UserAvatar user={USER} api={OVERRIDE_API} />);

        expect(getImageUrl().origin).toBe('https://override.example.com');
    });

    it('uses the api from the context when no api prop is given', () => {
        renderWithContext(<UserAvatar user={USER} />);

        expect(getImageUrl().origin).toBe('https://context.example.com');
    });

    it('renders a fallback without an image when no api is available', () => {
        render(
            <ThemeProvider theme={theme}><UserAvatar user={USER} /></ThemeProvider>
        );

        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    describe('fallback color', () => {
        const getAvatar = (container: HTMLElement) => container.querySelector('.MuiAvatar-root');
        const getFallback = (container: HTMLElement) => container.querySelector('.defaultCardBackground');

        it('tells users without a picture apart with the card backgrounds of the theme', () => {
            // The ids pick different theme colors, so households without photos still get distinct avatars
            const { container: aliceContainer } = renderWithContext(<UserAvatar user={{ Id: 'user-id', Name: 'alice' }} />);
            const { container: bobContainer } = renderWithContext(<UserAvatar user={{ Id: 'bob', Name: 'bob' }} />);

            expect(getFallback(aliceContainer)).toHaveClass(getUserAvatarBackgroundClass({ Id: 'user-id' }));
            expect(getFallback(bobContainer)).toHaveClass(getUserAvatarBackgroundClass({ Id: 'bob' }));
            expect(getFallback(aliceContainer)?.className).not.toBe(getFallback(bobContainer)?.className);
            // The icon takes the color of the text, like the icons of the other cards without an image
            expect(getAvatar(aliceContainer)).toHaveStyle({ color: 'var(--mui-palette-text-primary)' });
            expect(screen.queryByRole('img')).not.toBeInTheDocument();
        });

        it('is not applied when the user has a picture', () => {
            const { container } = renderWithContext(<UserAvatar user={USER} />);

            expect(getFallback(container)).not.toBeInTheDocument();
            expect(getAvatar(container)).toHaveStyle({ backgroundColor: 'var(--mui-palette-background-paper)' });
        });
    });
});
