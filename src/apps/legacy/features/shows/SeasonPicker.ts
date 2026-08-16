import type { Api } from '@jellyfin/sdk/lib/api';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import escapeHtml from 'escape-html';

import cardBuilder from 'components/cardbuilder/cardBuilder';
import { CardShape } from 'components/cardbuilder/utils/shape';
import imageLoader from 'components/images/imageLoader';
import itemContextMenu from 'components/itemContextMenu';
import layoutManager from 'components/layoutManager';
import listView from 'components/listview/listview';
import itemShortcuts from 'components/shortcuts';
import { EventType } from 'constants/eventType';
import { ItemAction } from 'constants/itemAction';
import globalize from 'lib/globalize';
import dom from 'utils/dom';
import Events from 'utils/events';
import { queryClient } from 'utils/query/queryClient';

import { getEpisodesQuery } from './api/getEpisodesQuery';
import { getSeasonsQuery } from './api/getSeasonsQuery';
import { getPreferredSeasonId } from './utils/seasons';

const SEASON_FIELDS = [
    ItemFields.ItemCounts,
    ItemFields.PrimaryImageAspectRatio,
    ItemFields.CanDelete,
    ItemFields.MediaSourceCount
];

const EPISODE_FIELDS = [ ...SEASON_FIELDS, ItemFields.Overview ];

/** Marks the season whose episodes are listed below the picker. */
const SELECTED_CARD_CLASS = 'seasonCard-selected';

/** A button element upgraded by the emby-playstatebutton custom element. */
type EmbyPlaystateButtonElement = HTMLElement & {
    setItem: (item: BaseItemDto | null) => void;
};

export interface SeasonPickerOptions {
    /**
     * Called with the season the picker is showing, on load and on every change.
     * The page uses this to keep the season in the url.
     */
    onSeasonChange?: (seasonId: string) => void;
}

interface SeasonPickerElements {
    /** The collapsible section holding the whole picker and episode list. */
    section: HTMLElement;
    /** The row holding the season heading, the dropdown and the menu button. */
    header: HTMLElement;
    /** Shared children heading, carrying the "Seasons" title. */
    title: HTMLElement;
    selectContainer: HTMLElement;
    select: HTMLSelectElement;
    /** Toggles played state for the selected season. */
    playstateButton: EmbyPlaystateButtonElement;
    /** Opens the standard item context menu for the selected season. */
    menuButton: HTMLElement;
    cardsContainer: HTMLElement;
    cards: HTMLElement;
    episodesTitle: HTMLElement;
    episodes: HTMLElement;
}

/**
 * Season picker and episode list for the series details page.
 *
 * Switching seasons swaps the episode list in place instead of navigating to a
 * season page. Seasons and episodes are read through TanStack Query, so flipping
 * back to a season already viewed reuses the cached response.
 *
 * The picker adapts to the layout: a dropdown on desktop and mobile, and a row of
 * season cards on TV, where a dropdown is a poor fit for a D-pad and browsing by
 * artwork matters more.
 */
export class SeasonPicker {
    private readonly elements: SeasonPickerElements;
    private readonly options: SeasonPickerOptions;
    private readonly onSelectChange: () => void;
    private readonly onCardsClick: (e: Event) => void;
    private readonly onMenuClick: () => void;
    private readonly onRefreshNeeded: () => void;

    private api?: Api;
    private series?: BaseItemDto;
    private user?: UserDto;
    private seasons: BaseItemDto[] = [];
    /** The season currently rendered, used to discard superseded responses. */
    private currentSeasonId?: string;

    /**
     * Binds to the season picker markup in a view. Returns null when the view does
     * not contain it, so a caller can no-op rather than fail the whole page.
     */
    static create(view: HTMLElement, options: SeasonPickerOptions = {}): SeasonPicker | null {
        const section = view.querySelector<HTMLElement>('#childrenCollapsible');
        const header = section?.querySelector<HTMLElement>('.seasonPickerHeader');
        const elements = {
            section,
            header,
            title: header?.querySelector<HTMLElement>('.sectionTitle'),
            selectContainer: view.querySelector<HTMLElement>('.seasonSelectContainer'),
            select: view.querySelector<HTMLSelectElement>('.selectSeason'),
            playstateButton: view.querySelector<EmbyPlaystateButtonElement>('.btnSeasonPlaystate'),
            menuButton: view.querySelector<HTMLElement>('.btnSeasonMenu'),
            cardsContainer: view.querySelector<HTMLElement>('.seasonCardsContainer'),
            cards: view.querySelector<HTMLElement>('.seasonCards'),
            episodesTitle: view.querySelector<HTMLElement>('.seasonEpisodesTitle'),
            episodes: section?.querySelector<HTMLElement>('.itemsContainer')
        };

        const missing = Object.entries(elements)
            .filter(([, element]) => !element)
            .map(([name]) => name);

        if (missing.length) {
            console.error('[SeasonPicker] view is missing markup', missing);
            return null;
        }

        return new SeasonPicker(elements as SeasonPickerElements, options);
    }

