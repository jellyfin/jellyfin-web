import dom from '../../utils/dom';
import dialogHelper from '../dialogHelper/dialogHelper';
import globalize from '../../lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import union from 'lodash-es/union';
import Events from '../../utils/events.ts';
import '../../elements/emby-checkbox/emby-checkbox';
import '../../elements/emby-collapse/emby-collapse';
import './style.scss';
import template from './filterdialog.template.html';
import { stopMultiSelect } from '../../components/multiSelect/multiSelect';
import { getFilterStatus } from 'components/filterdialog/filterIndicator';

function merge(resultItems, queryItems, delimiter) {
    if (!queryItems) {
        return resultItems;
    }
    // eslint-disable-next-line sonarjs/no-alphabetical-sort
    return union(resultItems, queryItems.split(delimiter)).sort();
}

function renderOptions(context, selector, cssClass, items, isCheckedFn) {
    const elem = context.querySelector(selector);
    if (items.length) {
        elem.classList.remove('hide');
    } else {
        elem.classList.add('hide');
    }
    let html = '';
    html += '<div class="checkboxList">';
    html += items.map(function (filter) {
        let itemHtml = '';
        const checkedHtml = isCheckedFn(filter) ? 'checked' : '';
        itemHtml += '<label>';
        itemHtml += `<input is="emby-checkbox" type="checkbox" ${checkedHtml} data-filter="${filter}" class="${cssClass}"/>`;
        itemHtml += `<span>${filter}</span>`;
        itemHtml += '</label>';
        return itemHtml;
    }).join('');
    html += '</div>';
    elem.querySelector('.filterOptions').innerHTML = html;
}

function renderFilters(context, result, query) {
    renderOptions(context, '.genreFilters', 'chkGenreFilter', merge(result.Genres, query.Genres, '|'), function (i) {
        const delimeter = '|';
        return (delimeter + (query.Genres || '') + delimeter).includes(delimeter + i + delimeter);
    });
    renderOptions(context, '.officialRatingFilters', 'chkOfficialRatingFilter', merge(result.OfficialRatings, query.OfficialRatings, '|'), function (i) {
        const delimeter = '|';
        return (delimeter + (query.OfficialRatings || '') + delimeter).includes(delimeter + i + delimeter);
    });
    renderOptions(context, '.tagFilters', 'chkTagFilter', merge(result.Tags, query.Tags, '|'), function (i) {
        const delimeter = '|';
        return (delimeter + (query.Tags || '') + delimeter).includes(delimeter + i + delimeter);
    });
    renderOptions(context, '.yearFilters', 'chkYearFilter', merge(result.Years, query.Years, ','), function (i) {
        const delimeter = ',';
        return (delimeter + (query.Years || '') + delimeter).includes(delimeter + i + delimeter);
    });
}

function loadDynamicFilters(context, apiClient, userId, itemQuery) {
    return apiClient.getJSON(apiClient.getUrl('Items/Filters', {
        UserId: userId,
        ParentId: itemQuery.ParentId,
        IncludeItemTypes: itemQuery.IncludeItemTypes
    })).then(function (result) {
        renderFilters(context, result, itemQuery);
    });
}

/**
     * @param context {HTMLDivElement} Dialog
     * @param options {any} Options
     */
function updateFilterControls(context, options) {
    const query = options.query;

    if (options.mode === 'livetvchannels') {
        context.querySelector('.chkFavorite').checked = query.IsFavorite === true;
    } else {
        for (const elem of context.querySelectorAll('.chkStandardFilter')) {
            const filters = `,${query.Filters || ''}`;
            const filterName = elem.getAttribute('data-filter');
            elem.checked = filters.includes(`,${filterName}`);
        }
    }

    for (const elem of context.querySelectorAll('.chkVideoTypeFilter')) {
        const filters = `,${query.VideoTypes || ''}`;
        const filterName = elem.getAttribute('data-filter');
        elem.checked = filters.includes(`,${filterName}`);
    }
    context.querySelector('.chk3DFilter').checked = query.Is3D === true;
    context.querySelector('.chkHDFilter').checked = query.IsHD === true;
    context.querySelector('.chk4KFilter').checked = query.Is4K === true;
    context.querySelector('.chkSDFilter').checked = query.IsHD === false;
    context.querySelector('#chkSubtitle').checked = query.HasSubtitles === true;
    context.querySelector('#chkTrailer').checked = query.HasTrailer === true;
    context.querySelector('#chkThemeSong').checked = query.HasThemeSong === true;
    context.querySelector('#chkThemeVideo').checked = query.HasThemeVideo === true;
    context.querySelector('#chkSpecialFeature').checked = query.HasSpecialFeature === true;
    context.querySelector('#chkSpecialEpisode').checked = query.ParentIndexNumber === 0;
    context.querySelector('#chkMissingEpisode').checked = query.IsMissing === true;
    context.querySelector('#chkFutureEpisode').checked = query.IsUnaired === true;
    for (const elem of context.querySelectorAll('.chkStatus')) {
        const filters = `,${query.SeriesStatus || ''}`;
        const filterName = elem.getAttribute('data-filter');
        elem.checked = filters.includes(`,${filterName}`);
    }
}

