import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';

import i18n from '../src/i18n';
import { vars } from '../src/styles/tokens.css';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,
            retry: false,
            refetchOnWindowFocus: false
        }
    }
});

interface AudioStoreState {
    isPlaying: boolean;
    currentTrack: {
        id: string;
        title: string;
        artist: string;
        album: string;
        imageUrl: string;
    } | null;
    volume: number;
    shuffleEnabled: boolean;
    repeatMode: 'off' | 'all' | 'one';
    crossfadeEnabled: boolean;
    crossfadeDuration: number;
}

const createMockAudioStore = (initialState?: Partial<AudioStoreState>) => ({
    isPlaying: initialState?.isPlaying ?? false,
    currentTrack: initialState?.currentTrack ?? null,
    volume: initialState?.volume ?? 0.8,
    shuffleEnabled: initialState?.shuffleEnabled ?? false,
    repeatMode: initialState?.repeatMode ?? 'off',
    crossfadeEnabled: initialState?.crossfadeEnabled ?? false,
    crossfadeDuration: initialState?.crossfadeDuration ?? 5,
    setIsPlaying: (_isPlaying: boolean) => undefined,
    setCurrentTrack: (_track: AudioStoreState['currentTrack']) => undefined,
    setVolume: (_volume: number) => undefined,
    toggleShuffle: () => undefined,
    setRepeatMode: (_mode: AudioStoreState['repeatMode']) => undefined,
    setCrossfadeEnabled: (_enabled: boolean) => undefined,
    setCrossfadeDuration: (_duration: number) => undefined,
    play: () => undefined,
    pause: () => undefined,
    stop: () => undefined,
    next: () => undefined,
    previous: () => undefined,
    seek: (_position: number) => undefined
});

interface ServerConnectionState {
    serverUrl: string;
    isConnected: boolean;
    isConnecting: boolean;
    user: {
        id: string;
        name: string;
        imageUrl: string;
    } | null;
}

const createMockServerStore = (initialState?: Partial<ServerConnectionState>) => ({
    serverUrl: initialState?.serverUrl ?? 'https://demo.jellyfin.org',
    isConnected: initialState?.isConnected ?? true,
    isConnecting: initialState?.isConnecting ?? false,
    user: initialState?.user ?? {
        id: 'user-1',
        name: 'Demo User',
        imageUrl: ''
    },
    setServerUrl: (_url: string) => undefined,
    setConnected: (_connected: boolean) => undefined,
    setConnecting: (_connecting: boolean) => undefined,
    setUser: (_user: ServerConnectionState['user']) => undefined,
    connect: async () => undefined,
    disconnect: () => undefined
});

interface PlaybackState {
    isPlaying: boolean;
    currentItem: {
        id: string;
        name: string;
        type: 'audio' | 'video';
        position: number;
        duration: number;
    } | null;
    playerState: 'idle' | 'playing' | 'paused' | 'buffering';
}

const createMockPlaybackStore = (initialState?: Partial<PlaybackState>) => ({
    isPlaying: initialState?.isPlaying ?? false,
    currentItem: initialState?.currentItem ?? null,
    playerState: initialState?.playerState ?? 'idle',
    play: () => undefined,
    pause: () => undefined,
    stop: () => undefined,
    seek: (_position: number) => undefined,
    setCurrentItem: (_item: PlaybackState['currentItem']) => undefined,
    playItem: (_item: { id: string; type: 'audio' | 'video' }) => undefined
});

interface ThemeState {
    theme: 'dark' | 'light' | 'system';
    primaryColor: string;
}

const createMockThemeStore = (initialState?: Partial<ThemeState>) => ({
    theme: initialState?.theme ?? 'dark',
    primaryColor: initialState?.primaryColor ?? vars.colors.primary,
    setTheme: (_theme: ThemeState['theme']) => undefined,
    setPrimaryColor: (_color: string) => undefined
});

interface NotificationsState {
    notifications: Array<{
        id: string;
        type: 'success' | 'error' | 'warning' | 'info';
        message: string;
    }>;
}

const createMockNotificationsStore = (initialState?: Partial<NotificationsState>) => ({
    notifications: initialState?.notifications ?? [],
    addNotification: (_notification: Omit<NotificationsState['notifications'][0], 'id'>) => undefined,
    removeNotification: (_id: string) => undefined,
    clearNotifications: () => undefined
});

