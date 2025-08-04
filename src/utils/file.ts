/**
 * Reads and returns the file encoded in base64
 */
export function readFileAsBase64(file: File): Promise<string> {
    return new Promise(function (resolve, reject) {
        const reader = new FileReader();
        reader.onload = (e) => {
            // Split by a comma to remove the url: prefix
            const data = (e.target?.result as string)?.split?.(',')[1];
            resolve(data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Reads and returns the file in text format
 */
export function readFileAsText(file: File): Promise<string> {
    return new Promise(function (resolve, reject) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target?.result as string;
            resolve(data);
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

/** Gets a human readable string representing a file size in bytes */
export function getReadableSize(value: number, precision = 1) {
    let d = (Math.log(value) / Math.log(1024)) | 0;

    return (
        (value / Math.pow(1024, d)).toFixed(precision) +
        ' ' +
        (d ? 'KMGTPEZY'[--d] + 'iB' : 'Bytes')
    );
}
