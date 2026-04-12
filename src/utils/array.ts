/**
 * Utility function that converts a value that can be a single item, array of items, null, or undefined to an array.
 */
export function ensureArray<T>(val: T | T[] | null | undefined): T[] {
    if (val == null) return [];
    if (Array.isArray(val)) return val;
    return [ val ];
}
