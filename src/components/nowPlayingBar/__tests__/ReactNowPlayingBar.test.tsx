import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { NowPlayingBar } from '../ReactNowPlayingBar';

const {
    mockUseIsPlaying,
    mockUseCurrentItem,
    mockUseCurrentTime,
    mockUseDuration,
    mockUseVolume,
    mockUseIsMuted,
    mockUseRepeatMode,
    mockUseShuffleMode,
    mockUsePlaybackActions,
    mockUseQueueActions,
    mockUseFormattedTime,
    mockUseCurrentQueueIndex,
    mockUseCurrentPlayer,
    mockUseCrossfadeStore,
    mockOn,
    mockOff
} = vi.hoisted(() => ({
    mockUseIsPlaying: vi.fn(),
    mockUseCurrentItem: vi.fn(),
    mockUseCurrentTime: vi.fn(),
    mockUseDuration: vi.fn(),
    mockUseVolume: vi.fn(),
    mockUseIsMuted: vi.fn(),
    mockUseRepeatMode: vi.fn(),
    mockUseShuffleMode: vi.fn(),
    mockUsePlaybackActions: vi.fn(),
    mockUseQueueActions: vi.fn(),
    mockUseFormattedTime: vi.fn(),
    mockUseCurrentQueueIndex: vi.fn(),
    mockUseCurrentPlayer: vi.fn(),
    mockUseCrossfadeStore: vi.fn(),
    mockOn: vi.fn(),
    mockOff: vi.fn()
}));

vi.mock('../../../store', async () => {
    const actual = await vi.importActual('../../../store');
    return {
        ...actual,
        useIsPlaying: (...args: unknown[]) => mockUseIsPlaying(...args),
        useCurrentItem: (...args: unknown[]) => mockUseCurrentItem(...args),
        useCurrentTime: (...args: unknown[]) => mockUseCurrentTime(...args),
        useDuration: (...args: unknown[]) => mockUseDuration(...args),
        useVolume: (...args: unknown[]) => mockUseVolume(...args),
        useIsMuted: (...args: unknown[]) => mockUseIsMuted(...args),
        useRepeatMode: (...args: unknown[]) => mockUseRepeatMode(...args),
        useShuffleMode: (...args: unknown[]) => mockUseShuffleMode(...args),
        usePlaybackActions: (...args: unknown[]) => mockUsePlaybackActions(...args),
        useQueueActions: (...args: unknown[]) => mockUseQueueActions(...args),
        useFormattedTime: (...args: unknown[]) => mockUseFormattedTime(...args),
        useCurrentQueueIndex: (...args: unknown[]) => mockUseCurrentQueueIndex(...args),
        useCurrentPlayer: (...args: unknown[]) => mockUseCurrentPlayer(...args),
        useCrossfadeStore: (...args: unknown[]) => mockUseCrossfadeStore(...args),
    };
});

vi.mock('../../layoutManager', () => ({
    default: {
        mobile: false
    }
}));

vi.mock('../../../utils/events', () => ({
    default: {
        on: mockOn,
        off: mockOff
    }
}));

vi.mock('lib/jellyfin-apiclient');

vi.mock('../../../scripts/serverNotifications', () => ({
    default: {
        on: vi.fn()
    }
}));

vi.mock('../../router/appRouter', () => ({
    appRouter: {
        showNowPlaying: vi.fn()
    }
}));

