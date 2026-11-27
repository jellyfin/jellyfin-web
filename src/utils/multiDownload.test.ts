import { afterEach, describe, expect, it, vi } from 'vitest';

import multiDownload from 'scripts/multiDownload';

vi.mock('scripts/browser', () => ({ default: { iOS: false } }));

afterEach(() => {
    document.querySelectorAll('iframe').forEach(frame => {
        frame.remove();
    });
    vi.useRealTimers();
});

describe('multiDownload', () => {
    it('isolates 24 cross-origin downloads so their navigations cannot replace one another', async () => {
        const urls = Array.from({ length: 24 }, (_, i) => `https://server/Items/episode-${i}/Download`);
        vi.useFakeTimers();

        const pending = multiDownload(urls);
        await vi.runAllTimersAsync();
        await pending;

        const frames = Array.from(document.querySelectorAll('iframe'));
        expect(frames.map(frame => frame.src)).toEqual(urls);
    });

    it('preserves blob filenames and resolves only after the paced download clicks', async () => {
        const downloads = [
            { url: 'blob:subtitle-1', filename: 'Episode.en.srt' },
            { url: 'blob:subtitle-2', filename: 'Episode.it.forced.srt' }
        ];
        const links: { url: string; filename: string; time: number }[] = [];
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
            links.push({ url: this.href, filename: this.download, time: Date.now() });
        });
        vi.useFakeTimers();
        let resolved = false;

        const pending = multiDownload(downloads)?.then(() => {
            resolved = true;
        });
        await vi.advanceTimersByTimeAsync(100);
        expect(links).toHaveLength(1);
        expect(resolved).toBe(false);
        await vi.advanceTimersByTimeAsync(100);
        await pending;

        expect(links.map(({ url, filename }) => ({ url, filename }))).toEqual(downloads);
        expect(links[1].time - links[0].time).toBe(100);
        expect(resolved).toBe(true);
    });
});
