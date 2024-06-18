import './filterIndicator.scss';

export function getFilterStatus(query) {
    return Boolean(
        query.Filters
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

export function setFilterStatus(page, hasFilters) {
    const btnFilter = page.querySelector('.btnFilter');

    if (btnFilter) {
        let indicatorElem = btnFilter.querySelector('.filterIndicator');

        if (!indicatorElem && hasFilters) {
            btnFilter.insertAdjacentHTML(
                'beforeend',
                '<div class="filterIndicator">!</div>'
            );
            btnFilter.classList.add('btnFilterWithIndicator');
            indicatorElem = btnFilter.querySelector('.filterIndicator');
        }

        if (indicatorElem) {
            if (hasFilters) {
                indicatorElem.classList.remove('hide');
            } else {
                indicatorElem.classList.add('hide');
            }
        }
    }
}
