import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import fullscreen from '../../utils/fullscreen';

import { ServerConnections } from 'lib/jellyfin-apiclient';
import browser from 'scripts/browser';
import TouchHelper from 'scripts/touchHelper';
import { toApi } from 'utils/jellyfin-apiclient/compat';

import loading from '../../components/loading/loading';
import keyboardnavigation from '../../scripts/keyboardNavigation';
import dialogHelper from '../../components/dialogHelper/dialogHelper';
import TableOfContents from './tableOfContents';
import { translateHtml } from '../../lib/globalize';
import * as userSettings from '../../scripts/settings/userSettings';
import { PluginType } from '../../types/plugin';
import Events from '../../utils/events';
import { useBookStore } from '../../store/bookStore';

import '../../elements/emby-button/paper-icon-button-light';

import html from './template.html?raw';
import './style.scss';

const THEMES: Record<string, any> = {
    dark: { body: { color: '#d8dadc', background: '#000', 'font-size': 'medium' } },
    sepia: { body: { color: '#d8a262', background: '#000', 'font-size': 'medium' } },
    light: { body: { color: '#000', background: '#fff', 'font-size': 'medium' } }
};
const THEME_ORDER = ['dark', 'sepia', 'light'];
const FONT_SIZES = ['x-small', 'small', 'medium', 'large', 'x-large'];

export class BookPlayer {
    name: string = 'Book Player';
    type: any = PluginType.MediaPlayer;
    id: string = 'bookplayer';
    isLocalPlayer: boolean = true;
    priority: number = 1;

    theme: 'dark' | 'sepia' | 'light' = 'dark';
    fontSize: string = 'medium';
    item: any;
    mediaElement: any;
    rendition: any;
    tocElement: any;
    touchHelper: any;
    loaded: boolean = false;
    cancellationToken: boolean = false;
    progress: number = 0;
    streamInfo: any;
    currentSrc: string = '';

    constructor() {
        if (!userSettings.theme() || userSettings.theme() === 'dark') {
            this.theme = 'dark';
        } else {
            this.theme = 'light';
        }

        this.onDialogClosed = this.onDialogClosed.bind(this);
        this.openTableOfContents = this.openTableOfContents.bind(this);
        this.rotateTheme = this.rotateTheme.bind(this);
        this.increaseFontSize = this.increaseFontSize.bind(this);
        this.decreaseFontSize = this.decreaseFontSize.bind(this);
        this.previous = this.previous.bind(this);
        this.next = this.next.bind(this);
        this.onWindowKeyDown = this.onWindowKeyDown.bind(this);
        this.addSwipeGestures = this.addSwipeGestures.bind(this);
    }

    play(options: any) {
        this.progress = 0;
        this.cancellationToken = false;
        this.loaded = false;

        loading.show();
        const elem = this.createMediaElement();
        return this.setCurrentSrc(elem, options);
    }

    stop() {
        this.unbindEvents();

        const stopInfo = {
            src: this.item
        };

        Events.trigger(this, 'stopped', [stopInfo]);

        const elem = this.mediaElement;
        const tocElement = this.tocElement;
        const rendition = this.rendition;

        if (elem) {
            dialogHelper.close(elem);
            this.mediaElement = null;
        }

        if (tocElement) {
            tocElement.destroy();
            this.tocElement = null;
        }

        if (rendition) {
            rendition.destroy();
        }

        loading.hide();
        this.cancellationToken = true;
        useBookStore.getState().reset();
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

    onWindowKeyDown(e: KeyboardEvent) {
        if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;

        const key = (keyboardnavigation as any).getKeyName(e);

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
            case 'Escape':
                e.preventDefault();
                if (this.tocElement) {
                    this.tocElement.destroy();
                } else {
                    this.stop();
                }
                break;
        }
    }

    addSwipeGestures(element: HTMLElement) {
        this.touchHelper = new (TouchHelper as any)(element);
        Events.on(this.touchHelper, 'swipeleft', () => this.next());
        Events.on(this.touchHelper, 'swiperight', () => this.previous());
    }

    onDialogClosed() {
        this.stop();
    }

    bindMediaElementEvents() {
        const elem = this.mediaElement;

        elem.addEventListener('close', this.onDialogClosed, { once: true });
        elem.querySelector('#btnBookplayerExit').addEventListener('click', this.onDialogClosed, { once: true });
        elem.querySelector('#btnBookplayerToc').addEventListener('click', this.openTableOfContents);
        elem.querySelector('#btnBookplayerFullscreen').addEventListener('click', () => this.toggleFullscreen());
        elem.querySelector('#btnBookplayerRotateTheme').addEventListener('click', this.rotateTheme);
        elem.querySelector('#btnBookplayerIncreaseFontSize').addEventListener('click', this.increaseFontSize);
        elem.querySelector('#btnBookplayerDecreaseFontSize').addEventListener('click', this.decreaseFontSize);
        elem.querySelector('#btnBookplayerPrev')?.addEventListener('click', () => this.previous());
        elem.querySelector('#btnBookplayerNext')?.addEventListener('click', () => this.next());
    }

    bindEvents() {
        this.bindMediaElementEvents();

        document.addEventListener('keydown', this.onWindowKeyDown);
        this.rendition?.on('keydown', this.onWindowKeyDown);

        if (browser.safari) {
            const player = document.getElementById('bookPlayerContainer');
            if (player) this.addSwipeGestures(player);
        } else {
            this.rendition?.on('rendered', (_e: any, i: any) => this.addSwipeGestures(i.document.documentElement));
        }
    }

