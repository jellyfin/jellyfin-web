export function isExternalLink(url: string): boolean {
    return url.startsWith('http') || url.startsWith('https');
}

export function removeFirstHash(url: string): string {
    if (url.startsWith('#')) {
        return url.substring(1) ;
    }

    return url;
}
