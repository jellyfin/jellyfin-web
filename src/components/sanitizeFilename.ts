// TODO: Check if needed and move to external dependency
// From https://github.com/parshap/node-sanitize-filename

// eslint-disable-next-line sonarjs/duplicates-in-character-class
const illegalRe = /[/?<>\\:*|":]/g;
// eslint-disable-next-line no-control-regex, sonarjs/no-control-regex
const controlRe = /[\x00-\x1f\x80-\x9f]/g;
const reservedRe = /^\.+$/;
// eslint-disable-next-line sonarjs/concise-regex
const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
// eslint-disable-next-line sonarjs/slow-regex
const windowsTrailingRe = /[. ]+$/;

function isHighSurrogate(codePoint: number) {
    return codePoint >= 0xd800 && codePoint <= 0xdbff;
}

function isLowSurrogate(codePoint: number) {
    return codePoint >= 0xdc00 && codePoint <= 0xdfff;
}

function getByteLength(string : string) {
    if (typeof string !== 'string') {
        throw new Error('Input must be string');
    }

    const charLength = string.length;
    let byteLength = 0;
    let codePoint = null;
    let prevCodePoint = null;
    for (let i = 0; i < charLength; i++) {
        codePoint = string.charCodeAt(i);
        // handle 4-byte non-BMP chars
        // low surrogate
        if (isLowSurrogate(codePoint)) {
            // when parsing previous hi-surrogate, 3 is added to byteLength
            if (prevCodePoint != null && isHighSurrogate(prevCodePoint)) {
                byteLength += 1;
            } else {
                byteLength += 3;
            }
        } else if (codePoint <= 0x7f) {
            byteLength += 1;
        } else if (codePoint >= 0x80 && codePoint <= 0x7ff) {
            byteLength += 2;
        } else if (codePoint >= 0x800 && codePoint <= 0xffff) {
            byteLength += 3;
        }
        prevCodePoint = codePoint;
    }

    return byteLength;
}

function truncate(string: string, byteLength: number) {
    if (typeof string !== 'string') {
        throw new Error('Input must be string');
    }

    const charLength = string.length;
    let curByteLength = 0;
    let codePoint;
    let segment;

    for (let i = 0; i < charLength; i += 1) {
        codePoint = string.charCodeAt(i);
        segment = string[i];

        if (isHighSurrogate(codePoint) && isLowSurrogate(string.charCodeAt(i + 1))) {
            // eslint-disable-next-line sonarjs/updated-loop-counter
            i += 1;
            segment += string[i];
        }

        curByteLength += getByteLength(segment);

        if (curByteLength === byteLength) {
            return string.slice(0, i + 1);
        } else if (curByteLength > byteLength) {
            return string.slice(0, i - segment.length + 1);
        }
    }

    return string;
}

export function sanitize(input: string, replacement: string) {
    const sanitized = input
        .replace(illegalRe, replacement)
        .replace(controlRe, replacement)
        .replace(reservedRe, replacement)
        .replace(windowsReservedRe, replacement)
        .replace(windowsTrailingRe, replacement);
    return truncate(sanitized, 255);
}
