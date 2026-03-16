export const TICKS_PER_MS = 10000;
export const TICKS_PER_SECOND = 10000000;

const pad2 = (n: number) => String(n).padStart(2, '0');
const pad3 = (n: number) => String(n).padStart(3, '0');

/**
 * Format ticks to HH:MM:SS.mmm for input fields.
 * Returns '00:00:00.000' for invalid/NaN values.
 */
export function ticksToTimeString(ticks: number): string {
    if (!Number.isFinite(ticks) || ticks < 0) return '00:00:00.000';

    const totalSeconds = Math.floor(ticks / TICKS_PER_SECOND);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((ticks % TICKS_PER_SECOND) / TICKS_PER_MS);

    return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}.${pad3(ms)}`;
}

/**
 * Parse HH:MM:SS or HH:MM:SS.mmm to ticks.
 * Returns null if the string is invalid.
 */
export function timeStringToTicks(str: string): number | null {
    const match = /^(\d+):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/.exec(str);
    if (!match) return null;

    const hours = Number.parseInt(match[1], 10);
    const minutes = Number.parseInt(match[2], 10);
    const seconds = Number.parseInt(match[3], 10);
    const ms = match[4] ? Number.parseInt(match[4].padEnd(3, '0'), 10) : 0;

    if (minutes >= 60 || seconds >= 60 || ms >= 1000) return null;

    const totalMs = (hours * 3600 + minutes * 60 + seconds) * 1000 + ms;
    return totalMs * TICKS_PER_MS;
}

/**
 * Format seconds to M:SS or H:MM:SS (hours hidden when < 3600).
 */
export function formatEtaSeconds(totalSeconds: number): string {
    const s = Math.round(totalSeconds);
    if (s < 0) return '--:--';
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;
    if (hours > 0) {
        return `${hours}:${pad2(minutes)}:${pad2(seconds)}`;
    }
    return `${minutes}:${pad2(seconds)}`;
}