    private constructor(elements: SeasonPickerElements, options: SeasonPickerOptions) {
        this.elements = elements;
        this.options = options;

        this.onSelectChange = () => {
            void this.renderEpisodes(elements.select.value);
        };

        this.onCardsClick = (e: Event) => {
            // Season cards are built with ItemAction.None, so nothing else claims the
            // click and selecting one swaps the list rather than navigating.
            const card = dom.parentWithClass(e.target as HTMLElement, 'card') as HTMLElement | null;
            const seasonId = card?.getAttribute('data-id');

            if (!seasonId || seasonId === this.currentSeasonId) return;

            this.markSelectedCard(seasonId);
            void this.renderEpisodes(seasonId);
        };

        this.onMenuClick = () => {
            const season = this.seasons.find(({ Id }) => Id === this.currentSeasonId);

            if (!season || !this.user) return;

            // "from here" commands walk the sibling cards of the element they were
            // opened from. That reads correctly on the card row, but this button is a
            // single control, so they would silently degenerate to playing one season.
            itemContextMenu.show({
                item: season,
                user: this.user,
                positionTo: elements.menuButton,
                play: true,
                queue: true,
                shuffle: true,
                playAllFromHere: false,
                queueAllFromHere: false
            })
                .then(result => {
                    if (result.updated || result.deleted) void this.refresh();
                })
                .catch(() => { /* menu dismissed */ });
        };

        // A season command (delete, edit, mark played) reports back with a global
        // refresh event, since neither the picker nor the card row is an items
        // container that could refresh itself.
        this.onRefreshNeeded = () => {
            if (!this.currentSeasonId) return;
            void this.refresh();
        };

        elements.select.addEventListener('change', this.onSelectChange);
        elements.cards.addEventListener('click', this.onCardsClick);
        elements.menuButton.addEventListener('click', this.onMenuClick);

        // On TV the season cards take commands from the remote: menu opens the same
        // context menu, play starts the season. Cards carry ItemAction.None, so a plain
        // click still falls through to selecting a season.
        itemShortcuts.on(elements.cards);

        Events.on(document, EventType.REFRESH_NEEDED, this.onRefreshNeeded);
    }

    /**
     * Hides the picker chrome. The section is shared with every other item type, so
     * this must run before rendering children of anything that is not a series.
     */
    hide(): void {
        const { section, selectContainer, cardsContainer, episodesTitle, menuButton, playstateButton } = this.elements;

        selectContainer.classList.add('hide');
        cardsContainer.classList.add('hide');
        episodesTitle.classList.add('hide');
        menuButton.classList.add('hide');
        playstateButton.classList.add('hide');
        playstateButton.setItem(null);
        this.elements.episodes.classList.remove('seasonEpisodes');
        this.seasons = [];
        section.classList.remove('verticalSection-extrabottompadding');
        this.currentSeasonId = undefined;
    }

    /**
     * Renders the picker for a series and loads the preferred season's episodes.
     *
     * @param nextUpEpisode The episode Next Up is offering, if any. The picker opens
     * on its season so the page points at the same episode everywhere.
     * @param requestedSeasonId A season from the url, which takes priority so a
     * refreshed or shared page reopens where the user left off.
     */
    async render(
        api: Api,
        series: BaseItemDto,
        user: UserDto,
        nextUpEpisode: BaseItemDto | null,
        requestedSeasonId?: string | null
    ): Promise<void> {
        const { section, episodesTitle } = this.elements;

        this.api = api;
        this.series = series;
        this.user = user;

        if (!series.Id || !user.Id) return;

        let seasons: BaseItemDto[];

        try {
            const result = await queryClient.fetchQuery(getSeasonsQuery(api, {
                seriesId: series.Id,
                userId: user.Id,
                fields: SEASON_FIELDS
            }));

            seasons = result.Items ?? [];
        } catch (err) {
            console.error('[SeasonPicker] failed to load seasons', err);
            section.classList.add('hide');
            return;
        }

        this.seasons = seasons;

        const preferredId = getPreferredSeasonId(seasons, nextUpEpisode, requestedSeasonId);

        if (!preferredId) {
            section.classList.add('hide');
            return;
        }

        if (layoutManager.tv) {
            this.renderCards(seasons, preferredId);
        } else {
            this.renderDropdown(seasons, preferredId);
        }

        episodesTitle.classList.remove('hide');
        section.classList.remove('hide');
        section.classList.add('verticalSection-extrabottompadding');

        return this.renderEpisodes(preferredId);
    }

    /** Drops cached seasons and episodes for the rendered series. */
    invalidate(): void {
        if (!this.series?.Id || !this.user?.Id) return;

        void queryClient.invalidateQueries({
            queryKey: [ 'User', this.user.Id, 'Items', this.series.Id ]
        });
    }

    /** Reloads the picker and the current season after a season was changed. */
    private async refresh(): Promise<void> {
        const { api, series, user, currentSeasonId } = this;

        if (!api || !series || !user) return;

        this.invalidate();
        return this.render(api, series, user, null, currentSeasonId);
    }