/**
     * @param instance {FilterDialog} An instance of FilterDialog
     */
function triggerChange(instance) {
    stopMultiSelect();

    const hasFilters = getFilterStatus(instance.options.query);
    if (hasFilters) {
        enableByClass(document, 'resetFilters');
    } else {
        disableByClass(document, 'resetFilters');
    }

    Events.trigger(instance, 'filterchange');
}

function setVisibility(context, options) {
    if (options.mode === 'livetvchannels' || options.mode === 'albums' || options.mode === 'artists' || options.mode === 'albumartists' || options.mode === 'songs') {
        hideByClass(context, 'videoStandard');
    }

    if (enableDynamicFilters(options.mode)) {
        context.querySelector('.genreFilters').classList.remove('hide');
        context.querySelector('.officialRatingFilters').classList.remove('hide');
        context.querySelector('.tagFilters').classList.remove('hide');
        context.querySelector('.yearFilters').classList.remove('hide');
    }

    if (options.mode === 'movies' || options.mode === 'episodes') {
        context.querySelector('.videoTypeFilters').classList.remove('hide');
    }

    if (options.mode === 'movies' || options.mode === 'series' || options.mode === 'episodes') {
        context.querySelector('.features').classList.remove('hide');
    }

    if (options.mode === 'series') {
        context.querySelector('.seriesStatus').classList.remove('hide');
    }

    if (options.mode === 'episodes') {
        showByClass(context, 'episodeFilter');
    }

    if (!options.hasFilters) {
        disableByClass(context, 'resetFilters');
    }
}

function enableByClass(context, className) {
    for (const elem of context.querySelectorAll(`.${className}`)) {
        elem.disabled = false;
    }
}

function disableByClass(context, className) {
    for (const elem of context.querySelectorAll(`.${className}`)) {
        elem.disabled = true;
    }
}

function showByClass(context, className) {
    for (const elem of context.querySelectorAll(`.${className}`)) {
        elem.classList.remove('hide');
    }
}

function hideByClass(context, className) {
    for (const elem of context.querySelectorAll(`.${className}`)) {
        elem.classList.add('hide');
    }
}

function enableDynamicFilters(mode) {
    return mode === 'movies' || mode === 'series' || mode === 'albums' || mode === 'albumartists' || mode === 'artists' || mode === 'songs' || mode === 'episodes';
}

class FilterDialog {
    constructor(options) {
        /**
             * @private
             */
        this.options = options;
    }

    /**
         * @private
         */
    onFavoriteChange(elem) {
        const query = this.options.query;
        query.StartIndex = 0;
        query.IsFavorite = !!elem.checked || null;
        triggerChange(this);
    }

    /**
         * @private
         */
    onStandardFilterChange(elem) {
        const query = this.options.query;
        const filterName = elem.getAttribute('data-filter');
        let filters = query.Filters || '';
        filters = (`,${filters}`).replace(`,${filterName}`, '').substring(1);

        if (elem.checked) {
            filters = filters ? `${filters},${filterName}` : filterName;
        }

        query.StartIndex = 0;
        query.Filters = filters;
        triggerChange(this);
    }

    /**
         * @private
         */
    onVideoTypeFilterChange(elem) {
        const query = this.options.query;
        const filterName = elem.getAttribute('data-filter');
        let filters = query.VideoTypes || '';
        filters = (`,${filters}`).replace(`,${filterName}`, '').substring(1);

        if (elem.checked) {
            filters = filters ? `${filters},${filterName}` : filterName;
        }

        query.StartIndex = 0;
        query.VideoTypes = filters;
        triggerChange(this);
    }

