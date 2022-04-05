export const getWindowLocationSearch = (win: Window | null | undefined) => {
    let search = (win || window).location.search;

    if (!search) {
        const index = window.location.href.indexOf('?');

        if (index != -1) {
            search = window.location.href.substring(index);
        }
    }

    return search || '';
};
