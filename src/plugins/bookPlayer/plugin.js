import 'material-design-icons-iconfont';

import loading from '../../components/loading/loading';
import keyboardnavigation from '../../scripts/keyboardNavigation';
import dialogHelper from '../../components/dialogHelper/dialogHelper';
import Screenfull from 'screenfull';
import { translateHtml } from '../../lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import browser from 'scripts/browser';
import { currentSettings as userSettings } from '../../scripts/settings/userSettings';
import TouchHelper from 'scripts/touchHelper';
import { PluginType } from '../../types/plugin.ts';
import Events from '../../utils/events.ts';
import globalize from '../../lib/globalize';
import * as EpubJS from 'epubjs';
import actionSheet from '../../components/actionSheet/actionSheet';

import '../../elements/emby-button/paper-icon-button-light';

const ColorSchemes = {
    'dark': {
        'color': '#d8dadc',
        'background': '#202124',
    },
    'black': {
        'color': '#d8dadc',
        'background': '#000',
    },
    'sepia': {
        'color': '#d8a262',
        'background': '#202124',
    },
    'light': {
        'color': '#000',
        'background': '#fff',
    }
};

/**
 * Get Cfi from href
 * @param {EpubJS.Book} book 
 * @param {string} href 
 * @returns 
 */
function getCfiFromHref(book, href) {
    const [_, id] = href.split('#');
    const section = book.spine.get(href);
    return section?.cfiFromRange();
}

/**
 * Flatten chapters
 * @param {EpubJS.NavItem[]} chapters
 * @param {EpubJS.NavItem} [parent]
 * @param {number} [depth]
 * @returns {object[]}
 */
function flattenChapters(chapters, parent, depth) {
    return [].concat.apply([], chapters.map((chapter) => {
        chapter.parent = parent;
        chapter.depth = ~~depth;
        return [].concat.apply([chapter], flattenChapters(chapter.subitems, chapter, chapter.depth+1));
    }));
}

/**
 * Convert float to percent string
 * @param {number} percent 
 * @returns
 */
function percentToString(percent) {
    return `${(percent * 100).toFixed(2).replace(/(\d)[\.0]+$/, '$1')}%`;
}

