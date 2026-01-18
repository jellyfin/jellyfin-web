import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getNowPlayingBarHtml, showNowPlayingBar, hideNowPlayingBar, onStateChanged, updateNowPlayingInfo, bindEvents, updatePlayPauseState, updateRepeatModeDisplay, updateTimeDisplay, onPlayPauseClick, updatePlayerVolumeState, updateLyricButton } from './nowPlayingBar';

// Mock dependencies
vi.mock('apps/stable/features/playback/utils/itemText', () => ({
    getItemTextLines: vi.fn(() => ['Test Title', 'Test Artist'])
}));

vi.mock('apps/stable/features/playback/utils/image', () => ({
    getImageUrl: vi.fn(() => 'test-image-url')
}));

vi.mock('components/router/appRouter', () => ({
    appRouter: { showNowPlaying: vi.fn() },
    isLyricsPage: vi.fn(() => false)
}));

vi.mock('constants/appFeature', () => ({
    AppFeature: { PhysicalVolumeControl: 'PhysicalVolumeControl' }
}));

vi.mock('lib/jellyfin-apiclient', () => ({
    ServerConnections: { 
        getApiClient: vi.fn(() => ({ getItem: vi.fn() })),
        getApiClients: vi.fn(() => [])
    }
}));

vi.mock('scripts/datetime', () => ({
    default: { getDisplayRunningTime: vi.fn(() => '1:23') }
}));

vi.mock('utils/events', () => ({
    default: { on: vi.fn(), off: vi.fn(), trigger: vi.fn() }
}));

vi.mock('scripts/browser', () => ({
    default: { mobile: false, tv: false }
}));

vi.mock('components/images/imageLoader', () => ({
    lazyImage: vi.fn()
}));

vi.mock('components/layoutManager', () => ({
    default: { mobile: false, tv: false }
}));

vi.mock('components/playback/playbackmanager', () => ({
    playbackManager: {
        getCurrentPlayer: vi.fn(() => ({ isLocalPlayer: true, duration: vi.fn(() => 1000) })),
        getPlayerInfo: vi.fn(() => ({ supportedCommands: ['SetRepeatMode'] })),
        getPlayerState: vi.fn(() => ({ NowPlayingItem: { Id: '1', Name: 'Test Song', MediaType: 'Audio' }, PositionTicks: 50000000, PlayState: { IsPaused: false } })),
        playPause: vi.fn(),
        nextTrack: vi.fn(),
        previousTrack: vi.fn(),
        stop: vi.fn(),
        setRepeatMode: vi.fn(),
        toggleQueueShuffleMode: vi.fn(),
        seekPercent: vi.fn()
    }
}));

vi.mock('components/audioEngine/crossfader.logic', () => ({
    synchronizeVolumeUI: vi.fn(),
    destroyWaveSurferInstance: vi.fn(() => Promise.resolve()),
    waveSurferInitialization: vi.fn(() => Promise.resolve())
}));

vi.mock('components/apphost', () => ({
    safeAppHost: {},
    appHost: { supports: vi.fn(() => false) }
}));

vi.mock('utils/dom', async (importOriginal) => {
    const actual: any = await importOriginal();
    return {
        default: {
            ...actual.default,
            parentWithTag: vi.fn(() => null)
        }
    };
});

vi.mock('lib/globalize', () => ({
    default: { translate: vi.fn((key: string) => key) }
}));

vi.mock('components/itemContextMenu', () => ({
    show: vi.fn(() => Promise.resolve())
}));

vi.mock('components/appFooter/appFooter', () => ({
    default: {
        element: {
            insertAdjacentHTML: vi.fn(),
            querySelector: vi.fn((selector: string) => {
                if (selector === '.nowPlayingBar') {
                    return {
                        classList: { add: vi.fn(), remove: vi.fn(), contains: vi.fn(() => false) },
                        querySelector: vi.fn((sel: string) => ({
                            classList: { add: vi.fn(), remove: vi.fn(), contains: vi.fn(() => false) },
                            querySelector: vi.fn(() => ({ className: '' })),
                            addEventListener: vi.fn(),
                            style: {},
                            innerHTML: '',
                            className: ''
                        })),
                        querySelectorAll: vi.fn(() => [{
                            addEventListener: vi.fn(),
                            classList: { add: vi.fn(), remove: vi.fn(), contains: vi.fn(() => false) }
                        }]),
                        addEventListener: vi.fn()
                    };
                }
                return null;
            })
        }
    }
}));

