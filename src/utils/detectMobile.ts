function isMobileBrowser(): boolean {
    const userAgent = navigator.userAgent || navigator.vendor;
    // Windows Phone must come first because its UA also contains "Android"
    if (/windows phone/i.test(userAgent)) {
        return true;
    }
    if (/android/i.test(userAgent)) {
        return true;
    }
    // iOS detection
    return /iPad|iPhone|iPod/.test(userAgent) && !(/Macintosh/.test(userAgent));
}

export { isMobileBrowser };