    /**
         * @private
         */
    onStatusChange(elem) {
        const query = this.options.query;
        const filterName = elem.getAttribute('data-filter');
        let filters = query.SeriesStatus || '';
        filters = (`,${filters}`).replace(`,${filterName}`, '').substring(1);

        if (elem.checked) {
            filters = filters ? `${filters},${filterName}` : filterName;
        }

        query.SeriesStatus = filters;
        query.StartIndex = 0;
        triggerChange(this);
    }

    /**
         * @param context {HTMLDivElement} The dialog
         */
    bindEvents(context) {
        const query = this.options.query;

        if (this.options.mode === 'livetvchannels') {
            for (const elem of context.querySelectorAll('.chkFavorite')) {
                elem.addEventListener('change', () => this.onFavoriteChange(elem));
            }
        } else {
            for (const elem of context.querySelectorAll('.chkStandardFilter')) {
                elem.addEventListener('change', () => this.onStandardFilterChange(elem));
            }
        }

        for (const elem of context.querySelectorAll('.chkVideoTypeFilter')) {
            elem.addEventListener('change', () => this.onVideoTypeFilterChange(elem));
        }

        const resetFilters = context.querySelector('.resetFilters');
        resetFilters.addEventListener('click', () => {
            for (const elem of context.querySelectorAll('.filterDialogContent input[type="checkbox"]:checked')) {
                elem.checked = false;
            }
            this.resetQuery(query);
            triggerChange(this);
        });

        const chk3DFilter = context.querySelector('.chk3DFilter');
        chk3DFilter.addEventListener('change', () => {
            query.StartIndex = 0;
            query.Is3D = chk3DFilter.checked ? true : null;
            triggerChange(this);
        });
        const chk4KFilter = context.querySelector('.chk4KFilter');
        chk4KFilter.addEventListener('change', () => {
            query.StartIndex = 0;
            query.Is4K = chk4KFilter.checked ? true : null;
            triggerChange(this);
        });
        const chkHDFilter = context.querySelector('.chkHDFilter');
        const chkSDFilter = context.querySelector('.chkSDFilter');
        chkHDFilter.addEventListener('change', () => {
            query.StartIndex = 0;
            if (chkHDFilter.checked) {
                chkSDFilter.checked = false;
                query.IsHD = true;
            } else {
                query.IsHD = null;
            }
            triggerChange(this);
        });
        chkSDFilter.addEventListener('change', () => {
            query.StartIndex = 0;
            if (chkSDFilter.checked) {
                chkHDFilter.checked = false;
                query.IsHD = false;
            } else {
                query.IsHD = null;
            }
            triggerChange(this);
        });
        for (const elem of context.querySelectorAll('.chkStatus')) {
            elem.addEventListener('change', () => this.onStatusChange(elem));
        }
        const chkTrailer = context.querySelector('#chkTrailer');
        chkTrailer.addEventListener('change', () => {
            query.StartIndex = 0;
            query.HasTrailer = chkTrailer.checked ? true : null;
            triggerChange(this);
        });
        const chkThemeSong = context.querySelector('#chkThemeSong');
        chkThemeSong.addEventListener('change', () => {
            query.StartIndex = 0;
            query.HasThemeSong = chkThemeSong.checked ? true : null;
            triggerChange(this);
        });
        const chkSpecialFeature = context.querySelector('#chkSpecialFeature');
        chkSpecialFeature.addEventListener('change', () => {
            query.StartIndex = 0;
            query.HasSpecialFeature = chkSpecialFeature.checked ? true : null;
            triggerChange(this);
        });
        const chkThemeVideo = context.querySelector('#chkThemeVideo');
        chkThemeVideo.addEventListener('change', () => {
            query.StartIndex = 0;
            query.HasThemeVideo = chkThemeVideo.checked ? true : null;
            triggerChange(this);
        });
        const chkMissingEpisode = context.querySelector('#chkMissingEpisode');
        chkMissingEpisode.addEventListener('change', () => {
            query.StartIndex = 0;
            query.IsMissing = !!chkMissingEpisode.checked;
            triggerChange(this);
        });
        const chkSpecialEpisode = context.querySelector('#chkSpecialEpisode');
        chkSpecialEpisode.addEventListener('change', () => {
            query.StartIndex = 0;
            query.ParentIndexNumber = chkSpecialEpisode.checked ? 0 : null;
            triggerChange(this);
        });
        const chkFutureEpisode = context.querySelector('#chkFutureEpisode');
        chkFutureEpisode.addEventListener('change', () => {
            query.StartIndex = 0;
            if (chkFutureEpisode.checked) {
                query.IsUnaired = true;
                query.IsVirtualUnaired = null;
            } else {
                query.IsUnaired = null;
                query.IsVirtualUnaired = false;
            }
            triggerChange(this);
        });
        const chkSubtitle = context.querySelector('#chkSubtitle');
        chkSubtitle.addEventListener('change', () => {
            query.StartIndex = 0;
            query.HasSubtitles = chkSubtitle.checked ? true : null;
            triggerChange(this);
        });
        context.addEventListener('change', (e) => {
            const chkGenreFilter = dom.parentWithClass(e.target, 'chkGenreFilter');
            if (chkGenreFilter) {
                const filterName = chkGenreFilter.getAttribute('data-filter');
                let filters = query.Genres || '';
                const delimiter = '|';
                filters = filters
                    .split(delimiter)
                    .filter((f) => f !== filterName)
                    .join(delimiter);;
                if (chkGenreFilter.checked) {
                    filters = filters ? (filters + delimiter + filterName) : filterName;
                }
                query.StartIndex = 0;
                query.Genres = filters;
                triggerChange(this);
                return;
            }
            const chkTagFilter = dom.parentWithClass(e.target, 'chkTagFilter');
            if (chkTagFilter) {
                const filterName = chkTagFilter.getAttribute('data-filter');
                let filters = query.Tags || '';
                const delimiter = '|';
                filters = filters
                    .split(delimiter)
                    .filter((f) => f !== filterName)
                    .join(delimiter);;
                if (chkTagFilter.checked) {
                    filters = filters ? (filters + delimiter + filterName) : filterName;
                }
                query.StartIndex = 0;
                query.Tags = filters;
                triggerChange(this);
                return;
            }
            const chkYearFilter = dom.parentWithClass(e.target, 'chkYearFilter');
            if (chkYearFilter) {
                const filterName = chkYearFilter.getAttribute('data-filter');
                let filters = query.Years || '';
                const delimiter = ',';
                filters = filters
                    .split(delimiter)
                    .filter((f) => f !== filterName)
                    .join(delimiter);;
                if (chkYearFilter.checked) {
                    filters = filters ? (filters + delimiter + filterName) : filterName;
                }
                query.StartIndex = 0;
                query.Years = filters;
                triggerChange(this);
                return;
            }
            const chkOfficialRatingFilter = dom.parentWithClass(e.target, 'chkOfficialRatingFilter');
            if (chkOfficialRatingFilter) {
                const filterName = chkOfficialRatingFilter.getAttribute('data-filter');
                let filters = query.OfficialRatings || '';
                const delimiter = '|';
                filters = filters
                    .split(delimiter)
                    .filter((f) => f !== filterName)
                    .join(delimiter);
                if (chkOfficialRatingFilter.checked) {
                    filters = filters ? (filters + delimiter + filterName) : filterName;
                }
                query.StartIndex = 0;
                query.OfficialRatings = filters;
                triggerChange(this);
            }
        });
    }