vi.mock('components/shortcuts', () => ({
    default: { on: vi.fn() }
}));

vi.mock('components/toast/toast', () => ({}));

// Mock document and window
Object.defineProperty(window, 'CustomElements', {
    value: { upgradeSubtree: vi.fn() },
    writable: true
});

Object.defineProperty(document, 'addEventListener', {
    value: vi.fn(),
    writable: true
});

// Import after mocks
import * as nowPlayingBar from './nowPlayingBar';

describe('nowPlayingBar', () => {
    let mockElement: HTMLElement;
    let mockPlayer: any;

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();

        // Mock DOM elements
        mockElement = {
            classList: {
                add: vi.fn(),
                remove: vi.fn(),
                toggle: vi.fn(),
                contains: vi.fn(() => false)
            },
            querySelector: vi.fn((selector: string) => {
                if (selector === '.nowPlayingBar') return mockElement;
                return null;
            }),
            querySelectorAll: vi.fn(() => []),
            addEventListener: vi.fn(),
            insertAdjacentHTML: vi.fn(),
            style: {},
            innerHTML: ''
        } as any;

        mockPlayer = {
            isLocalPlayer: true,
            duration: vi.fn(() => 1000),
            getPlayerState: vi.fn(() => ({
                NowPlayingItem: { Id: '1', Name: 'Test Song', MediaType: 'Audio' },
                PositionTicks: 50000000,
                PlayState: { IsPaused: false }
            }))
        };

        // Mock document.getElementsByClassName
        document.getElementsByClassName = vi.fn(() => [mockElement] as any);

        // Mock the element variables
        (nowPlayingBar as any).toggleRepeatButton = { classList: { add: vi.fn(), remove: vi.fn() } };
        (nowPlayingBar as any).currentTimeElement = { innerHTML: '' };
        (nowPlayingBar as any).positionSlider = { value: 0 };
        (nowPlayingBar as any).muteButton = { querySelector: vi.fn(() => ({ className: '' })) };
        (nowPlayingBar as any).playPauseButtons = [{ addEventListener: vi.fn() }];
        (nowPlayingBar as any).lyricButton = { classList: { remove: vi.fn(), add: vi.fn() } };
    });

    describe('getNowPlayingBar', () => {
        it('should create and return the nowPlayingBar element', () => {
            const result = (nowPlayingBar as any).getNowPlayingBar();
            expect(result).toBeDefined();
        });
    });

    describe('showNowPlayingBar', () => {
        it('should show the bar when visibility is allowed', () => {
            (nowPlayingBar as any).isVisibilityAllowed = true;
            (nowPlayingBar as any).showNowPlayingBar();
            expect(mockElement.classList.remove).toHaveBeenCalledWith('nowPlayingBar-hidden');
        });

        it('should hide the bar when visibility is not allowed', () => {
            (nowPlayingBar as any).isVisibilityAllowed = false;
            (nowPlayingBar as any).showNowPlayingBar();
            expect((nowPlayingBar as any).hideNowPlayingBar).toHaveBeenCalled();
        });
    });

    describe('hideNowPlayingBar', () => {
        it('should hide the bar and set enabled to false', () => {
            (nowPlayingBar as any).hideNowPlayingBar();
            expect((nowPlayingBar as any).isEnabled).toBe(false);
            expect(mockElement.classList.add).toHaveBeenCalledWith('nowPlayingBar-hidden');
        });
    });

    describe('onStateChanged', () => {
        it('should hide bar when no NowPlayingItem', () => {
            const state = {};
            (nowPlayingBar as any).onStateChanged(mockPlayer, state);
            expect((nowPlayingBar as any).hideNowPlayingBar).toHaveBeenCalled();
        });

        it('should hide bar for video on local player', () => {
            const state = {
                NowPlayingItem: { MediaType: 'Video' }
            };
            mockPlayer.isLocalPlayer = true;
            (nowPlayingBar as any).onStateChanged(mockPlayer, state);
            expect((nowPlayingBar as any).hideNowPlayingBar).toHaveBeenCalled();
        });

        it('should show bar for audio', () => {
            const state = {
                NowPlayingItem: { MediaType: 'Audio' }
            };
            (nowPlayingBar as any).isVisibilityAllowed = true;
            (nowPlayingBar as any).onStateChanged(mockPlayer, state);
            expect((nowPlayingBar as any).updatePlayerStateInternal).toHaveBeenCalled();
        });
    });

    describe('updateNowPlayingInfo', () => {
        it('should update the UI with track information', () => {
            const state = {
                NowPlayingItem: {
                    Id: '1',
                    Name: 'Test Song',
                    Album: 'Test Album',
                    Artists: [{ Name: 'Test Artist' }]
                }
            };
            (nowPlayingBar as any).updateNowPlayingInfo(state);
            expect(mockElement.innerHTML).toContain('Test Song');
        });
    });

    describe('bindEvents', () => {
        it('should bind event listeners to buttons', () => {
            mockElement.querySelector = vi.fn((selector: string) => {
                if (selector === '.playPauseButton') return mockElement;
                return null;
            });
            mockElement.querySelectorAll = vi.fn(() => [mockElement] as any);

            (nowPlayingBar as any).bindEvents(mockElement);
            expect(mockElement.addEventListener).toHaveBeenCalled();
        });
    });

    describe('getNowPlayingBarHtml', () => {
        it('should return valid HTML string', () => {
            const html = (nowPlayingBar as any).getNowPlayingBarHtml();
            expect(typeof html).toBe('string');
            expect(html).toContain('nowPlayingBar');
            expect(html).toContain('playPauseButton');
            expect(html).toContain('nowPlayingBarPositionSlider');
        });
    });

    describe('updatePlayPauseState', () => {
        it('should update button text based on pause state', () => {
            const button = { querySelector: vi.fn(() => ({ className: '', innerText: '' })) };
            (nowPlayingBar as any).playPauseButtons = [button];

            (nowPlayingBar as any).updatePlayPauseState(true);
            expect(button.querySelector).toHaveBeenCalledWith('.material-icons');
        });
    });

    describe('updateRepeatModeDisplay', () => {
        it('should update repeat button icon', () => {
            const button = { querySelector: vi.fn(() => ({ className: '' })) };
            (nowPlayingBar as any).toggleRepeatButton = button;
            (nowPlayingBar as any).toggleRepeatButtonIcon = { className: '' };

            (nowPlayingBar as any).updateRepeatModeDisplay('RepeatAll');
            expect(button.querySelector).toHaveBeenCalled();
        });
    });

    describe('updateTimeDisplay', () => {
        it('should update time elements', () => {
            (nowPlayingBar as any).currentTimeElement = { innerHTML: '' };
            (nowPlayingBar as any).positionSlider = { value: 0 };

            (nowPlayingBar as any).updateTimeDisplay(10000000, 20000000, []);
            expect((nowPlayingBar as any).currentTimeElement.innerHTML).toBeTruthy();
        });
    });

    describe('onPlayPauseClick', () => {
        it('should call playbackManager.playPause', () => {
            const mockPlaybackManager = require('components/playback/playbackmanager').playbackManager;
            (nowPlayingBar as any).currentPlayer = mockPlayer;

            (nowPlayingBar as any).onPlayPauseClick();
            expect(mockPlaybackManager.playPause).toHaveBeenCalledWith(mockPlayer);
        });
    });

    describe('WaveSurfer integration', () => {
        it('should initialize WaveSurfer for local players', async () => {
            const mockWaveSurfer = require('components/audioEngine/crossfader.logic');
            (nowPlayingBar as any).currentPlayer = mockPlayer;
            (nowPlayingBar as any).isVisibilityAllowed = true;

            await (nowPlayingBar as any).showNowPlayingBar();
            expect(mockWaveSurfer.destroyWaveSurferInstance).toHaveBeenCalled();
            expect(mockWaveSurfer.waveSurferInitialization).toHaveBeenCalled();
        });
    });

    describe('updatePlayerVolumeState', () => {
        it('should update mute button icon', () => {
            const button = { querySelector: vi.fn(() => ({ className: '' })) };
            (nowPlayingBar as any).muteButton = button;

            (nowPlayingBar as any).updatePlayerVolumeState(true, 50);
            expect(button.querySelector).toHaveBeenCalledWith('.material-icons');
        });
    });

    describe('updateLyricButton', () => {
        it('should show/hide lyric button based on item', () => {
            const button = { classList: { remove: vi.fn(), add: vi.fn() } };
            (nowPlayingBar as any).lyricButton = button;

            (nowPlayingBar as any).updateLyricButton({ HasLyrics: true });
            expect(button.classList.remove).toHaveBeenCalledWith('hide');
        });
    });
});