    destroy(): void {
        this.elements.select.removeEventListener('change', this.onSelectChange);
        this.elements.cards.removeEventListener('click', this.onCardsClick);
        this.elements.menuButton.removeEventListener('click', this.onMenuClick);
        itemShortcuts.off(this.elements.cards);
        Events.off(document, EventType.REFRESH_NEEDED, this.onRefreshNeeded);

        this.api = undefined;
        this.series = undefined;
        this.user = undefined;
        this.seasons = [];
        this.currentSeasonId = undefined;
    }

    /**
     * Shows the "Seasons" heading, which is the same element and classes the "Episodes"
     * heading below the picker uses, so the two read as a pair.
     */
    private renderTitle(visible: boolean): void {
        const { title } = this.elements;

        title.classList.toggle('hide', !visible);

        const titleText = title.querySelector('span');
        if (titleText) titleText.innerText = globalize.translate('HeaderSeasons');
    }

    private renderDropdown(seasons: BaseItemDto[], selectedId: string): void {
        const { select, selectContainer, cardsContainer } = this.elements;

        cardsContainer.classList.add('hide');

        // The visible heading names the control, so emby-select's own label is left
        // empty and hidden. The markup carries a screen reader only label instead.
        select.innerHTML = seasons.map(season => {
            const selected = season.Id === selectedId ? ' selected' : '';
            return `<option value="${season.Id}"${selected}>${escapeHtml(season.Name ?? '')}</option>`;
        }).join('');

        this.renderTitle(seasons.length > 1);
        selectContainer.classList.toggle('hide', seasons.length < 2);
    }

    private renderCards(seasons: BaseItemDto[], selectedId: string): void {
        const { cards, cardsContainer, selectContainer } = this.elements;

        selectContainer.classList.add('hide');

        if (seasons.length < 2) {
            cardsContainer.classList.add('hide');
            this.renderTitle(false);
            cards.innerHTML = '';
            return;
        }

        this.renderTitle(true);

        // No overlay play button: cardBuilder only emits focusable <button> cards on TV
        // when a card has no overlay buttons, and these cards select rather than play.
        cards.innerHTML = cardBuilder.getCardsHtml({
            items: seasons,
            shape: CardShape.PortraitOverflow,
            showTitle: true,
            centerText: true,
            lazy: true,
            action: ItemAction.None
        });

        cardsContainer.classList.remove('hide');
        imageLoader.lazyChildren(cards);
        this.markSelectedCard(selectedId);
    }

    /**
     * Points the season controls at the selected season. They are shown alongside the
     * picker, so a series with a single season keeps the page as it was.
     */
    private updateSeasonControls(seasonId: string): void {
        const { menuButton, playstateButton, selectContainer, cardsContainer } = this.elements;
        const hasPicker = !selectContainer.classList.contains('hide')
            || !cardsContainer.classList.contains('hide');
        const season = this.seasons.find(({ Id }) => Id === seasonId);

        menuButton.classList.toggle('hide', !hasPicker);
        playstateButton.classList.toggle('hide', !hasPicker || !season);
        playstateButton.setItem(season ?? null);
    }

    private markSelectedCard(seasonId: string): void {
        for (const card of this.elements.cards.querySelectorAll('.card')) {
            card.classList.toggle(SELECTED_CARD_CLASS, card.getAttribute('data-id') === seasonId);
        }
    }

    /** Swaps the episode list under the picker without leaving the page. */
    private async renderEpisodes(seasonId: string): Promise<void> {
        const { episodes } = this.elements;
        const { api, series, user } = this;
        const userId = user?.Id;

        if (!api || !series?.Id || !userId) return;

        this.currentSeasonId = seasonId;
        this.options.onSeasonChange?.(seasonId);
        this.updateSeasonControls(seasonId);

        episodes.classList.remove('scrollX', 'hiddenScrollX', 'smoothScrollX', 'vertical-wrap');
        episodes.classList.add('vertical-list', 'seasonEpisodes');

        if (layoutManager.mobile) {
            episodes.classList.remove('padded-right');
        }

        let items: BaseItemDto[];

        try {
            const result = await queryClient.fetchQuery(getEpisodesQuery(api, {
                seriesId: series.Id,
                seasonId,
                userId,
                fields: EPISODE_FIELDS
            }));

            items = result.Items ?? [];
        } catch (err) {
            console.error('[SeasonPicker] failed to load episodes for season', err);
            return;
        }

        // A newer selection may have landed while the request was in flight.
        if (this.currentSeasonId !== seasonId) return;

        // enableOverview renders each episode's full synopsis, which is why this is a
        // list rather than a card row. Matches the options the season page itself uses.
        episodes.innerHTML = listView.getListViewHtml({
            items,
            showIndexNumber: false,
            enableOverview: true,
            enablePlayedButton: !layoutManager.mobile,
            infoButton: !layoutManager.mobile,
            imageSize: 'large',
            enableSideMediaInfo: false,
            highlight: false,
            action: layoutManager.desktop ? ItemAction.None : ItemAction.Link,
            imagePlayButton: true,
            includeParentInfoInTitle: false
        });

        imageLoader.lazyChildren(episodes);
    }
}
