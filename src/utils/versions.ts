/**
 * Compares two version strings (e.g., "1.2.3") and returns:
 * -1 if a < b
 * 1 if a > b
 * 0 if a == b
 */
export function compareVersions(a: string = '', b: string = '') {
    const aParts = a.split('.');
    const bParts = b.split('.');

    for (let i = 0, length = Math.max(aParts.length, bParts.length); i < length; i++) {
        const aVal = parseInt(aParts[i] || '0', 10);
        const bVal = parseInt(bParts[i] || '0', 10);

        if (aVal < bVal) {
            return -1;
        }

        if (aVal > bVal) {
            return 1;
        }
    }

    return 0;
}

/** Formats a version (e.g., "1.2.3") string for display. */
export function getDisplayVersion(version: string | null | undefined) {
    if (!version) return;

    // For versions above 10.X, we switch to only showing major.minor to reflect the new versioning scheme.
    if (compareVersions(version, '11') >= 0) {
        const parts = version.split('.');
        // Just in case we have a patch version that isn't 0, we want to show it. This should not happen.
        if (parts.length === 3 && parts[2] !== '0') return version;

        return parts.slice(0, 2).join('.');
    }

    return version;
};
