import { TICKS_PER_SECOND } from 'constants/time';

const REPEAT_WINDOW_MS = 10_000;
const INITIAL_SKIP_TICKS = 10 * TICKS_PER_SECOND;

export function createDoubleClickSeek() {
    let lastDirection = 0;
    let lastSeekTime = 0;
    let skipTicks = INITIAL_SKIP_TICKS;

    return {
        getPosition(direction: -1 | 1, positionTicks: number, durationTicks = Number.MAX_SAFE_INTEGER) {
            const now = Date.now();
            skipTicks = direction === lastDirection && now - lastSeekTime <= REPEAT_WINDOW_MS ?
                Math.min(skipTicks * 2, Number.MAX_SAFE_INTEGER) :
                INITIAL_SKIP_TICKS;
            lastDirection = direction;
            lastSeekTime = now;

            return Math.max(0, Math.min(durationTicks, positionTicks + direction * skipTicks));
        },
        reset() {
            lastDirection = 0;
            lastSeekTime = 0;
            skipTicks = INITIAL_SKIP_TICKS;
        }
    };
}
