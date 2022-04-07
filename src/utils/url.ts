export const getParameterByName = (name: string, url?: string | null | undefined) => {
    if (!url) {
        url = window.location.search;
    }

    // eslint-disable-next-line compat/compat
    return new URLSearchParams(url).get(name) || '';
};
