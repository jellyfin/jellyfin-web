import './filterIndicator.scss';
import { ALLOWED_FILTER_SETTINGS } from '../../constants/allowedFilterSettings';

export function getFilterStatus(query) {
    return ALLOWED_FILTER_SETTINGS.some(setting => {
        return query[setting] !== undefined && query[setting] !== null;
    });
}

export function setFilterStatus(page, query) {
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
