import { describe, expect, it, vi } from 'vitest';
import { resetSrc } from './htmlMediaHelper';

vi.mock('../scripts/settings/appSettings', () => ({ default: {} }));
vi.mock('../scripts/browser', () => ({ default: {} }));

function createVideo(mode = 'picture-in-picture') {
    const video = document.createElement('video');
    video.src = 'https://example.com/episode.m3u8';
    video.innerHTML = '<track src="subtitles.vtt">';
    const setPresentationMode = vi.fn();
    Object.defineProperties(video, {
        webkitPresentationMode: { value: mode, writable: true },
        webkitSetPresentationMode: { value: setPresentationMode, configurable: true }
    });
    return { video, setPresentationMode };
}

describe('resetSrc', () => {
    it('leaves Safari PiP while the source and subtitle tracks are still attached', () => {
        const { video, setPresentationMode } = createVideo();
        setPresentationMode.mockImplementation(() => {
            expect(video.getAttribute('src')).toBe('https://example.com/episode.m3u8');
            expect(video.querySelector('track')).not.toBeNull();
        });

        resetSrc(video);

        expect(setPresentationMode).toHaveBeenCalledExactlyOnceWith('inline');
        expect(video.hasAttribute('src')).toBe(false);
        expect(video.childElementCount).toBe(0);
    });

    it.each(['inline', 'fullscreen'])('does not change Safari %s presentation', mode => {
        const { video, setPresentationMode } = createVideo(mode);

        resetSrc(video);

        expect(setPresentationMode).not.toHaveBeenCalled();
        expect(video.hasAttribute('src')).toBe(false);
        expect(video.childElementCount).toBe(0);
    });

    it('cleans up even if the native PiP exit throws', () => {
        const { video, setPresentationMode } = createVideo();
        const error = new Error('Native presentation failed');
        setPresentationMode.mockImplementation(() => {
            throw error;
        });
        const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        expect(() => resetSrc(video)).not.toThrow();

        expect(log).toHaveBeenCalledWith(expect.any(String), error);
        expect(video.hasAttribute('src')).toBe(false);
        expect(video.childElementCount).toBe(0);
    });

    it('cleans up when the WebKit presentation setter is unavailable', () => {
        const { video } = createVideo();
        Object.defineProperty(video, 'webkitSetPresentationMode', { value: undefined });

        expect(() => resetSrc(video)).not.toThrow();

        expect(video.hasAttribute('src')).toBe(false);
    });

    it.each(['audio', 'video'])('preserves ordinary %s source cleanup without WebKit APIs', tag => {
        const media = document.createElement(tag) as HTMLMediaElement;
        media.src = 'https://example.com/media';
        media.innerHTML = '<source src="alternate">';

        resetSrc(media);

        expect(media.hasAttribute('src')).toBe(false);
        expect(media.childElementCount).toBe(0);
    });

    it('releases native PiP on successive episode source resets', () => {
        const { video, setPresentationMode } = createVideo();
        setPresentationMode.mockImplementation(mode => {
            Object.assign(video, { webkitPresentationMode: mode });
        });
        resetSrc(video);
        video.src = 'https://example.com/next-episode.m3u8';
        Object.assign(video, { webkitPresentationMode: 'picture-in-picture' });
        resetSrc(video);

        expect(setPresentationMode).toHaveBeenNthCalledWith(1, 'inline');
        expect(setPresentationMode).toHaveBeenNthCalledWith(2, 'inline');
        expect(video.hasAttribute('src')).toBe(false);
    });
});
