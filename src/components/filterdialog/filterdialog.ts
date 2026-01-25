/**
 * @deprecated This module is deprecated in favor of React + ui-primitives/Dialog.
 *
 * Migration:
 *     - Filter dialog → React with ui-primitives/Dialog
 *     - Template-based → React rendering
 *     - DOM manipulation → React state
 *
 * @see src/ui-primitives/Dialog.tsx
 * @see src/styles/LEGACY_DEPRECATION_GUIDE.md
 */

import type { ApiClient } from 'jellyfin-apiclient';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import dom from '../../utils/dom';
import dialogHelper from '../dialogHelper/dialogHelper';
import globalize from '../../lib/globalize';
import { union } from '../../utils/lodashUtils';
import Events from '../../utils/events';
import '../../elements/emby-checkbox/emby-checkbox';
import '../../elements/emby-collapse/emby-collapse';
import './style.css.ts';
// @ts-ignore - template is a raw HTML string import
import template from './filterdialog.template.html?raw';
import { stopMultiSelect } from '../../components/multiSelect/multiSelect';

export type FilterMode =
    | 'livetvchannels'
    | 'albums'
    | 'artists'
    | 'albumartists'
    | 'songs'
    | 'movies'
    | 'episodes'
    | 'series';

export type StandardFilter =
    | 'IsFavorite'
    | 'IsNotFavorite'
    | 'IsPlayed'
    | 'IsUnplayed'
    | 'IsInProgress'
    | 'IsMissing'
    | 'IsUnaired';

export type VideoTypeFilter = 'Video' | 'AdultVideo' | 'MusicVideo' | 'Trailer' | 'Movie' | 'Episode' | 'Series';

export type SeriesStatusFilter = 'Continuing' | 'Ended' | 'Canceled';

export interface ItemQuery {
    Filters?: string;
    VideoTypes?: string;
    Genres?: string;
    Tags?: string;
    OfficialRatings?: string;
    Years?: string;
    IsFavorite?: boolean | null;
    Is3D?: boolean | null;
    IsHD?: boolean | null;
    Is4K?: boolean | null;
    IsSDFilter?: boolean | null;
    HasSubtitles?: boolean | null;
    HasTrailer?: boolean | null;
    HasThemeSong?: boolean | null;
    HasThemeVideo?: boolean | null;
    HasSpecialFeature?: boolean | null;
    ParentIndexNumber?: number | null;
    IsMissing?: boolean;
    IsUnaired?: boolean | null;
    IsVirtualUnaired?: boolean | null;
    SeriesStatus?: string;
    StartIndex?: number;
    ParentId?: string;
    IncludeItemTypes?: string[];
}

export interface FilterDialogOptions {
    mode: FilterMode;
    query: ItemQuery;
    serverId: string;
}

export interface FilterResult {
    Genres?: string[];
    OfficialRatings?: string[];
    Tags?: string[];
    Years?: number[];
}

function merge(resultItems: string[], queryItems: string | undefined, delimiter: string): string[] {
    if (!queryItems) {
        return resultItems;
    }
    return union(...[resultItems, queryItems.split(delimiter)]);
}

function renderOptions(
    context: HTMLElement,
    selector: string,
    cssClass: string,
    items: string[],
    isCheckedFn: (filter: string) => boolean
): void {
    const elem = context.querySelector(selector) as HTMLElement;
    if (items.length) {
        elem.classList.remove('hide');
    } else {
        elem.classList.add('hide');
    }
    let html = '';
    html += '<div class="checkboxList">';
    html += items
        .map(filter => {
            let itemHtml = '';
            const checkedHtml = isCheckedFn(filter) ? 'checked' : '';
            itemHtml += '<label>';
            itemHtml += `<input is="emby-checkbox" type="checkbox" ${checkedHtml} data-filter="${filter}" class="${cssClass}"/>`;
            itemHtml += `<span>${filter}</span>`;
            itemHtml += '</label>';
            return itemHtml;
        })
        .join('');
    html += '</div>';
    elem.querySelector('.filterOptions')!.innerHTML = html;
}

