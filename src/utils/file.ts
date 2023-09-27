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
