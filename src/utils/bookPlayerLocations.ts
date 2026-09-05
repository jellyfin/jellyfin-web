import type Locations from 'epubjs/types/locations';
import type Rendition from 'epubjs/types/rendition';

export const LOCATION_BREAK_SIZE = 1024;

type LocationMap = Pick<Locations, 'generate' | 'load' | 'save' | 'cfiFromPercentage' | 'percentageFromCfi'> & {
    // epub.js exposes this at runtime, but omits it from its type declarations.
    pause?: number;
};

interface ReaderLocation {
    start: { cfi: string };
}

interface PreparationOptions {
    locations: LocationMap;
    rendition: Pick<Rendition, 'display' | 'on' | 'off'> & { location?: ReaderLocation };
    startPercentage: number;
    onProgress: (percentage: number) => void;
    beforeIndexing?: () => Promise<unknown>;
    loadLocations: () => Promise<string | null>;
    saveLocations: (locations: string) => Promise<void>;
}

function restoreLocations(locations: LocationMap, cached: string | null) {
    if (!cached) return false;
    try {
        const entries: unknown = JSON.parse(cached);
        if (!Array.isArray(entries) || !entries.length || !entries.every(entry => (
            typeof entry === 'string' && entry.startsWith('epubcfi(') && entry.endsWith(')')
        ))) return false;
        locations.load(cached);
        return true;
    } catch {
        return false;
    }
}

export function prepareEpubLocations({
    locations, rendition, startPercentage, onProgress,
    beforeIndexing = () => Promise.resolve(), loadLocations, saveLocations
}: PreparationOptions) {
    let cancelled = false;
    let indexed = false;
    let initialCfi = rendition.location?.start.cfi;
    let currentCfi = initialCfi;
    let moved = false;

    const reportProgress = () => {
        if (cancelled || !indexed || !currentCfi) return;
        const percentage = locations.percentageFromCfi(currentCfi);
        if (Number.isFinite(percentage)) onProgress(percentage);
    };
    const relocated = (location: ReaderLocation) => {
        currentCfi = location.start.cfi;
        initialCfi ??= currentCfi;
        moved ||= currentCfi !== initialCfi;
        reportProgress();
    };
    rendition.on('relocated', relocated);

    const cancel = () => {
        cancelled = true;
        rendition.off('relocated', relocated);
    };

    const ready = (async () => {
        // Let the first page paint before parsing the remaining chapters.
        await beforeIndexing();
        if (cancelled) return;

        // The default 100 ms pause per section adds seconds to large books.
        // Zero still yields through epub.js's timer between sections.
        locations.pause = 0;
        const cached = await loadLocations();
        if (cancelled) return;
        const restored = restoreLocations(locations, cached);
        if (!restored) await locations.generate(LOCATION_BREAK_SIZE);
        if (cancelled) return;

        // A page turn while indexing takes precedence over a delayed resume.
        const shouldResume = startPercentage > 0 && !moved;
        const cfiBeforeResume = currentCfi;
        if (shouldResume) {
            await rendition.display(locations.cfiFromPercentage(startPercentage));
        }
        if (cancelled) return;

        indexed = true;
        // display() can resolve before epub.js emits the resumed location.
        // Keep the saved progress until that event instead of reporting page 0.
        if (!shouldResume || currentCfi !== cfiBeforeResume) reportProgress();
        if (!restored) await saveLocations(locations.save());
    })().catch(error => {
        cancel();
        throw error;
    });

    return { ready, cancel };
}
