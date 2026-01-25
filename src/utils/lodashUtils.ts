// Lodash Replacement Utilities
// ESM-compatible alternatives to lodash-es functions

/**
 * Deep equality comparison
 */
export function isEqual(a: any, b: any): boolean {
    if (a === b) return true;

    if (a == null || b == null) return a === b;

    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (!isEqual(a[i], b[i])) return false;
        }
        return true;
    }

    if (typeof a === 'object' && typeof b === 'object') {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);

        if (keysA.length !== keysB.length) return false;

        for (const key of keysA) {
            if (!keysB.includes(key)) return false;
            if (!isEqual(a[key], b[key])) return false;
        }
        return true;
    }

    return false;
}

/**
 * Function debouncing
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    immediate = false
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };

        const callNow = immediate && !timeout;

        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(later, wait);

        if (callNow) func(...args);
    };
}

/**
 * Deep object merging
 */
export function merge(target: any, ...sources: any[]): any {
    const result = { ...target };

    for (const source of sources) {
        if (source == null) continue;

        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                const sourceValue = source[key];
                const targetValue = result[key];

                if (isObject(sourceValue) && isObject(targetValue)) {
                    result[key] = merge(targetValue, sourceValue);
                } else {
                    result[key] = sourceValue;
                }
            }
        }
    }

    return result;
}

function isObject(item: any): item is Record<string, any> {
    return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Array union (remove duplicates)
 */
export function union<T>(...arrays: T[][]): T[] {
    const result: T[] = [];
    const seen = new Set<T>();

    for (const array of arrays) {
        for (const item of array) {
            if (!seen.has(item)) {
                seen.add(item);
                result.push(item);
            }
        }
    }

    return result;
}

/**
 * Group array items by key function
 */
export function groupBy<T, K extends string | number | symbol>(array: T[], iteratee: (item: T) => K): Record<K, T[]> {
    const result = {} as Record<K, T[]>;

    for (const item of array) {
        const key = iteratee(item);
        if (!result[key]) {
            result[key] = [];
        }
        result[key].push(item);
    }

    return result;
}

/**
 * Check if value is empty
 */
export function isEmpty(value: any): boolean {
    if (value == null) return true;
    if (typeof value === 'string' || Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}
