/**
 * Collection Utilities
 *
 * Type-safe utilities for working with collections and arrays.
 */

/**
 * Remove duplicates from an array.
 */
export function unique<T>(array: T[]): T[] {
    return [...new Set(array)];
}

/**
 * Remove null/undefined values from an array.
 */
export function compact<T>(array: (T | null | undefined)[]): T[] {
    return array.filter((item): item is T => item != null);
}

/**
 * Group array items by a key.
 */
export function groupBy<T, K extends string | number | symbol>(
    array: T[],
    getKey: (item: T) => K
): Record<K, T[]> {
    const result = {} as Record<K, T[]>;

    for (const item of array) {
        const key = getKey(item);
        if (!result[key]) {
            result[key] = [];
        }
        result[key].push(item);
    }

    return result;
}

/**
 * Partition array into two groups based on predicate.
 */
export function partition<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] {
    const trueGroup: T[] = [];
    const falseGroup: T[] = [];

    for (const item of array) {
        if (predicate(item)) {
            trueGroup.push(item);
        } else {
            falseGroup.push(item);
        }
    }

    return [trueGroup, falseGroup];
}

/**
 * Sort array by multiple criteria.
 */
export function sortBy<T>(
    array: T[],
    ...getters: ((item: T) => number | string)[]
): T[] {
    return [...array].sort((a, b) => {
        for (const getter of getters) {
            const aVal = getter(a);
            const bVal = getter(b);
            if (aVal < bVal) return -1;
            if (aVal > bVal) return 1;
        }
        return 0;
    });
}

/**
 * Get the first item matching predicate.
 */
export function findLast<T>(array: T[], predicate: (item: T) => boolean): T | undefined {
    for (let i = array.length - 1; i >= 0; i--) {
        if (predicate(array[i])) {
            return array[i];
        }
    }
    return undefined;
}

/**
 * Check if all items match predicate.
 */
export function every<T>(array: T[], predicate: (item: T) => boolean): boolean {
    return array.every(predicate);
}

/**
 * Check if any item matches predicate.
 */
export function some<T>(array: T[], predicate: (item: T) => boolean): boolean {
    return array.some(predicate);
}

/**
 * Count items matching predicate.
 */
export function count<T>(array: T[], predicate: (item: T) => boolean): number {
    return array.reduce((acc, item) => (predicate(item) ? acc + 1 : acc), 0);
}

/**
 * Sum array of numbers.
 */
export function sum(numbers: number[]): number {
    return numbers.reduce((acc, n) => acc + n, 0);
}

/**
 * Get array sum using mapper.
 */
export function sumBy<T>(array: T[], mapper: (item: T) => number): number {
    return array.reduce((acc, item) => acc + mapper(item), 0);
}

/**
 * Find minimum value.
 */
export function min<T>(array: T[], mapper: (item: T) => number): number {
    if (array.length === 0) return Infinity;
    return Math.min(...array.map(mapper));
}

/**
 * Find maximum value.
 */
export function max<T>(array: T[], mapper: (item: T) => number): number {
    if (array.length === 0) return -Infinity;
    return Math.max(...array.map(mapper));
}

/**
 * Chunk array into smaller arrays.
 */
export function chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

/**
 * Flatten nested arrays one level.
 */
export function flatten<T>(array: (T | T[])[]): T[] {
    return array.flat() as T[];
}

/**
 * Flatten nested arrays to specified depth.
 */
export function flatMapDepth<T, R>(
    array: T[],
    mapper: (item: T, index: number, array: T[]) => R[],
    depth = 1
): R[] {
    return array.flatMap(mapper) as R[];
}

/**
 * Create array of specified size with mapper.
 */
export function range<T>(size: number, mapper: (index: number) => T): T[] {
    return Array.from({ length: size }, (_, i) => mapper(i));
}

/**
 * Shuffle array in place (mutates).
 */
export function shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Get random item from array.
 */
export function sample<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get n random items from array.
 */
export function sampleSize<T>(array: T[], n: number): T[] {
    const shuffled = shuffle([...array]);
    return shuffled.slice(0, Math.min(n, shuffled.length));
}

/**
 * Check if two arrays have the same elements (shallow comparison).
 */
export function isEqual<T>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((item, index) => item === b[index]);
}

/**
 * Check if arrays have intersection.
 */
export function intersects<T>(a: T[], b: T[]): boolean {
    return a.some(item => b.includes(item));
}

/**
 * Get union of two arrays.
 */
export function union<T>(...arrays: T[][]): T[] {
    return [...new Set(arrays.flat())];
}

/**
 * Get intersection of two arrays.
 */
export function intersection<T>(a: T[], b: T[]): T[] {
    return a.filter(item => b.includes(item));
}

/**
 * Get difference of two arrays (items in a not in b).
 */
export function difference<T>(a: T[], b: T[]): T[] {
    return a.filter(item => !b.includes(item));
}

export const collectionUtils = {
    unique,
    compact,
    groupBy,
    partition,
    sortBy,
    findLast,
    every,
    some,
    count,
    sum,
    sumBy,
    min,
    max,
    chunk,
    flatten,
    flatMapDepth,
    range,
    shuffle,
    sample,
    sampleSize,
    isEqual,
    intersects,
    union,
    intersection,
    difference
};

export default collectionUtils;
