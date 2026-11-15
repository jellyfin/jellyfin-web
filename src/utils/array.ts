/**
 * Splits an array into chunks of a given size.
 * @param arr The array to split.
 * @param size The size of each chunk.
 * @returns The array of chunks.
 */
export function chunk<T>(arr: T[], size: number): T[][] {
    return arr.reduce((acc, val, i) => {
        if (i % size === 0) acc.push([]);
        acc[acc.length - 1].push(val);
        return acc;
    }, [] as T[][]);
}

/**
 * Utility function that converts a value that can be a single item, array of items, null, or undefined to an array.
 */
export function ensureArray<T>(val: T | T[] | null | undefined): T[] {
    if (val == null) return [];
    if (Array.isArray(val)) return val;
    return [ val ];
}
