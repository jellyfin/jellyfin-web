export function getPromise(apiClient, params) {
    const id = params.id;

    if (id) {
        return apiClient.getItem(apiClient.getCurrentUserId(), id);
    }

    if (params.seriesTimerId) {
        return apiClient.getLiveTvSeriesTimer(params.seriesTimerId);
    }

    if (params.genre) {
        return apiClient.getGenre(params.genre, apiClient.getCurrentUserId());
    }

    if (params.musicgenre) {
        return apiClient.getMusicGenre(params.musicgenre, apiClient.getCurrentUserId());
    }

    if (params.musicartist) {
        return apiClient.getArtist(params.musicartist, apiClient.getCurrentUserId());
    }

    throw new Error('Invalid request');
}

export function hideAll(page, className, show) {
    for (const elem of page.querySelectorAll('.' + className)) {
        if (show) {
            elem.classList.remove('hide');
        } else {
            elem.classList.add('hide');
        }
    }
}

export function autoFocus(container) {
    import('../../components/autoFocuser').then(({ default: autoFocuser }) => {
        autoFocuser.autoFocus(container);
    });
}

export function enableScrollX() {
    document.body.classList.add('scrollX');
}
