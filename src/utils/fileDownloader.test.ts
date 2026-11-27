import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { download } from './fileDownloader';

const mocks = vi.hoisted(() => ({
    downloadFiles: vi.fn(),
    multiDownload: vi.fn(),
    getApi: vi.fn(),
    getItems: vi.fn(),
    getSubtitle: vi.fn()
}));

vi.mock('scripts/shell', () => ({ default: { downloadFiles: mocks.downloadFiles } }));
vi.mock('scripts/multiDownload', () => ({ default: mocks.multiDownload }));
vi.mock('lib/jellyfin-apiclient', () => ({ ServerConnections: { getApi: mocks.getApi } }));
vi.mock('lib/jellyfin-apiclient/utils/getItems', () => ({ getItems: mocks.getItems }));
vi.mock('@jellyfin/sdk/lib/utils/api/subtitle-api', () => ({
    getSubtitleApi: () => ({ getSubtitle: mocks.getSubtitle })
}));

const video: NativeShellDownloadItem = {
    url: 'https://server/Items/video/Download',
    itemId: 'video',
    serverId: 'server',
    filename: 'Movie.mp4',
    item: { Id: 'video', MediaType: 'Video' }
};

const details: BaseItemDto = {
    Id: 'video',
    Path: '/media/Movie.mp4',
    MediaSources: [{
        Id: 'alternate',
        Path: '/media/Movie-alternate.mp4',
        MediaStreams: [{ Type: 'Subtitle', IsExternal: true, Index: 1, Path: '/media/Other.srt' }]
    }, {
        Id: 'source',
        Path: '/media/Movie.mp4',
        MediaStreams: [
            { Type: 'Subtitle', IsExternal: true, Index: 0, Path: '/media/Movie.en.srt' },
            { Type: 'Subtitle', IsExternal: true, Index: 3, Path: 'C:\\media\\Movie.it.forced.SRT' },
            { Type: 'Subtitle', IsExternal: false, Index: 4, Codec: 'subrip' },
            { Type: 'Subtitle', IsExternal: true, Index: 5, Path: '/media/Movie.ass' },
            { Type: 'Audio', IsExternal: true, Index: 6, Path: '/media/Not-subtitles.srt' }
        ]
    }]
};

