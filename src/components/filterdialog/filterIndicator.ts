import './filterIndicator.scss';

function getFilterStatus(query) {
    return Boolean(
        query.Filters
            || query.IsFavorite
            || query.VideoTypes
            || query.SeriesStatus
            || query.Is4K
            || (query.IsHD !== undefined && query.IsHD !== null)
            || query.IsSD
            || query.Is3D
            || query.HasSubtitles
            || query.HasTrailer
            || query.HasSpecialFeature
            || query.HasThemeSong
            || query.HasThemeVideo
            || query.IsMissing
            || query.ParentIndexNumber
            || query.Genres
            || query.Tags
            || query.Years
            || query.OfficialRatings
            || query.IsUnaired
    );
}

export function setFilterStatus(page: Document, query) {
    const hasFilters = getFilterStatus(query);

    const btnFilterWrapper = page.querySelector('.btnFilter-wrapper');

    if (btnFilterWrapper) {
        let indicatorElem = btnFilterWrapper.querySelector('.filterIndicator');

        if (!indicatorElem && hasFilters) {
            btnFilterWrapper.insertAdjacentHTML(
                'afterbegin',
                '<div class="filterIndicator">!</div>'
            );
            btnFilterWrapper.classList.add('btnFilterWithIndicator');
            indicatorElem = btnFilterWrapper.querySelector('.filterIndicator');
        }

        if (indicatorElem) {
            indicatorElem.classList.toggle('hide', !hasFilters);
        }
    }
}