    resetQuery(query) {
        query.IsFavorite = null;
        query.IsHD = null;
        query.Is3D = null;
        query.Is4K = null;
        query.Filters = '';
        query.SeriesStatus = '';
        query.OfficialRatings = '';
        query.Genres = '';
        query.VideoTypes = '';
        query.StartIndex = 0;
        query.HasSpecialFeature = null;
        query.HasSubtitles = null;
        query.HasThemeSong = null;
        query.HasThemeVideo = null;
        query.HasTrailer = null;
        query.Tags = null;
        query.Years = '';
    }

    show() {
        return new Promise((resolve) => {
            const dlg = dialogHelper.createDialog({
                removeOnClose: true,
                modal: false
            });
            dlg.classList.add('ui-body-a');
            dlg.classList.add('background-theme-a');
            dlg.classList.add('formDialog');
            dlg.classList.add('filterDialog');
            dlg.innerHTML = globalize.translateHtml(template);
            setVisibility(dlg, this.options);
            dialogHelper.open(dlg);
            dlg.addEventListener('close', resolve);
            updateFilterControls(dlg, this.options);
            this.bindEvents(dlg);
            if (enableDynamicFilters(this.options.mode)) {
                dlg.classList.add('dynamicFilterDialog');
                const apiClient = ServerConnections.getApiClient(this.options.serverId);
                loadDynamicFilters(dlg, apiClient, apiClient.getCurrentUserId(), this.options.query);
            }
        });
    }
}

export default FilterDialog;