describe('download', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mocks.downloadFiles.mockReturnValue(false);
        mocks.getApi.mockReturnValue({});
        mocks.getItems.mockResolvedValue({ Items: [details] });
        mocks.getSubtitle.mockResolvedValue({ data: new Blob(['subtitle content']) });
        vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:subtitle');
        vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => { /* no-op */ });
    });

    it('downloads all external SRT companions from the downloaded source with their filenames', async () => {
        await download([video]);

        expect(mocks.multiDownload).toHaveBeenCalledWith([video.url]);
        expect(mocks.getItems).toHaveBeenCalledWith({}, {
            ids: ['video'],
            fields: ['MediaSources', 'Path']
        });
        expect(mocks.getSubtitle.mock.calls).toEqual([0, 3].map(routeIndex => [{
            routeItemId: 'video',
            routeMediaSourceId: 'source',
            routeIndex,
            routeFormat: 'srt'
        }, { responseType: 'blob' }]));
        expect(mocks.multiDownload).toHaveBeenNthCalledWith(2, [{ url: 'blob:subtitle', filename: 'Movie.en.srt' }]);
        expect(mocks.multiDownload).toHaveBeenNthCalledWith(3, [{ url: 'blob:subtitle', filename: 'Movie.it.forced.SRT' }]);
        expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
        expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
    });

    it('leaves native downloads unchanged to avoid duplicate subtitles', async () => {
        mocks.downloadFiles.mockReturnValue(true);

        await download([video]);

        expect(mocks.downloadFiles).toHaveBeenCalledWith([video]);
        expect(mocks.multiDownload).not.toHaveBeenCalled();
        expect(mocks.getItems).not.toHaveBeenCalled();
    });

    it('starts the video download before fast subtitle responses can trigger a download', async () => {
        const { default: realMultiDownload } = await vi.importActual<typeof import('scripts/multiDownload')>('scripts/multiDownload');
        mocks.multiDownload.mockImplementation(realMultiDownload);
        const localVideo = { ...video, url: `${document.location.origin}/Items/video/Download` };
        const links: string[] = [];
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
            links.push(this.href);
        });
        vi.useFakeTimers();
        try {
            const pending = download([localVideo]);
            await vi.runAllTimersAsync();
            await pending;

            expect(links).toEqual([localVideo.url, 'blob:subtitle', 'blob:subtitle']);
        } finally {
            vi.useRealTimers();
        }
    });

    it('keeps non-video downloads unchanged', async () => {
        await download([{ url: 'https://server/photo', item: { MediaType: 'Photo' } }]);

        expect(mocks.multiDownload).toHaveBeenCalledWith(['https://server/photo']);
        expect(mocks.getItems).not.toHaveBeenCalled();
    });

    it('downloads only the video when there are no external SRT subtitles', async () => {
        mocks.getItems.mockResolvedValue({
            Items: [{ ...details, MediaSources: [{ Id: 'source', Path: details.Path, MediaStreams: [] }] }]
        });

        await download([video]);

        expect(mocks.multiDownload).toHaveBeenCalledWith([video.url]);
        expect(mocks.getSubtitle).not.toHaveBeenCalled();
    });

    it.each(['metadata', 'subtitle'])('reports %s failures without preventing the video download', async failure => {
        const error = new Error('Download failed');
        const log = vi.spyOn(console, 'error').mockImplementation(() => { /* silence */ });
        if (failure === 'metadata') {
            mocks.getItems.mockRejectedValue(error);
        } else {
            mocks.getSubtitle.mockRejectedValue(error);
        }

        await download([video]);

        expect(mocks.multiDownload).toHaveBeenCalledWith([video.url]);
        if (failure === 'metadata') {
            expect(log).toHaveBeenCalledWith('[fileDownloader] Failed to download subtitles for item', 'video', error);
        } else {
            expect(log).toHaveBeenCalledWith('[fileDownloader] Failed to download subtitle', 0, 'for item', 'video', error);
        }
        expect(URL.createObjectURL).not.toHaveBeenCalled();
    });

    it('serializes subtitle transfers across a 24-episode batch', async () => {
        const { default: realMultiDownload } = await vi.importActual<typeof import('scripts/multiDownload')>('scripts/multiDownload');
        mocks.multiDownload.mockImplementation(realMultiDownload);
        const episodes = Array.from({ length: 24 }, (_, i) => ({
            ...video,
            url: `https://server/Items/episode-${i}/Download`,
            itemId: `episode-${i}`
        }));
        mocks.getItems.mockImplementation(async () => ({
            Items: [{
                ...details,
                MediaSources: [{
                    Id: 'source',
                    Path: details.Path,
                    MediaStreams: [{ Type: 'Subtitle', IsExternal: true, Index: 0, Path: '/media/Episode.srt' }]
                }]
            }]
        }));
        let activeRequests = 0;
        let peakRequests = 0;
        mocks.getSubtitle.mockImplementation(() => {
            activeRequests++;
            peakRequests = Math.max(peakRequests, activeRequests);
            return new Promise(resolve => setTimeout(() => {
                activeRequests--;
                resolve({ data: new Blob(['subtitle content']) });
            }, 10));
        });
        const clickTimes: number[] = [];
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
            clickTimes.push(Date.now());
        });
        vi.useFakeTimers();
        try {
            const pending = download(episodes);
            await vi.runAllTimersAsync();
            await pending;

            expect(mocks.getItems).toHaveBeenCalledTimes(24);
            expect(mocks.getSubtitle).toHaveBeenCalledTimes(24);
            expect(peakRequests).toBe(1);
            expect(clickTimes).toHaveLength(24);
            expect(clickTimes.slice(1).every((time, i) => time - clickTimes[i] >= 100)).toBe(true);
        } finally {
            document.querySelectorAll('iframe').forEach(frame => {
                frame.remove();
            });
            vi.useRealTimers();
        }
    });

    it('continues downloading companions after one subtitle request fails', async () => {
        const error = new Error('Subtitle failed');
        mocks.getSubtitle.mockRejectedValueOnce(error);
        const log = vi.spyOn(console, 'error').mockImplementation(() => { /* silence */ });

        await download([video]);

        expect(log).toHaveBeenCalledWith('[fileDownloader] Failed to download subtitle', 0, 'for item', 'video', error);
        expect(mocks.multiDownload).toHaveBeenCalledWith([{ url: 'blob:subtitle', filename: 'Movie.it.forced.SRT' }]);
    });

    it('does not download subtitles belonging to a different media source', async () => {
        mocks.getItems.mockResolvedValue({ Items: [{ ...details, MediaSources: [details.MediaSources![0]] }] });
        const log = vi.spyOn(console, 'error').mockImplementation(() => { /* silence */ });

        await download([video]);

        expect(mocks.getSubtitle).not.toHaveBeenCalled();
        expect(log).toHaveBeenCalledWith(
            '[fileDownloader] Failed to download subtitles for item',
            'video',
            expect.any(Error)
        );
    });
});
