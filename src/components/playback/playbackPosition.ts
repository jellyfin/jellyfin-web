export class PlaybackTimeCache {
    private time: number | null = null;

    get(): number | null {
        return this.time;
    }

    reset(): void {
        this.time = null;
    }

    set(time: number): void {
        this.time = time;
    }

    update(time: number): void {
        if (time !== 0) {
            this.time = time;
        }
    }
}

export function getPlaybackRetryStartTicks(
    currentTicks: number,
    playerStartPositionTicks: number | undefined,
    playbackStarted: boolean | undefined
): number | undefined {
    if (playbackStarted && Number.isFinite(currentTicks)) {
        return currentTicks;
    }

    return currentTicks || playerStartPositionTicks;
}