interface MockProvidersProps {
    children?: React.ReactNode;
    i18n?: boolean;
    audioStore?: Partial<AudioStoreState>;
    serverStore?: Partial<ServerConnectionState>;
    playbackStore?: Partial<PlaybackState>;
    themeStore?: Partial<ThemeState>;
    notificationsStore?: Partial<NotificationsState>;
}

interface StoryContextWithProviders {
    parameters: {
        providers?: MockProvidersProps;
    };
}

const MockContextProviders = ({
    children,
    audioStore,
    serverStore,
    playbackStore,
    themeStore,
    notificationsStore
}: MockProvidersProps) => {
    createMockAudioStore(audioStore);
    createMockServerStore(serverStore);
    createMockPlaybackStore(playbackStore);
    createMockThemeStore(themeStore);
    createMockNotificationsStore(notificationsStore);

    return (
        <div
            style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: vars.colors.text,
                backgroundColor: vars.colors.background,
                minHeight: '100vh'
            }}
        >
            {children}
        </div>
    );
};

const MockProviders = ({
    children,
    i18n: enableI18n = true,
    audioStore,
    serverStore,
    playbackStore,
    themeStore,
    notificationsStore
}: MockProvidersProps) => {
    const content = (
        <MockContextProviders
            audioStore={audioStore}
            serverStore={serverStore}
            playbackStore={playbackStore}
            themeStore={themeStore}
            notificationsStore={notificationsStore}
        >
            {children}
        </MockContextProviders>
    );

    return (
        <QueryClientProvider client={queryClient}>
            {enableI18n ? <I18nextProvider i18n={i18n}>{content}</I18nextProvider> : content}
        </QueryClientProvider>
    );
};

export const mockData = {
    audioTrack: {
        id: 'track-1',
        title: 'Bohemian Rhapsody',
        artist: 'Queen',
        album: 'A Night at the Opera',
        imageUrl: 'https://picsum.photos/seed/track1/400/400'
    },
    videoItem: {
        id: 'video-1',
        name: 'Sample Video',
        type: 'video' as const,
        position: 0,
        duration: 3600
    },
    user: {
        id: 'user-1',
        name: 'Demo User',
        imageUrl: 'https://picsum.photos/seed/user1/100/100'
    },
    server: {
        serverUrl: 'https://demo.jellyfin.org',
        isConnected: true,
        isConnecting: false,
        user: {
            id: 'user-1',
            name: 'Demo User',
            imageUrl: 'https://picsum.photos/seed/user1/100/100'
        }
    }
};

export const decorators = {
    withProviders: (Story: React.ComponentType, context: StoryContextWithProviders) => {
        const { audioStore, serverStore, playbackStore, themeStore, notificationsStore } = context.parameters.providers || {};
        return (
            <MockProviders
                audioStore={audioStore}
                serverStore={serverStore}
                playbackStore={playbackStore}
                themeStore={themeStore}
                notificationsStore={notificationsStore}
            >
                <Story />
            </MockProviders>
        );
    },
    withQueryClient: (Story: React.ComponentType) => (
        <QueryClientProvider client={queryClient}>
            <Story />
        </QueryClientProvider>
    ),
    withI18n: (Story: React.ComponentType) => (
        <I18nextProvider i18n={i18n}>
            <Story />
        </I18nextProvider>
    ),
    withDarkTheme: (Story: React.ComponentType) => (
        <div style={{ backgroundColor: vars.colors.background, minHeight: '100vh' }}>
            <Story />
        </div>
    ),
    withLightTheme: (Story: React.ComponentType) => (
        <div style={{ backgroundColor: '#ffffff', color: '#000000', minHeight: '100vh' }}>
            <Story />
        </div>
    ),
    withPlayingAudio: (Story: React.ComponentType) => (
        <MockProviders audioStore={{ isPlaying: true, currentTrack: mockData.audioTrack }}>
            <Story />
        </MockProviders>
    ),
    withConnectedServer: (Story: React.ComponentType) => (
        <MockProviders serverStore={mockData.server}>
            <Story />
        </MockProviders>
    )
};

export default MockProviders;
