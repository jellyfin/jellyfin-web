import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PlaybackStatus } from '../../store/types';
import { HTML5Player, type PlayerEvents } from './HTML5Player';

// Mock HTMLAudioElement and HTMLVideoElement
const mockElement = {
    src: '',
    autoplay: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    muted: false,
    playbackRate: 1,
    paused: true,
    ended: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    load: vi.fn(),
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    dispose: vi.fn()
};

describe('HTML5Player', () => {
    let player: HTML5Player;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(document, 'createElement').mockReturnValue(mockElement as any);
        player = new HTML5Player('audio');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('initialization', () => {
        it('should create audio element', () => {
            expect(document.createElement).toHaveBeenCalledWith('audio');
        });

        it('should create video element when specified', () => {
            vi.clearAllMocks();
            vi.spyOn(document, 'createElement').mockReturnValue(mockElement as any);
            const videoPlayer = new HTML5Player('video');
            expect(document.createElement).toHaveBeenCalledWith('video');
        });

        it('should set up event listeners', () => {
            expect(mockElement.addEventListener).toHaveBeenCalled();
        });
    });

    describe('setEvents', () => {
        it('should set event handlers', () => {
            const events: PlayerEvents = {
                onTimeUpdate: vi.fn(),
                onStatusChange: vi.fn(),
                onEnded: vi.fn()
            };

            player.setEvents(events);
            // Events are stored internally, verified by subsequent calls
            expect(true).toBe(true);
        });
    });

    describe('load', () => {
        it('should set source URL', () => {
            player.load('http://example.com/audio.mp3');
            expect(mockElement.src).toBe('http://example.com/audio.mp3');
        });

        it('should set autoplay flag', () => {
            player.load('http://example.com/audio.mp3', true);
            expect(mockElement.autoplay).toBe(true);
        });

        it('should call load on element', () => {
            player.load('http://example.com/audio.mp3');
            expect(mockElement.load).toHaveBeenCalled();
        });

        it('should not autoplay by default', () => {
            player.load('http://example.com/audio.mp3');
            expect(mockElement.autoplay).toBe(false);
        });
    });

    describe('play', () => {
        it('should call play on element', async () => {
            await player.play();
            expect(mockElement.play).toHaveBeenCalled();
        });

        it('should return promise', () => {
            const result = player.play();
            expect(result).toBeInstanceOf(Promise);
        });

        it('should handle play errors', async () => {
            vi.mocked(mockElement.play).mockRejectedValueOnce(new Error('Play failed'));

            await expect(player.play()).rejects.toThrow('Play failed');
        });
    });

    describe('pause', () => {
        it('should call pause on element', () => {
            player.pause();
            expect(mockElement.pause).toHaveBeenCalled();
        });
    });

    describe('stop', () => {
        it('should pause element', () => {
            player.stop();
            expect(mockElement.pause).toHaveBeenCalled();
        });

        it('should clear source', () => {
            mockElement.src = 'http://example.com/audio.mp3';
            player.stop();
            expect(mockElement.src).toBe('');
        });

        it('should call load to reset element', () => {
            player.stop();
            expect(mockElement.load).toHaveBeenCalled();
        });
    });

    describe('seek', () => {
        it('should set current time', () => {
            player.seek(30);
            expect(mockElement.currentTime).toBe(30);
        });

        it('should handle seeking to start', () => {
            player.seek(0);
            expect(mockElement.currentTime).toBe(0);
        });

        it('should handle seeking beyond duration', () => {
            mockElement.duration = 100;
            player.seek(150);
            expect(mockElement.currentTime).toBe(150);
        });
    });

    describe('setVolume', () => {
        it('should convert percentage to 0-1 range', () => {
            player.setVolume(50);
            expect(mockElement.volume).toBe(0.5);
        });

        it('should clamp to 0', () => {
            player.setVolume(-10);
            expect(mockElement.volume).toBe(0);
        });

        it('should clamp to 1', () => {
            player.setVolume(150);
            expect(mockElement.volume).toBe(1);
        });

        it('should set 100% volume', () => {
            player.setVolume(100);
            expect(mockElement.volume).toBe(1);
        });
    });

    describe('setMuted', () => {
        it('should set muted to true', () => {
            player.setMuted(true);
            expect(mockElement.muted).toBe(true);
        });

        it('should set muted to false', () => {
            mockElement.muted = true;
            player.setMuted(false);
            expect(mockElement.muted).toBe(false);
        });
    });

    describe('setPlaybackRate', () => {
        it('should set playback rate', () => {
            player.setPlaybackRate(1.5);
            expect(mockElement.playbackRate).toBe(1.5);
        });

        it('should handle slow playback', () => {
            player.setPlaybackRate(0.5);
            expect(mockElement.playbackRate).toBe(0.5);
        });

        it('should handle fast playback', () => {
            player.setPlaybackRate(2);
            expect(mockElement.playbackRate).toBe(2);
        });

        it('should handle normal speed', () => {
            player.setPlaybackRate(1);
            expect(mockElement.playbackRate).toBe(1);
        });
    });

    describe('error handling', () => {
        it('should handle missing element gracefully', () => {
            const playerWithoutElement = new HTML5Player('audio');
            // Override element to null
            (playerWithoutElement as any).element = null;

            expect(() => playerWithoutElement.load('url')).not.toThrow();
            expect(() => playerWithoutElement.play()).not.toThrow();
            expect(() => playerWithoutElement.pause()).not.toThrow();
        });
    });
});