function renderFilters(context: HTMLElement, result: FilterResult, query: ItemQuery): void {
    renderOptions(context, '.genreFilters', 'chkGenreFilter', merge(result.Genres || [], query.Genres, '|'), i => {
        const delimiter = '|';
        return (delimiter + (query.Genres || '') + delimiter).includes(delimiter + i + delimiter);
    });
    renderOptions(
        context,
        '.officialRatingFilters',
        'chkOfficialRatingFilter',
        merge(result.OfficialRatings || [], query.OfficialRatings, '|'),
        i => {
            const delimiter = '|';
            return (delimiter + (query.OfficialRatings || '') + delimiter).includes(delimiter + i + delimiter);
        }
    );
    renderOptions(context, '.tagFilters', 'chkTagFilter', merge(result.Tags || [], query.Tags, '|'), i => {
        const delimiter = '|';
        return (delimiter + (query.Tags || '') + delimiter).includes(delimiter + i + delimiter);
    });
    renderOptions(
        context,
        '.yearFilters',
        'chkYearFilter',
        merge(result.Years?.map(String) || [], query.Years, ','),
        i => {
            const delimiter = ',';
            return (delimiter + (query.Years || '') + delimiter).includes(delimiter + i + delimiter);
        }
    );
}

function loadDynamicFilters(
    context: HTMLElement,
    apiClient: ApiClient,
    userId: string,
    itemQuery: ItemQuery
): Promise<void> {
    return apiClient
        .getJSON(
            apiClient.getUrl('Items/Filters', {
                UserId: userId,
                ParentId: itemQuery.ParentId,
                IncludeItemTypes: itemQuery.IncludeItemTypes
            })
        )
        .then((result: FilterResult) => {
            renderFilters(context, result, itemQuery);
        });
}

function updateFilterControls(context: HTMLElement, options: FilterDialogOptions): void {
    const query = options.query;

    if (options.mode === 'livetvchannels') {
        const favoriteCheckbox = context.querySelector('.chkFavorite') as HTMLInputElement;
        if (favoriteCheckbox) {
            favoriteCheckbox.checked = query.IsFavorite === true;
        }
    } else {
        const standardFilters = context.querySelectorAll('.chkStandardFilter') as NodeListOf<HTMLInputElement>;
        for (const elem of standardFilters) {
            const filters = `,${query.Filters || ''}`;
            const filterName = elem.getAttribute('data-filter') || '';
            elem.checked = filters.includes(`,${filterName}`);
        }
    }

    const videoTypeFilters = context.querySelectorAll('.chkVideoTypeFilter') as NodeListOf<HTMLInputElement>;
    for (const elem of videoTypeFilters) {
        const filters = `,${query.VideoTypes || ''}`;
        const filterName = elem.getAttribute('data-filter') || '';
        elem.checked = filters.includes(`,${filterName}`);
    }

    const chk3DFilter = context.querySelector('.chk3DFilter') as HTMLInputElement;
    if (chk3DFilter) chk3DFilter.checked = query.Is3D === true;
    const chkHDFilter = context.querySelector('.chkHDFilter') as HTMLInputElement;
    if (chkHDFilter) chkHDFilter.checked = query.IsHD === true;
    const chk4KFilter = context.querySelector('.chk4KFilter') as HTMLInputElement;
    if (chk4KFilter) chk4KFilter.checked = query.Is4K === true;
    const chkSDFilter = context.querySelector('.chkSDFilter') as HTMLInputElement;
    if (chkSDFilter) chkSDFilter.checked = query.IsHD === false;
    const chkSubtitle = context.querySelector('#chkSubtitle') as HTMLInputElement;
    if (chkSubtitle) chkSubtitle.checked = query.HasSubtitles === true;
    const chkTrailer = context.querySelector('#chkTrailer') as HTMLInputElement;
    if (chkTrailer) chkTrailer.checked = query.HasTrailer === true;
    const chkThemeSong = context.querySelector('#chkThemeSong') as HTMLInputElement;
    if (chkThemeSong) chkThemeSong.checked = query.HasThemeSong === true;
    const chkThemeVideo = context.querySelector('#chkThemeVideo') as HTMLInputElement;
    if (chkThemeVideo) chkThemeVideo.checked = query.HasThemeVideo === true;
    const chkSpecialFeature = context.querySelector('#chkSpecialFeature') as HTMLInputElement;
    if (chkSpecialFeature) chkSpecialFeature.checked = query.HasSpecialFeature === true;
    const chkSpecialEpisode = context.querySelector('#chkSpecialEpisode') as HTMLInputElement;
    if (chkSpecialEpisode) chkSpecialEpisode.checked = query.ParentIndexNumber === 0;
    const chkMissingEpisode = context.querySelector('#chkMissingEpisode') as HTMLInputElement;
    if (chkMissingEpisode) chkMissingEpisode.checked = query.IsMissing === true;
    const chkFutureEpisode = context.querySelector('#chkFutureEpisode') as HTMLInputElement;
    if (chkFutureEpisode) chkFutureEpisode.checked = query.IsUnaired === true;

    const statusFilters = context.querySelectorAll('.chkStatus') as NodeListOf<HTMLInputElement>;
    for (const elem of statusFilters) {
        const filters = `,${query.SeriesStatus || ''}`;
        const filterName = elem.getAttribute('data-filter') || '';
        elem.checked = filters.includes(`,${filterName}`);
    }
}

