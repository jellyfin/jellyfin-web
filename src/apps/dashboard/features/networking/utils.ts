export interface PublishedServerUris {
    internal?: string;
    external?: string;
    all?: string;
}

export const getPublishedServerUris = (uris: string[]): PublishedServerUris => {
    const publishedServerUris: PublishedServerUris = {};

    if (uris.length == 1 && !uris[0].includes('=')) {
        return { all: uris[0] };
    }

    for (const uriPart of uris) {
        const [type, uri] = uriPart.split('=');

        if (['internal', 'external', 'all'].includes(type)) {
            publishedServerUris[type as 'internal' | 'external' | 'all'] = uri;
        }
    }

    return publishedServerUris;
};

export const encodePublishedServerUris = (uris: PublishedServerUris): string[] => {
    if (uris.all) {
        return [`all=${uris.all}`];
    }

    const encodedUris: string[] = [];

    if (uris.internal) {
        encodedUris.push(`internal=${uris.internal}`);
    }
    if (uris.external) {
        encodedUris.push(`external=${uris.external}`);
    }

    return encodedUris;
};

export const splitString = (str: string | null | undefined) => {
    if (!str) return [];

    return str.split(',').map(function (s) {
        return s.trim();
    }).filter(function (s) {
        return s.length > 0;
    });
};
