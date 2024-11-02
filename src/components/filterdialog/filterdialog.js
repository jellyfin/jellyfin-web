import dom from '../../scripts/dom';
import dialogHelper from '../dialogHelper/dialogHelper';
import globalize from '../../lib/globalize';
import Events from '../../utils/events.ts';
import '../../elements/emby-checkbox/emby-checkbox';
import '../../elements/emby-collapse/emby-collapse';
import './style.scss';
import ServerConnections from '../ServerConnections';
import template from './filterdialog.template.html';
import { stopMultiSelect } from '../../components/multiSelect/multiSelect';

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
    const renderFilter = (selector, className, filter, delimiter) => {
        renderOptions(context, selector, className, result[filter], function (i) {
            return (delimiter + (query[filter] || '') + delimiter).includes(delimiter + i + delimiter);
        });
    };

    renderFilter('.genreFilters', 'chkGenreFilter', 'Genres', '|');
    renderFilter('.officialRatingFilters', 'chkOfficialRatingFilter', 'OfficialRatings', '|');
    renderFilter('.tagFilters', 'chkTagFilter', 'Tags', '|');
    renderFilter('.yearFilters', 'chkYearFilter', 'Years', ',');
    renderFilter('.channelGroupFilters', 'chkChannelGroupFilter', 'ChannelGroups', '|');
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

    if (options.mode === 'livetvchannels') {
        context.querySelector('.channelGroupFilters').classList.remove('hide');
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
    const modes = [
        'movies',
        'series',
        'albums',
        'albumartists',
        'artists',
        'songs',
        'episodes',
        'livetvchannels'
    ];

    return modes.includes(mode);
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
            const addFilterTrigger = (className, filter, delimiter) => {
                const filterOption = dom.parentWithClass(e.target, className);

                if (filterOption) {
                    const filterName = filterOption.getAttribute('data-filter');
                    let values = query[filter] || '';

                    values = (delimiter + values).replace(delimiter + filterName, '').substring(1);
                    if (filterOption.checked) {
                        values = values ? (values + delimiter + filterName) : filterName;
                    }

                    query.StartIndex = 0;
                    query[filter] = values;

                    triggerChange(this);
                }
            };

            addFilterTrigger('chkGenreFilter', 'Genres', '|');
            addFilterTrigger('chkTagFilter', 'Tags', '|');
            addFilterTrigger('chkYearFilter', 'Years', ',');
            addFilterTrigger('chkOfficialRatingFilter', 'OfficialRatings', '|');
            addFilterTrigger('chkChannelGroupFilter', 'ChannelGroups', '|');
        });
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