function setVisibility(context: HTMLElement, options: FilterDialogOptions): void {
    if (
        options.mode === 'livetvchannels' ||
        options.mode === 'albums' ||
        options.mode === 'artists' ||
        options.mode === 'albumartists' ||
        options.mode === 'songs'
    ) {
        hideByClass(context, 'videoStandard');
    }

    if (enableDynamicFilters(options.mode)) {
        context.querySelector('.genreFilters')?.classList.remove('hide');
        context.querySelector('.officialRatingFilters')?.classList.remove('hide');
        context.querySelector('.tagFilters')?.classList.remove('hide');
        context.querySelector('.yearFilters')?.classList.remove('hide');
    }

    if (options.mode === 'movies' || options.mode === 'episodes') {
        context.querySelector('.videoTypeFilters')?.classList.remove('hide');
    }

    if (options.mode === 'movies' || options.mode === 'series' || options.mode === 'episodes') {
        context.querySelector('.features')?.classList.remove('hide');
    }

    if (options.mode === 'series') {
        context.querySelector('.seriesStatus')?.classList.remove('hide');
    }

    if (options.mode === 'episodes') {
        showByClass(context, 'episodeFilter');
    }
}

function showByClass(context: HTMLElement, className: string): void {
    const elems = context.querySelectorAll(`.${className}`);
    for (const elem of elems) {
        elem.classList.remove('hide');
    }
}

function hideByClass(context: HTMLElement, className: string): void {
    const elems = context.querySelectorAll(`.${className}`);
    for (const elem of elems) {
        elem.classList.add('hide');
    }
}

function enableDynamicFilters(mode: FilterMode): boolean {
    return (
        mode === 'movies' ||
        mode === 'series' ||
        mode === 'albums' ||
        mode === 'albumartists' ||
        mode === 'artists' ||
        mode === 'songs' ||
        mode === 'episodes'
    );
}

class FilterDialog {
    options: FilterDialogOptions;
    // EventObject compatibility for legacy Events.trigger()
    _callbacks?: Record<string, any[]> = {};
    name?: string = 'FilterDialog';

    constructor(options: FilterDialogOptions) {
        this.options = options;
    }

    private onFavoriteChange(elem: HTMLInputElement): void {
        const query = this.options.query;
        query.StartIndex = 0;
        query.IsFavorite = !!elem.checked || null;
        Events.trigger({ name: 'FilterDialog' }, 'filterchange');
    }

    private onStandardFilterChange(elem: HTMLInputElement): void {
        const query = this.options.query;
        const filterName = elem.getAttribute('data-filter') || '';
        let filters = query.Filters || '';
        filters = `,${filters}`.replace(`,${filterName}`, '').substring(1);

        if (elem.checked) {
            filters = filters ? `${filters},${filterName}` : filterName;
        }

        query.StartIndex = 0;
        query.Filters = filters;
        Events.trigger(this, 'filterchange');
    }

    private onVideoTypeFilterChange(elem: HTMLInputElement): void {
        const query = this.options.query;
        const filterName = elem.getAttribute('data-filter') || '';
        let filters = query.VideoTypes || '';
        filters = `,${filters}`.replace(`,${filterName}`, '').substring(1);

        if (elem.checked) {
            filters = filters ? `${filters},${filterName}` : filterName;
        }

        query.StartIndex = 0;
        query.VideoTypes = filters;
        Events.trigger(this, 'filterchange');
    }

    private onStatusChange(elem: HTMLInputElement): void {
        const query = this.options.query;
        const filterName = elem.getAttribute('data-filter') || '';
        let filters = query.SeriesStatus || '';
        filters = `,${filters}`.replace(`,${filterName}`, '').substring(1);

        if (elem.checked) {
            filters = filters ? `${filters},${filterName}` : filterName;
        }

        query.SeriesStatus = filters;
        query.StartIndex = 0;
        Events.trigger(this, 'filterchange');
    }

