import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { downloadToDirectory, sanitizeFileName, supportsDirectoryDownload } from './directoryDownload';

/** Minimal in-memory stand-in for a FileSystemDirectoryHandle */
class FakeDirectory {
    directories = new Map<string, FakeDirectory>();
    files = new Map<string, string>();

    getDirectoryHandle(name: string) {
        let directory = this.directories.get(name);
        if (!directory) {
            directory = new FakeDirectory();
            this.directories.set(name, directory);
        }
        return Promise.resolve(directory);
    }

    getFileHandle(name: string) {
        return Promise.resolve({
            createWritable: () => {
                let contents = '';
                // eslint-disable-next-line compat/compat
                return Promise.resolve(new WritableStream<Uint8Array>({
                    write: chunk => {
                        contents += String.fromCharCode(...chunk);
                    },
                    close: () => {
                        this.files.set(name, contents);
                    }
                }));
            }
        });
    }
}

const asHandle = (directory: FakeDirectory) => directory as unknown as FileSystemDirectoryHandle;

describe('Utils: directoryDownload', () => {
    describe('sanitizeFileName()', () => {
        it('should replace characters that are invalid in file names', () => {
            expect(sanitizeFileName('AC/DC: Live <1991>?')).toBe('AC_DC_ Live _1991__');
            expect(sanitizeFileName('a\\b|c*d"e')).toBe('a_b_c_d_e');
        });

        it('should remove trailing periods and spaces', () => {
            expect(sanitizeFileName('Collection... ')).toBe('Collection');
        });

        it('should leave valid names unchanged', () => {
            expect(sanitizeFileName('The Lord of the Rings Collection')).toBe('The Lord of the Rings Collection');
        });
    });

    describe('supportsDirectoryDownload()', () => {
        afterEach(() => {
            delete window.showDirectoryPicker;
        });

        it('should return false when the directory picker is unavailable', () => {
            expect(supportsDirectoryDownload()).toBe(false);
        });

        it('should return true when the directory picker is available', () => {
            window.showDirectoryPicker = vi.fn();
            expect(supportsDirectoryDownload()).toBe(true);
        });
    });

    describe('downloadToDirectory()', () => {
        let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

        beforeEach(() => {
            fetchMock = vi.fn<typeof fetch>();
            vi.stubGlobal('fetch', fetchMock);
            vi.spyOn(console, 'error').mockImplementation(() => { /* expected errors */ });
        });

        afterEach(() => {
            vi.unstubAllGlobals();
        });

        it('should save each file in its folders', async () => {
            fetchMock.mockImplementation(url => Promise.resolve(new Response(`contents of ${String(url)}`)));
            const root = new FakeDirectory();

            const failed = await downloadToDirectory(asHandle(root), [
                { url: 'https://server/1', filename: 'Movie One.mkv', folders: [ 'My Collection' ] },
                { url: 'https://server/2', filename: 'Movie Two.mkv', folders: [ 'My Collection' ] },
                { url: 'https://server/3', filename: 'Episode.mkv', folders: [ 'Show', 'Season 1' ] }
            ]);

            expect(failed).toEqual([]);
            expect(root.files.size).toBe(0);

            const collection = root.directories.get('My Collection');
            expect(collection?.files.get('Movie One.mkv')).toBe('contents of https://server/1');
            expect(collection?.files.get('Movie Two.mkv')).toBe('contents of https://server/2');

            const season = root.directories.get('Show')?.directories.get('Season 1');
            expect(season?.files.get('Episode.mkv')).toBe('contents of https://server/3');
        });

        it('should save files in the chosen directory when there are no folders', async () => {
            fetchMock.mockResolvedValue(new Response('data'));
            const root = new FakeDirectory();

            await downloadToDirectory(asHandle(root), [ { url: 'https://server/1', filename: 'file.mkv' } ]);

            expect(root.files.get('file.mkv')).toBe('data');
        });

        it('should sanitize folder names', async () => {
            fetchMock.mockResolvedValue(new Response('data'));
            const root = new FakeDirectory();

            await downloadToDirectory(asHandle(root), [
                { url: 'https://server/1', filename: 'file.mkv', folders: [ 'AC/DC' ] }
            ]);

            expect(root.directories.get('AC_DC')?.files.get('file.mkv')).toBe('data');
        });

        it('should continue after a failed download and return the failures', async () => {
            fetchMock
                .mockResolvedValueOnce(new Response('', { status: 500 }))
                .mockRejectedValueOnce(new Error('network error'))
                .mockResolvedValueOnce(new Response('data'));
            const root = new FakeDirectory();
            const items = [
                { url: 'https://server/1', filename: 'one.mkv', folders: [ 'Collection' ] },
                { url: 'https://server/2', filename: 'two.mkv', folders: [ 'Collection' ] },
                { url: 'https://server/3', filename: 'three.mkv', folders: [ 'Collection' ] }
            ];

            const failed = await downloadToDirectory(asHandle(root), items);

            expect(failed).toEqual([ items[0], items[1] ]);
            const collection = root.directories.get('Collection');
            expect(collection?.files.has('one.mkv')).toBe(false);
            expect(collection?.files.has('two.mkv')).toBe(false);
            expect(collection?.files.get('three.mkv')).toBe('data');
        });
    });
});