    unbindEvents() {
        const elem = this.mediaElement;
        if (elem) {
            elem.removeEventListener('close', this.onDialogClosed);
            // ... other unbinds if needed
        }

        document.removeEventListener('keydown', this.onWindowKeyDown);
        this.rendition?.off('keydown', this.onWindowKeyDown);

        this.touchHelper?.destroy();
    }

    openTableOfContents() {
        if (this.loaded) {
            this.tocElement = new (TableOfContents as any)(this);
        }
    }

    toggleFullscreen() {
        if (fullscreen.isEnabled) {
            const icon = document.querySelector('#btnBookplayerFullscreen .material-icons');
            if (icon) {
                icon.classList.remove(fullscreen.isFullscreen ? 'fullscreen_exit' : 'fullscreen');
                icon.classList.add(fullscreen.isFullscreen ? 'fullscreen' : 'fullscreen_exit');
            }
            fullscreen.toggle();
        }
    }

    rotateTheme() {
        if (this.loaded) {
            const newTheme = THEME_ORDER[(THEME_ORDER.indexOf(this.theme) + 1) % THEME_ORDER.length] as
                | 'dark'
                | 'sepia'
                | 'light';
            this.rendition.themes.register('default', THEMES[newTheme]);
            this.rendition.themes.update('default');
            this.theme = newTheme;
            useBookStore.getState().setTheme(newTheme);
        }
    }

    increaseFontSize() {
        if (this.loaded && this.fontSize !== FONT_SIZES[FONT_SIZES.length - 1]) {
            const newFontSize = FONT_SIZES[FONT_SIZES.indexOf(this.fontSize) + 1];
            this.rendition.themes.fontSize(newFontSize);
            this.fontSize = newFontSize;
            useBookStore.getState().setFontSize(newFontSize);
        }
    }

    decreaseFontSize() {
        if (this.loaded && this.fontSize !== FONT_SIZES[0]) {
            const newFontSize = FONT_SIZES[FONT_SIZES.indexOf(this.fontSize) - 1];
            this.rendition.themes.fontSize(newFontSize);
            this.fontSize = newFontSize;
            useBookStore.getState().setFontSize(newFontSize);
        }
    }

    previous(e?: Event) {
        e?.preventDefault();
        if (this.rendition) {
            this.rendition.book.package.metadata.direction === 'rtl' ? this.rendition.next() : this.rendition.prev();
        }
    }

    next(e?: Event) {
        e?.preventDefault();
        if (this.rendition) {
            this.rendition.book.package.metadata.direction === 'rtl' ? this.rendition.prev() : this.rendition.next();
        }
    }

    createMediaElement() {
        let elem = this.mediaElement;
        if (elem) return elem;

        elem = document.getElementById('bookPlayer');
        if (!elem) {
            elem = dialogHelper.createDialog({
                exitAnimationDuration: 400,
                size: 'fullscreen',
                autoFocus: false,
                scrollY: false,
                exitAnimation: 'fadeout',
                removeOnClose: true
            });

            elem.id = 'bookPlayer';
            elem.innerHTML = translateHtml(html);
            dialogHelper.open(elem);
        }

        this.mediaElement = elem;
        return elem;
    }

    setCurrentSrc(elem: HTMLElement, options: any) {
        const item = options.items[0];
        this.item = item;

        useBookStore.getState().setCurrentBook(item.Id, 0);

        return new Promise<void>((resolve, reject) => {
            import('epubjs').then(({ default: epubjs }) => {
                const api = toApi(ServerConnections.getApiClient(item.ServerId));
                const downloadHref = (getLibraryApi(api) as any).getDownloadUrl({ itemId: item.Id });
                const book = epubjs(downloadHref, { openAs: 'epub' });

                const clientHeight = document.body.clientHeight;
                const renderHeight = clientHeight - clientHeight * 0.0425;

                const rendition = book.renderTo('bookPlayerContainer', {
                    width: '100%',
                    height: renderHeight,
                    flow: 'paginated'
                });

                this.currentSrc = downloadHref;
                this.rendition = rendition;

                rendition.themes.register('default', THEMES[this.theme]);
                rendition.themes.select('default');

                return rendition.display().then(
                    () => {
                        const epubElem = document.querySelector('.epub-container') as HTMLElement;
                        if (epubElem) epubElem.style.opacity = '0';

                        this.bindEvents();

                        return (this.rendition.book.locations as any).generate(1024).then(async () => {
                            if (this.cancellationToken) reject();

                            const percentageTicks = options.startPositionTicks / 10000000;
                            if (percentageTicks !== 0.0) {
                                const resumeLocation = (book.locations as any).cfiFromPercentage(percentageTicks);
                                await rendition.display(resumeLocation);
                            }

                            this.loaded = true;
                            if (epubElem) epubElem.style.opacity = '';
                            rendition.on('relocated', (locations: any) => {
                                this.progress = (book.locations as any).percentageFromCfi(locations.start.cfi);
                                useBookStore.getState().setPage(Math.round(this.progress * 100));
                            });

                            loading.hide();
                            useBookStore.getState().setLoaded(true);
                            return resolve();
                        });
                    },
                    () => {
                        console.error('failed to display epub');
                        return reject();
                    }
                );
            });
        });
    }

    canPlayMediaType(mediaType: string) {
        return (mediaType || '').toLowerCase() === 'book';
    }

    canPlayItem(item: any) {
        return item.Path?.toLowerCase().endsWith('epub');
    }
}

export default BookPlayer;