describe('NowPlayingBar', () => {
    const mockCurrentItem = {
        id: 'test-id',
        serverId: 'server-1',
        name: 'Test Track',
        artist: 'Test Artist',
        imageUrl: 'http://test.com/artwork.jpg',
        isFavorite: false
    };

    const mockPlayer = {
        supportedCommands: ['AirPlay', 'SetRepeatMode']
    };

    const mockPlaybackActions = {
        togglePlayPause: vi.fn(),
        stop: vi.fn(),
        seek: vi.fn(),
        seekPercent: vi.fn(),
        setVolume: vi.fn(),
        toggleMute: vi.fn()
    };

    const mockQueueActions = {
        next: vi.fn(),
        previous: vi.fn(),
        toggleRepeatMode: vi.fn(),
        toggleShuffleMode: vi.fn()
    };
    const mockCrossfadeState = {
        enabled: true,
        duration: 5,
        busy: false,
        setEnabled: vi.fn(),
        syncFromEngine: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();

        mockUseIsPlaying.mockReturnValue(false);
        mockUseCurrentItem.mockReturnValue(mockCurrentItem);
        mockUseCurrentTime.mockReturnValue(30);
        mockUseDuration.mockReturnValue(180);
        mockUseVolume.mockReturnValue(75);
        mockUseIsMuted.mockReturnValue(false);
        mockUseRepeatMode.mockReturnValue('RepeatNone');
        mockUseShuffleMode.mockReturnValue('Off');
        mockUseCurrentQueueIndex.mockReturnValue(0);
        mockUseCurrentPlayer.mockReturnValue(mockPlayer);
        mockUseFormattedTime.mockReturnValue({
            currentTimeFormatted: '0:30',
            durationFormatted: '3:00'
        });
        mockUseCrossfadeStore.mockImplementation((selector: (state: typeof mockCrossfadeState) => unknown) => (
            selector(mockCrossfadeState)
        ));

        mockUsePlaybackActions.mockReturnValue(mockPlaybackActions);
        mockUseQueueActions.mockReturnValue(mockQueueActions);

        Object.defineProperty(window, 'location', {
            value: { hash: '' },
            writable: true
        });

        vi.spyOn(document, 'addEventListener').mockImplementation((event, handler) => {
            if (event === 'viewbeforeshow') {
                (window as any).viewbeforeshowHandler = handler;
            }
        });

        vi.spyOn(document, 'removeEventListener').mockImplementation(() => {});
    });

    it('renders when currentItem exists', () => {
        render(<NowPlayingBar />);
        expect(screen.getByText('Test Track')).toBeInTheDocument();
        expect(screen.getByText('Test Artist')).toBeInTheDocument();
    });

    it('does not render when currentItem is null', () => {
        mockUseCurrentItem.mockReturnValue(null);
        render(<NowPlayingBar />);
        expect(screen.queryByText('Test Track')).not.toBeInTheDocument();
    });

    it('displays play button when not playing', () => {
        mockUseIsPlaying.mockReturnValue(false);
        render(<NowPlayingBar />);
        expect(screen.getByLabelText('Play')).toBeInTheDocument();
    });

    it('displays pause button when playing', () => {
        mockUseIsPlaying.mockReturnValue(true);
        render(<NowPlayingBar />);
        expect(screen.getByLabelText('Pause')).toBeInTheDocument();
    });

    it('calls togglePlayPause when play button clicked', () => {
        render(<NowPlayingBar />);
        fireEvent.click(screen.getByLabelText('Play'));
        expect(mockPlaybackActions.togglePlayPause).toHaveBeenCalled();
    });

    it('displays correct time format', () => {
        render(<NowPlayingBar />);
        expect(screen.getByText(/0:30/)).toBeInTheDocument();
        expect(screen.getByText(/3:00/)).toBeInTheDocument();
    });

    it('shows repeat button', () => {
        render(<NowPlayingBar />);
        expect(screen.getByLabelText('Repeat')).toBeInTheDocument();
    });

    it('shows shuffle button', () => {
        render(<NowPlayingBar />);
        expect(screen.getByLabelText('Shuffle')).toBeInTheDocument();
    });

    it('shows stop button', () => {
        render(<NowPlayingBar />);
        expect(screen.getByLabelText('Stop')).toBeInTheDocument();
    });

    it('displays album artwork when imageUrl is present', () => {
        render(<NowPlayingBar />);
        const img = screen.getByAltText('Test Track');
        expect(img).toHaveAttribute('src', 'http://test.com/artwork.jpg');
    });

    it('displays placeholder icon when no imageUrl', () => {
        mockUseCurrentItem.mockReturnValue({
            ...mockCurrentItem,
            imageUrl: null
        });
        render(<NowPlayingBar />);
        expect(screen.getByTestId('nowPlayingBarPlaceholderIcon')).toBeInTheDocument();
    });

    it('registers layout change event listener on mount', () => {
        render(<NowPlayingBar />);
        expect(mockOn).toHaveBeenCalledWith(expect.any(Object), 'modechange', expect.any(Function));
    });
});