    bindEvents(context: HTMLElement): void {
        const query = this.options.query;

        if (this.options.mode === 'livetvchannels') {
            const favoriteElems = context.querySelectorAll('.chkFavorite') as NodeListOf<HTMLInputElement>;
            for (const elem of favoriteElems) {
                elem.addEventListener('change', () => this.onFavoriteChange(elem));
            }
        } else {
            const standardFilterElems = context.querySelectorAll('.chkStandardFilter') as NodeListOf<HTMLInputElement>;
            for (const elem of standardFilterElems) {
                elem.addEventListener('change', () => this.onStandardFilterChange(elem));
            }
        }

        const videoTypeFilterElems = context.querySelectorAll('.chkVideoTypeFilter') as NodeListOf<HTMLInputElement>;
        for (const elem of videoTypeFilterElems) {
            elem.addEventListener('change', () => this.onVideoTypeFilterChange(elem));
        }

        const chk3DFilter = context.querySelector('.chk3DFilter') as HTMLInputElement;
        chk3DFilter?.addEventListener('change', () => {
            query.StartIndex = 0;
            query.Is3D = chk3DFilter.checked ? true : null;
            Events.trigger(this, 'filterchange');
        });

        const chk4KFilter = context.querySelector('.chk4KFilter') as HTMLInputElement;
        chk4KFilter?.addEventListener('change', () => {
            query.StartIndex = 0;
            query.Is4K = chk4KFilter.checked ? true : null;
            Events.trigger(this, 'filterchange');
        });

        const chkHDFilter = context.querySelector('.chkHDFilter') as HTMLInputElement;
        const chkSDFilter = context.querySelector('.chkSDFilter') as HTMLInputElement;
        chkHDFilter?.addEventListener('change', () => {
            query.StartIndex = 0;
            if (chkHDFilter.checked) {
                chkSDFilter.checked = false;
                query.IsHD = true;
            } else {
                query.IsHD = null;
            }
            Events.trigger(this, 'filterchange');
        });
        chkSDFilter?.addEventListener('change', () => {
            query.StartIndex = 0;
            if (chkSDFilter.checked) {
                chkHDFilter.checked = false;
                query.IsHD = false;
            } else {
                query.IsHD = null;
            }
            Events.trigger(this, 'filterchange');
        });

        const statusElems = context.querySelectorAll('.chkStatus') as NodeListOf<HTMLInputElement>;
        for (const elem of statusElems) {
            elem.addEventListener('change', () => this.onStatusChange(elem));
        }

        const chkTrailer = context.querySelector('#chkTrailer') as HTMLInputElement;
        chkTrailer?.addEventListener('change', () => {
            query.StartIndex = 0;
            query.HasTrailer = chkTrailer.checked ? true : null;
            Events.trigger(this, 'filterchange');
        });

        const chkThemeSong = context.querySelector('#chkThemeSong') as HTMLInputElement;
        chkThemeSong?.addEventListener('change', () => {
            query.StartIndex = 0;
            query.HasThemeSong = chkThemeSong.checked ? true : null;
            Events.trigger(this, 'filterchange');
        });

        const chkSpecialFeature = context.querySelector('#chkSpecialFeature') as HTMLInputElement;
        chkSpecialFeature?.addEventListener('change', () => {
            query.StartIndex = 0;
            query.HasSpecialFeature = chkSpecialFeature.checked ? true : null;
            Events.trigger(this, 'filterchange');
        });

        const chkThemeVideo = context.querySelector('#chkThemeVideo') as HTMLInputElement;
        chkThemeVideo?.addEventListener('change', () => {
            query.StartIndex = 0;
            query.HasThemeVideo = chkThemeVideo.checked ? true : null;
            Events.trigger(this, 'filterchange');
        });

        const chkMissingEpisode = context.querySelector('#chkMissingEpisode') as HTMLInputElement;
        chkMissingEpisode?.addEventListener('change', () => {
            query.StartIndex = 0;
            query.IsMissing = !!chkMissingEpisode.checked;
            Events.trigger(this, 'filterchange');
        });

        const chkSpecialEpisode = context.querySelector('#chkSpecialEpisode') as HTMLInputElement;
        chkSpecialEpisode?.addEventListener('change', () => {
            query.StartIndex = 0;
            query.ParentIndexNumber = chkSpecialEpisode.checked ? 0 : null;
            Events.trigger(this, 'filterchange');
        });

        const chkFutureEpisode = context.querySelector('#chkFutureEpisode') as HTMLInputElement;
        chkFutureEpisode?.addEventListener('change', () => {
            query.StartIndex = 0;
            if (chkFutureEpisode.checked) {
                query.IsUnaired = true;
                query.IsVirtualUnaired = null;
            } else {
                query.IsUnaired = null;
                query.IsVirtualUnaired = false;
            }
            Events.trigger(this, 'filterchange');
        });

        const chkSubtitle = context.querySelector('#chkSubtitle') as HTMLInputElement;
        chkSubtitle?.addEventListener('change', () => {
            query.StartIndex = 0;
            query.HasSubtitles = chkSubtitle.checked ? true : null;
            Events.trigger(this, 'filterchange');
        });

        context.addEventListener('change', e => {
            const target = e.target as HTMLElement;
            const chkGenreFilter = dom.parentWithClass(target, 'chkGenreFilter');
            if (chkGenreFilter) {
                const checkbox = chkGenreFilter as HTMLInputElement;
                const filterName = chkGenreFilter.getAttribute('data-filter') || '';
                let filters = query.Genres || '';
                const delimiter = '|';
                filters = filters
                    .split(delimiter)
                    .filter(f => f !== filterName)
                    .join(delimiter);
                if (checkbox.checked) {
                    filters = filters ? filters + delimiter + filterName : filterName;
                }
                query.StartIndex = 0;
                query.Genres = filters;
                Events.trigger(this, 'filterchange');
                return;
            }

            const chkTagFilter = dom.parentWithClass(target, 'chkTagFilter');
            if (chkTagFilter) {
                const checkbox = chkTagFilter as HTMLInputElement;
                const filterName = chkTagFilter.getAttribute('data-filter') || '';
                let filters = query.Tags || '';
                const delimiter = '|';
                filters = filters
                    .split(delimiter)
                    .filter(f => f !== filterName)
                    .join(delimiter);
                if (checkbox.checked) {
                    filters = filters ? filters + delimiter + filterName : filterName;
                }
                query.StartIndex = 0;
                query.Tags = filters;
                Events.trigger(this, 'filterchange');
                return;
            }

            const chkYearFilter = dom.parentWithClass(target, 'chkYearFilter');
            if (chkYearFilter) {
                const checkbox = chkYearFilter as HTMLInputElement;
                const filterName = chkYearFilter.getAttribute('data-filter') || '';
                let filters = query.Years || '';
                const delimiter = ',';
                filters = filters
                    .split(delimiter)
                    .filter(f => f !== filterName)
                    .join(delimiter);
                if (checkbox.checked) {
                    filters = filters ? filters + delimiter + filterName : filterName;
                }
                query.StartIndex = 0;
                query.Years = filters;
                Events.trigger(this, 'filterchange');
                return;
            }

            const chkOfficialRatingFilter = dom.parentWithClass(target, 'chkOfficialRatingFilter');
            if (chkOfficialRatingFilter) {
                const checkbox = chkOfficialRatingFilter as HTMLInputElement;
                const filterName = chkOfficialRatingFilter.getAttribute('data-filter') || '';
                let filters = query.OfficialRatings || '';
                const delimiter = '|';
                filters = filters
                    .split(delimiter)
                    .filter(f => f !== filterName)
                    .join(delimiter);
                if (checkbox.checked) {
                    filters = filters ? filters + delimiter + filterName : filterName;
                }
                query.StartIndex = 0;
                query.OfficialRatings = filters;
                Events.trigger(this, 'filterchange');
            }
        });
    }

    show(): Promise<void> {
        return new Promise(resolve => {
            const dlg = dialogHelper.createDialog({
                removeOnClose: true,
                modal: false
            }) as HTMLElement;
            dlg.classList.add('ui-body-a');
            dlg.classList.add('background-theme-a');
            dlg.classList.add('formDialog');
            dlg.classList.add('filterDialog');
            dlg.innerHTML = globalize.translateHtml(template);
            setVisibility(dlg, this.options);
            dialogHelper.open(dlg);
            dlg.addEventListener('close', () => {
                resolve();
            });
            updateFilterControls(dlg, this.options);
            this.bindEvents(dlg);

            if (enableDynamicFilters(this.options.mode)) {
                dlg.classList.add('dynamicFilterDialog');
                const apiClient = ServerConnections.getApiClient(this.options.serverId);
                if (apiClient) {
                    loadDynamicFilters(dlg, apiClient, apiClient.getCurrentUserId(), this.options.query);
                }
            }
        });
    }
}

export default FilterDialog;
