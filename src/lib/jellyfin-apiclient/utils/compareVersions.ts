export function compareVersions(a: string = '', b: string = '') {
    // -1 a is smaller
    // 1 a is larger
    // 0 equal
    const aParts = a.split('.');
    const bParts = b.split('.');

    for (
        let i = 0, length = Math.max(aParts.length, bParts.length);
        i < length;
        i++
    ) {
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