export class BookPlayer {
    #epubDialog;
    #mediaElement;
    #cacheStore;
    #flattenedToc;
    #displayConfig;
    #displayConfigItems = {
        colorScheme: {
            label: globalize.translate('LabelTheme'),
            type: 'select',
            handler: e => {
                this.#displayConfig.colorScheme = e.target.value;
                this.#applyDisplayConfig();
                this.#saveDisplayConfig();
            },
            default: () => this.#displayConfig.colorScheme,
            values: Object.keys(ColorSchemes),
        },
        fontFamily: {
            label: globalize.translate('LabelFont'),
            type: 'select',
            handler: e => this.#displayConfigCssSimpleHandler('font-family', e.target.value),
            default: () => this.#displayConfigCssSimpleHandler('font-family'),
            values: {
                'unset': globalize.translate('BookPlayerDisplayUnset'),
                'serif': 'serif',
                'sans-serif': 'sans-serif',
            },
        },
        fontSize: {
            label: globalize.translate('LabelTextSize'),
            type: 'select',
            handler: e => this.#displayConfigCssSimpleHandler('font-size', e.target.value),
            default: () => this.#displayConfigCssSimpleHandler('font-size'),
            values: {
                'unset': globalize.translate('BookPlayerDisplayUnset'),
                'x-small': globalize.translate('Smaller'),
                'small': globalize.translate('Small'),
                'medium': globalize.translate('Normal'),
                'large': globalize.translate('Large'),
                'x-large': globalize.translate('Larger'),
            },
        },
        lineHeight: {
            label: globalize.translate('LabelLineHeight'),
            type: 'select',
            handler: e => this.#displayConfigCssSimpleHandler('line-height', e.target.value),
            default: () => this.#displayConfigCssSimpleHandler('line-height'),
            values: {
                'unset': globalize.translate('BookPlayerDisplayUnset'),
                '2.025em': '2.025em',
                '2.3625em': '2.3625em',
                '2.7em': '2.7em',
                '3.0375em': '3.0375em',
                '3.375em': '3.375em',
                '3.7125em': '3.7125em',
                '4.05em': '4.05em',
                '4.725em': '4.725em',
                '5.4em': '5.4em',
            },
        },
    };

    #loadDisplayConfig() {
        try {
            const loadedConfig = JSON.parse(userSettings.get('bookplayer-displayconfig', false));
            for(const key in this.#displayConfig) {
                if(loadedConfig[key] === undefined) continue;
                if((typeof loadedConfig[key]) !== (typeof this.#displayConfig[key])) continue;
                this.#displayConfig[key] = loadedConfig[key];
            }
        } catch {}
    }

    /**
     * 
     * @param {Event}
     */
    #saveDisplayConfig() {
        userSettings.set('bookplayer-displayconfig', JSON.stringify(this.#displayConfig), false);
    }

    #applyDisplayConfig() {
        const theme = {
            'body[style]': {...ColorSchemes[this.#displayConfig.colorScheme], ...this.#displayConfig.bodyCss},
        };
        this.rendition.themes.register('default', theme);
        this.rendition.themes.select('default');
    }

    /**
     * 
     * @param {string} name Name of css property
     * @param {string} value
     * @returns {string}
     */
    #displayConfigCssSimpleHandler(name, value) {
        if(value === undefined) {
            return this.#displayConfig.bodyCss[name];
        }

        if(value) {
            this.#displayConfig.bodyCss[name] = value;
        }
        else {
            this.#displayConfig.bodyCss[name] = 'unset';
        }
        this.#applyDisplayConfig();
        this.#saveDisplayConfig();
    }

    /**
     * 
     * @param {EpubJS.EpubCFI} cfi 
     * @returns {EpubJS.NavItem}
     */
    #getChapterFromCfi(cfi) {
        let i;
        for(i=0;i<this.#flattenedToc.length && EpubJS.EpubCFI.prototype.compare(cfi, this.#flattenedToc[i].cfi) > 0;i++);;
        return this.#flattenedToc[i-1];
    }

    /**
     * 
     * @param {string} query 
     * @returns 
     */
    async #getSearchResult(query) {
        const {book} = this.rendition;
        const resultsPerSpine = await Promise.all(book.spine.spineItems.map(item => item.load(book.load.bind(book)).then(item.find.bind(item, query)).finally(item.unload.bind(item))));
        /** @type {Object.<string,{cfi:EpubJS.EpubCFI,excerpt:string,chapter:EpubJS.NavItem}>[]} */
        const flattenedResults = [];
        for(const results of resultsPerSpine) {
            if(!results.length) continue;
            const currentChapter = this.#getChapterFromCfi(results[0].cfi);
            for(const result of results) {
                flattenedResults.push(Object.assign({chapter: currentChapter}, result));
            }
        }
        return flattenedResults;
    }

    constructor() {
        this.name = 'Book Player';
        this.type = PluginType.MediaPlayer;
        this.id = 'bookplayer';
        this.priority = 1;

        this.#displayConfig = {
            bodyCss: {},
            colorScheme: ((userSettings.theme()||'dark') === 'dark') ? 'dark' : 'light',
        };

        this.onDialogClosed = this.onDialogClosed.bind(this);
        this.previous = this.previous.bind(this);
        this.next = this.next.bind(this);
        this.gotoPositionAsSlider = this.gotoPositionAsSlider.bind(this);
        this.onWindowKeyDown = this.onWindowKeyDown.bind(this);
        this.onWindowWheel = this.onWindowWheel.bind(this);
        this.addSwipeGestures = this.addSwipeGestures.bind(this);
        this.getBubbleHtml = this.getBubbleHtml.bind(this);
        this.openTableOfContents = this.openTableOfContents.bind(this);
        this.openDisplayConfig = this.openDisplayConfig.bind(this);
        this.openSearch = this.openSearch.bind(this);
    }

    async play(options) {
        window._bookPlayer = this;
        this.progress = 0;
        this.cancellationToken = false;
        this.loaded = false;

        loading.show();
        this.#cacheStore = await caches?.open('epubPlayer');
        this.#loadDisplayConfig();

        const elem = await this.createMediaElement(options);
        await this.setCurrentSrc(elem, options);
    }

    stop() {
        this.unbindEvents();

        const stopInfo = {
            src: this.item
        };

        Events.trigger(this, 'stopped', [stopInfo]);

        const tocElement = this.tocElement;
        const rendition = this.rendition;

        if (tocElement) {
            tocElement.destroy();
            this.tocElement = null;
        }

        if (rendition) {
            rendition.destroy();
        }

        // hide loader in case player was not fully loaded yet
        loading.hide();
        this.cancellationToken = true;

        this.destroy();
    }

    destroy() {
        document.body.classList.remove('hide-scroll');

        const dlg = this.#epubDialog;
        if (dlg) {
            this.#epubDialog = null;

            dlg.parentNode.removeChild(dlg);
        }
    }

    currentItem() {
        return this.item;
    }

    currentTime() {
        return this.progress * 1000;
    }

    duration() {
        return 1000;
    }

    getBufferedRanges() {
        return [{
            start: 0,
            end: 10000000
        }];
    }

    volume() {
        return 100;
    }

    isMuted() {
        return false;
    }

    paused() {
        return false;
    }

    seekable() {
        return true;
    }

    onWindowWheel(e) {
        if (e.deltaY < 0) {
            this.previous();
        }
        else if(e.deltaY > 0) {
            this.next();
        }
    }

    onWindowKeyDown(e) {
        // Skip modified keys
        if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;

        const key = keyboardnavigation.getKeyName(e);

        if (!this.loaded) return;
        switch (key) {
            case 'l':
            case 'ArrowRight':
            case 'Right':
                e.preventDefault();
                this.next();
                break;
            case 'j':
            case 'ArrowLeft':
            case 'Left':
                e.preventDefault();
                this.previous();
                break;
        }
    }

    addSwipeGestures(element) {
        this.touchHelper = new TouchHelper(element);
        Events.on(this.touchHelper, 'swipeleft', () => this.next());
        Events.on(this.touchHelper, 'swiperight', () => this.previous());
    }

    onDialogClosed() {
        this.stop();
    }

    bindMediaElementEvents() {
        this.#epubDialog.addEventListener('close', this.onDialogClosed, { once: true });
        this.#epubDialog.querySelector('.headerBackButton').addEventListener('click', this.onDialogClosed, { once: true });
        this.#epubDialog.querySelector('.headerTocButton').addEventListener('click', this.openTableOfContents);
        this.#epubDialog.querySelector('.headerFullscreenButton').addEventListener('click', this.toggleFullscreen);
        this.#epubDialog.querySelector('.headerTextformatButton').addEventListener('click', this.openDisplayConfig);
        this.#epubDialog.querySelector('.headerSearchButton').addEventListener('click', this.openSearch);
        this.#epubDialog.querySelector('.footerPrevButton').addEventListener('click', this.previous);
        this.#epubDialog.querySelector('.footerNextButton').addEventListener('click', this.next);
        this.#epubDialog.querySelector('.epubPositionSlider').addEventListener('change', this.gotoPositionAsSlider);
        this.#epubDialog.querySelector('.epubPositionSlider').getBubbleHtml = this.getBubbleHtml;
    }

    bindEvents() {
        this.bindMediaElementEvents();

        // document.addEventListener('keydown', this.onWindowKeyDown);
        this.rendition?.on('keydown', this.onWindowKeyDown);
        // document.addEventListener('wheel', this.onWindowWheel);
        this.rendition?.on('rendered', (e, i) => i.document.addEventListener('wheel', this.onWindowWheel));

        if (browser.safari) {
            this.addSwipeGestures(this.#mediaElement);
        } else {
            this.rendition?.on('rendered', (e, i) => this.addSwipeGestures(i.document.documentElement));
        }
    }

    unbindMediaElementEvents() {
        this.#epubDialog.removeEventListener('close', this.onDialogClosed, { once: true });
        this.#epubDialog.querySelector('.headerBackButton').removeEventListener('click', this.onDialogClosed, { once: true });
        this.#epubDialog.querySelector('.headerTocButton').removeEventListener('click', this.openTableOfContents);
        this.#epubDialog.querySelector('.headerFullscreenButton').removeEventListener('click', this.toggleFullscreen);
        this.#epubDialog.querySelector('.headerTextformatButton').removeEventListener('click', this.openDisplayConfig);
        this.#epubDialog.querySelector('.headerSearchButton').removeEventListener('click', this.openSearch);
        this.#epubDialog.querySelector('.footerPrevButton').removeEventListener('click', this.previous);
        this.#epubDialog.querySelector('.footerNextButton').removeEventListener('click', this.next);
        this.#epubDialog.querySelector('.epubPositionSlider').removeEventListener('change', this.gotoPositionAsSlider);
    }

    unbindEvents() {
        if (this.#mediaElement) {
            this.unbindMediaElementEvents();
        }

        document.removeEventListener('keydown', this.onWindowKeyDown);
        this.rendition?.off('keydown', this.onWindowKeyDown);
        // document.removeEventListener('wheel', this.onWindowWheel);
        this.rendition?.off('rendered', (e, i) => i.document.addEventListener('wheel', this.onWindowWheel));

        if (!browser.safari) {
            this.rendition?.off('rendered', (e, i) => this.addSwipeGestures(i.document.documentElement));
        }

        this.touchHelper?.destroy();
    }

    async openTableOfContents(e) {
        if (this.loaded) {
            const currentChapter = this.#getChapterFromCfi(this.rendition.location.start.cfi) || {id: null};
            const {book} = this.rendition;
            const menuOptions = {
                title: globalize.translate('Toc'),
                items: this.#flattenedToc.map(chapter => ({
                    id: `${book.path.directory}${chapter.href.startsWith('../') ? chapter.href.slice(3) : chapter.href}`,
                    name: chapter.label.trim(),
                    icon: (
                        currentChapter.id === chapter.id ? 'chevron_right'
                        : ''
                    ) + (
                        chapter.depth > 0 ? ` indent-${Math.min(9, chapter.depth)}`
                        : ''
                    ),
                    asideText: percentToString(book.locations.percentageFromCfi(chapter.cfi)),
                })),
                positionTo: e.target,
                resolveOnClick: true,
                border: true
            };

            try {
                const id = await actionSheet.show(menuOptions);
                this.rendition.display(book.path.relative(id));
            } catch {}
        }
    }

    async openSearch(e) {
        let inputTimeout = null;
        const displayConfigDlg = dialogHelper.createDialog({
            exitAnimationDuration: 200,
            size: 'epub300',
            autoFocus: false,
            scrollY: false,
            exitAnimation: 'fadeout',
            removeOnClose: true
        });
        displayConfigDlg.innerHTML = translateHtml(await import('./search.html'));

        const inputElem = displayConfigDlg.querySelector('input[type="search"]');
        const resultContainer = displayConfigDlg.querySelector('.actionSheetScroller');
        const annotations = [];
        const removeAnnotations = () => {
            while(annotations.length) {
                const annotation = annotations.pop();
                this.rendition.annotations.remove(annotation.cfiRange, 'highlight');
            }
        };
        const onSearch = async () => {
            removeAnnotations();
            let currentChapter = null;
            const results = (await this.#getSearchResult(inputElem.value)).map(row => {
                const {cfi} = row;
                annotations.push(this.rendition.annotations.highlight(cfi));

                const button = document.createElement('button');
                button.setAttribute('is', 'emby-button');
                button.setAttribute('type', 'button');
                button.setAttribute('data-cfi', row.cfi);
                button.addEventListener('click', e=>this.rendition.display(cfi));
                button.classList.add(
                    'listItem',
                    'listItem-button',
                    'actionSheetMenuItem',
                    'listItem-border',
                    'emby-button',
                );

                {
                    const body = document.createElement('div');
                    body.classList.add(
                        'listItemBody',
                        'actionsheetListItemBody',
                    );

                    if(row.chapter !== currentChapter) {
                        currentChapter = row.chapter;
                        const text = document.createElement('div');
                        text.classList.add(
                            'listItemBodyText',
                            'actionSheetItemText',
                        );
                        text.textContent = currentChapter.label;
                        body.appendChild(text);
                    }

                    {
                        const text = document.createElement('div');
                        text.classList.add(
                            'listItemBodyText',
                            'secondary',
                        );
                        text.textContent = row.excerpt;
                        body.appendChild(text);
                    }

                    button.appendChild(body);
                }
                return button;
            });
            resultContainer.replaceChildren(...results);
        };

        inputElem.addEventListener('input', () => {
            if(inputTimeout) {
                clearTimeout(inputTimeout);
                inputTimeout = null;
            }
            inputTimeout = setTimeout(onSearch, 1000);
        });

        displayConfigDlg.addEventListener('close', () => {
            removeAnnotations();
        });

        dialogHelper.open(displayConfigDlg);

        const pos = actionSheet.getPosition(e.target, {}, displayConfigDlg);
        displayConfigDlg.style.position = 'fixed';
        displayConfigDlg.style.margin = '0';
        displayConfigDlg.style.left = pos.left + 'px';
        displayConfigDlg.style.top = pos.top + 'px';
    }

    async openDisplayConfig(e) {
        const displayConfigDlg = dialogHelper.createDialog({
            exitAnimationDuration: 200,
            size: 'epub300',
            autoFocus: false,
            scrollY: false,
            exitAnimation: 'fadeout',
            removeOnClose: true
        });
        displayConfigDlg.innerHTML = translateHtml(await import('./textformat.html'));
        displayConfigDlg.querySelector('.btnClose').addEventListener('click', e=>dialogHelper.close(displayConfigDlg));

        const form = displayConfigDlg.querySelector('.editEpubDisplaySettingsForm');
        for(const key in this.#displayConfigItems) {
            const item = this.#displayConfigItems[key];
            switch(item.type) {
                case 'select':{
                    const container = document.createElement('div');
                    const select = document.createElement('select');
                    container.classList.add('selectContainer');
                    select.setAttribute('label', item.label);
                    select.setAttribute('is', 'emby-select');
                    /** @type {Object.<string, string>} */
                    const values = (list=>{
                        if(typeof list !== 'object') {
                            return {};
                        }
                        if(list instanceof Array) {
                            return list.reduce((obj, curr) => {
                                obj[curr] = curr;
                                return obj;
                            }, {});
                        }
                        return list;
                    })(item.values);

                    for(const value in values) {
                        const label = values[value];
                        const option = document.createElement('option');
                        option.setAttribute('value', value);
                        option.textContent = label;
                        select.appendChild(option);
                    }

                    select.addEventListener('change', item.handler);

                    let defaultValue = item.default;
                    if(typeof defaultValue === 'function') {
                        defaultValue = defaultValue();
                    }
                    if(typeof defaultValue === 'string') {
                        select.value = defaultValue;
                    }

                    container.appendChild(select);
                    form.appendChild(container);
                }break;
            }
        }

        dialogHelper.open(displayConfigDlg);
    }

    toggleFullscreen() {
        if (Screenfull.isEnabled) {
            Screenfull.toggle();
        }
    }

    previous(e) {
        e?.preventDefault();
        if (this.rendition) {
            this.rendition.book.package.metadata.direction === 'rtl' ? this.rendition.next() : this.rendition.prev();
        }
    }

    next(e) {
        e?.preventDefault();
        if (this.rendition) {
            this.rendition.book.package.metadata.direction === 'rtl' ? this.rendition.prev() : this.rendition.next();
        }
    }

    gotoPositionAsSlider(e) {
        console.log(e);
        const input = e.target;
        if (this.rendition) {
            this.rendition.display(input.value/100);
        }
    }

    getBubbleHtml(value) {
        const cfi = this.rendition.book.locations.cfiFromPercentage(value/100);
        return this.#getChapterFromCfi(cfi).label;
    }

    async createMediaElement(options) {
        const dlg = document.querySelector('.epubPlayerContainer');

        if (!dlg) {
            await import('./style.scss');

            loading.show();
            const playerDlg = document.createElement('div');
            playerDlg.setAttribute('dir', 'ltr');

            playerDlg.classList.add('epubPlayerContainer');

            if (options.fullscreen) {
                playerDlg.classList.add('epubPlayerContainer-onTop');
            }

            playerDlg.innerHTML = translateHtml(await import('./template.html'));

            document.body.insertBefore(playerDlg, document.body.firstChild);
            this.#epubDialog = playerDlg;
            this.#mediaElement = playerDlg.querySelector('.epubPlayer');

            if (options.fullscreen) {
                // At this point, we must hide the scrollbar placeholder, so it's not being displayed while the item is being loaded
                document.body.classList.add('hide-scroll');
            }

            loading.hide();
            this.#epubDialog.querySelector('.epubMediaStatusText').textContent = globalize.translate('BookStatusFetching');
            this.#epubDialog.querySelector('.epubMediaStatus').classList.remove('hide');

            return playerDlg;
        }

        return dlg;
    }

    async #fetchEpub(url) {
        const epubRequest = new Request(url);
        const epubResponse = await (async () => {
            const cacheResponse = await this.#cacheStore?.match(epubRequest);
            const cacheLastModified = cacheResponse?.headers.get('last-modified');
            const originRequest = epubRequest.clone();
            if(cacheLastModified) {
                originRequest.headers.set('if-modified-since', cacheLastModified);
            }
            const originResponse = await fetch(originRequest);
            if(originResponse.status === 304) {
                return cacheResponse;
            }
            if(originResponse.status >= 200 && originResponse.status < 300) {
                this.#cacheStore?.put(epubRequest, originResponse.clone());
                return originResponse;
            }
            throw new TypeError(`Origin returned unexpected response code ${originResponse.status}`);
        })()
        return URL.createObjectURL(await epubResponse.blob());
    }

    async setCurrentSrc(elem, options) {
        const item = options.items[0];
        this.item = item;
        this.streamInfo = {
            started: true,
            ended: false,
            item: this.item,
            mediaSource: {
                Id: item.Id
            }
        };

        const serverId = item.ServerId;
        const apiClient = ServerConnections.getApiClient(serverId);

        if (!Screenfull.isEnabled) {
            this.#epubDialog.querySelector('.headerFullscreenButton').display = 'none';
        }

        this.#epubDialog.querySelector('.pageTitle').textContent = item.Name;
        const epubBlobUrl = await this.#fetchEpub(apiClient.getItemDownloadUrl(item.Id));
        const positionSlider = this.#epubDialog.querySelector('.epubPositionSlider');
        const positionText = this.#epubDialog.querySelector('.epubPositionText');

        this.#epubDialog.querySelector('.epubMediaStatusText').textContent = globalize.translate('BookStatusProcessing');

        const book = new EpubJS.Book(epubBlobUrl, {
            openAs: 'epub',
        });

        const rendition = book.renderTo(this.#mediaElement, {
            width: '100%',
            height: '100%',
            flow: 'paginated',
        });

        this.currentSrc = epubBlobUrl;
        this.rendition = rendition;

        this.#applyDisplayConfig();

        await rendition.display();

        const epubElem = document.querySelector('.epub-container');
        epubElem.style.opacity = '0';

        this.bindEvents();

        await this.rendition.book.locations.generate();
        if (this.cancellationToken) throw new Error;

        const percentageTicks = options.startPositionTicks / 10000000;
        if (percentageTicks !== 0.0) {
            const resumeLocation = book.locations.cfiFromPercentage(percentageTicks);
            await rendition.display(resumeLocation);
        }

        this.#flattenedToc = flattenChapters(book.navigation.toc).map(x=>{
            x.label = x.label.trim();
            x.cfi = getCfiFromHref(book, x.href);
            return x;
        }).filter(x=>x.cfi).sort((a,b) => EpubJS.EpubCFI.prototype.compare(a.cfi,b.cfi));

        this.loaded = true;
        epubElem.style.opacity = '';
        rendition.on('relocated', (locations) => {
            if(this.progress != locations.start.percentage) {
                this.progress = locations.start.percentage;
                Events.trigger(this, 'pause');
            }
            positionSlider.value = locations.start.percentage * 100;
            positionText.textContent = percentToString(locations.start.percentage);
        });

        this.#epubDialog.querySelector('.epubMediaStatus').classList.add('hide');
        this.#epubDialog.querySelector('.footerPrevButton').disabled=false;
        this.#epubDialog.querySelector('.footerNextButton').disabled=false;
        this.#epubDialog.querySelector('.epubPositionSlider').disabled=false;
    }

    canPlayMediaType(mediaType) {
        return (mediaType || '').toLowerCase() === 'book';
    }

    canPlayItem(item) {
        return item.Path?.endsWith('epub');
    }
}

export default BookPlayer;
