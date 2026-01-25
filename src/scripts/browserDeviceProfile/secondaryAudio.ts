import browser from 'scripts/browser';

export function canPlaySecondaryAudio(videoTestElement: HTMLMediaElement): boolean {
    return (
        !!(videoTestElement as any).audioTracks &&
        !browser.firefox &&
        (((browser as any).tizenVersion >= 5.5 && (browser as any).tizenVersion < 8) || !(browser as any).tizen) &&
        ((browser as any).web0sVersion >= 4.0 || !(browser as any).web0sVersion)
    );
}
