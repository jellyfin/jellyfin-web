import { describe, expect, it, vi } from 'vitest';

import { LOCATION_BREAK_SIZE, prepareEpubLocations } from './bookPlayerLocations';

function deferred() {
    let resolve!: (value: string[]) => void;
    const promise = new Promise<string[]>(complete => {
        resolve = complete;
    });
    return { promise, resolve };
}

function reader() {
    type Location = { start: { cfi: string } };
    const listeners = new Set<(location: Location) => void>();
    const locations = {
        pause: 100,
        generate: vi.fn(async () => ['epubcfi(generated)']),
        load: vi.fn(),
        save: vi.fn(() => '["epubcfi(generated)"]'),
        cfiFromPercentage: vi.fn(() => 'epubcfi(resume)'),
        percentageFromCfi: vi.fn((cfi: string): number => cfi === 'epubcfi(resume)' ? 0.35 : 0.42)
    };
    const rendition = {
        location: { start: { cfi: 'epubcfi(initial)' } },
        display: vi.fn(async (cfi?: string | number) => {
            rendition.location = { start: { cfi: String(cfi) } };
            listeners.forEach(listener => {
                listener(rendition.location);
            });
        }),
        on: vi.fn((_event: string, callback: (location: Location) => void) => { listeners.add(callback); }),
        off: vi.fn((_event: string, callback: (location: Location) => void) => { listeners.delete(callback); })
    };
    const options = {
        locations, rendition, startPercentage: 0,
        onProgress: vi.fn(),
        loadLocations: vi.fn(async (): Promise<string | null> => null),
        saveLocations: vi.fn<(locations: string) => Promise<void>>(() => Promise.resolve())
    };
    return { ...options, options, listeners };
}

describe('prepareEpubLocations', () => {
    it('leaves the reader available while indexing and removes the per-section delay', async () => {
        const { options, locations, onProgress } = reader();
        const generation = deferred();
        locations.generate.mockReturnValue(generation.promise);
        const preparation = prepareEpubLocations(options);

        await vi.waitFor(() => expect(locations.generate).toHaveBeenCalledWith(LOCATION_BREAK_SIZE));
        expect(locations.pause).toBe(0);
        expect(onProgress).not.toHaveBeenCalled();
        generation.resolve(['epubcfi(generated)']);
        await preparation.ready;
        expect(options.saveLocations).toHaveBeenCalledWith('["epubcfi(generated)"]');
    });

    it('uses a cached index without parsing the chapters again', async () => {
        const { options, locations } = reader();
        options.loadLocations.mockResolvedValue('["epubcfi(cached)"]');
        await prepareEpubLocations(options).ready;
        expect(locations.load).toHaveBeenCalledWith('["epubcfi(cached)"]');
        expect(locations.generate).not.toHaveBeenCalled();
        expect(options.saveLocations).not.toHaveBeenCalled();
    });

    it.each(['broken json', '[]', '{}', '[null]', '["not a CFI"]'])('regenerates an unusable cache: %s', async cached => {
        const { options, locations } = reader();
        options.loadLocations.mockResolvedValue(cached);
        await prepareEpubLocations(options).ready;
        expect(locations.generate).toHaveBeenCalled();
    });

    it('regenerates if epub.js cannot load the cached index', async () => {
        const { options, locations } = reader();
        options.loadLocations.mockResolvedValue('["epubcfi(cached)"]');
        locations.load.mockImplementation(() => {
            throw new Error('invalid index');
        });
        await prepareEpubLocations(options).ready;
        expect(locations.generate).toHaveBeenCalled();
    });

    it('restores the saved percentage and reports subsequent page turns', async () => {
        const { options, rendition, locations, onProgress } = reader();
        options.startPercentage = 0.35;
        await prepareEpubLocations(options).ready;
        expect(locations.cfiFromPercentage).toHaveBeenCalledWith(0.35);
        expect(rendition.display).toHaveBeenCalledWith('epubcfi(resume)');
        expect(onProgress).toHaveBeenLastCalledWith(0.35);
        await rendition.display('epubcfi(next)');
        expect(onProgress).toHaveBeenLastCalledWith(0.42);
    });

    it('does not report the old page when display resolves before the resumed location event', async () => {
        const { options, rendition, onProgress, listeners } = reader();
        options.startPercentage = 0.35;
        rendition.display.mockResolvedValue(undefined);
        await prepareEpubLocations(options).ready;
        expect(onProgress).not.toHaveBeenCalled();
        listeners.forEach(listener => {
            listener({ start: { cfi: 'epubcfi(resume)' } });
        });
        expect(onProgress).toHaveBeenCalledExactlyOnceWith(0.35);
    });

    it('keeps a page chosen during indexing instead of jumping back to the resume position', async () => {
        const { options, locations, rendition, onProgress } = reader();
        options.startPercentage = 0.35;
        const generation = deferred();
        locations.generate.mockReturnValue(generation.promise);
        const preparation = prepareEpubLocations(options);
        await vi.waitFor(() => expect(locations.generate).toHaveBeenCalled());
        await rendition.display('epubcfi(chosen)');
        expect(onProgress).not.toHaveBeenCalled();
        generation.resolve(['epubcfi(generated)']);
        await preparation.ready;
        expect(locations.cfiFromPercentage).not.toHaveBeenCalled();
        expect(rendition.location.start.cfi).toBe('epubcfi(chosen)');
        expect(onProgress).toHaveBeenLastCalledWith(0.42);
    });

    it('does not start indexing after the reader is closed before its first paint', async () => {
        const { options, locations, listeners } = reader();
        const preparation = prepareEpubLocations(options);
        preparation.cancel();
        await preparation.ready;
        expect(locations.generate).not.toHaveBeenCalled();
        expect(options.loadLocations).not.toHaveBeenCalled();
        expect(listeners.size).toBe(0);
    });

    it('does not resume, save progress or retain listeners when closed during indexing', async () => {
        const { options, locations, rendition, onProgress, listeners } = reader();
        options.startPercentage = 0.35;
        const generation = deferred();
        locations.generate.mockReturnValue(generation.promise);
        const preparation = prepareEpubLocations(options);
        await vi.waitFor(() => expect(locations.generate).toHaveBeenCalled());
        preparation.cancel();
        generation.resolve(['epubcfi(generated)']);
        await preparation.ready;
        expect(rendition.display).not.toHaveBeenCalled();
        expect(onProgress).not.toHaveBeenCalled();
        expect(listeners.size).toBe(0);
    });

    it('removes its listener if chapter parsing fails', async () => {
        const { options, locations, listeners } = reader();
        locations.generate.mockRejectedValue(new Error('chapter missing'));
        await expect(prepareEpubLocations(options).ready).rejects.toThrow('chapter missing');
        expect(listeners.size).toBe(0);
    });

    it('ignores invalid progress values', async () => {
        const { options, locations, onProgress } = reader();
        locations.percentageFromCfi.mockReturnValue(NaN);
        await prepareEpubLocations(options).ready;
        expect(onProgress).not.toHaveBeenCalled();
    });
});
