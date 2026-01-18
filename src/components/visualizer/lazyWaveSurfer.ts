// Lazy loader for WaveSurfer to enable code splitting
let destroyFn: ((fullDestroy?: boolean) => any) | null = null;
let initFn: ((container: string, legacy: any, newSongDuration?: number) => Promise<void>) | null = null;

export async function destroyWaveSurferInstance(fullDestroy = false) {
    if (!destroyFn) {
        const module = await import('components/visualizer/WaveSurfer');
        destroyFn = module.destroyWaveSurferInstance;
    }
    return destroyFn(fullDestroy);
}

export async function waveSurferInitialization(container: string, legacy: any, newSongDuration = 0) {
    if (!initFn) {
        const module = await import('components/visualizer/WaveSurfer');
        initFn = module.waveSurferInitialization;
    }
    return initFn(container, legacy, newSongDuration);
}