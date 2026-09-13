import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';

import { PluginType } from 'constants/pluginType';

import loading from '../../components/loading/loading';
import keyboardnavigation from '../../scripts/keyboardNavigation';
import dialogHelper from '../../components/dialogHelper/dialogHelper';
import TouchHelper from '../../scripts/touchHelper';
import { appRouter } from '../../components/router/appRouter';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import screenSaverManager from 'scripts/screensavermanager';
import Events from '../../utils/events.ts';
import BookOsd from '../bookPlayer/BookOsd/BookOsd';
import { renderComponent } from '../../utils/reactUtils';
import * as userSettings from '../../scripts/settings/userSettings';

import 'material-design-icons-iconfont';
import './style.scss';

const PDF_PLAYER_THEME_KEY = 'pdfPlayerTheme';

export class PdfPlayer {
    constructor() {
        this.name = 'PDF Player';
        this.type = PluginType.MediaPlayer;
        this.id = 'pdfplayer';
        this.priority = 1;

        this.previous = this.previous.bind(this);
        this.next = this.next.bind(this);

        this.onDialogClosed = this.onDialogClosed.bind(this);
        this.onWindowKeyDown = this.onWindowKeyDown.bind(this);
        this.toggleFullscreen = this.toggleFullscreen.bind(this);
        this.toggleTheme = this.toggleTheme.bind(this);

        const savedTheme = userSettings.get(PDF_PLAYER_THEME_KEY, false);
        this.theme = savedTheme || 'light';
    }

    applyTheme() {
        const container = document.querySelector('#pdfPlayer');
        if (container) {
            container.classList.toggle('theme-dark', this.theme === 'dark');
        }
        // Re-render current page with new theme
        if (this.loaded && this.book) {
            this.loadPage(this.progress + 1);
        }
    }

    play(options) {
        this.progress = 0;
        this.loaded = false;
        this.cancellationToken = false;
        this.pages = {};
        this.textLayers = {};

        screenSaverManager.block();
        loading.show();

        const elem = this.createMediaElement(options);
        return this.setCurrentSrc(elem, options);
    }

    stop() {
        this.unbindEvents();
        this.unmountBookOsd?.();
        screenSaverManager.unblock();

        const container = document.querySelector('#pdfPlayer');
        if (container) {
            container.classList.remove('theme-dark');
        }

        const stopInfo = {
            src: this.item
        };

        Events.trigger(this, 'stopped', [stopInfo]);

        const elem = this.mediaElement;
        if (elem) {
            dialogHelper.close(elem);
            this.mediaElement = null;
        }

        loading.hide();
        this.cancellationToken = true;
    }

    destroy() {
        // No cleanup needed - resources released in stop()
    }

    currentItem() {
        return this.item;
    }

    currentTime() {
        return this.progress;
    }

    duration() {
        return this.book ? this.book.numPages : 0;
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

    onWindowKeyDown(e) {
        if (!this.loaded) return;

        if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;

        const key = keyboardnavigation.getKeyName(e);

        switch (key) {
            case 'KeyL':
            case 'ArrowRight':
            case 'Right':
                e.preventDefault();
                this.next();
                break;
            case 'KeyJ':
            case 'ArrowLeft':
            case 'Left':
                e.preventDefault();
                this.previous();
                break;
            case 'Escape':
                e.preventDefault();
                this.stop();
                break;
        }
    }

    addSwipeGestures(element) {
        this.touchHelper = new TouchHelper(element);
        Events.on(this.touchHelper, 'swiperight', () => this.previous());
        Events.on(this.touchHelper, 'swipeleft', () => this.next());
    }

    onDialogClosed() {
        this.stop();
    }

    bindEvents() {
        this.addSwipeGestures(document.querySelector('#container'));
        this.mediaElement?.addEventListener('close', this.onDialogClosed, { once: true });
        document.addEventListener('keydown', this.onWindowKeyDown);
    }

    unbindEvents() {
        this.touchHelper?.destroy();
        this.mediaElement?.removeEventListener('close', this.onDialogClosed);
        document.removeEventListener('keydown', this.onWindowKeyDown);
    }

    toggleFullscreen() {
        setTimeout(() => this.loadPage(this.progress + 1), 200);
    }

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        userSettings.set(PDF_PLAYER_THEME_KEY, this.theme, false);
        this.applyTheme();
    }

    createMediaElement(options) {
        let elem = this.mediaElement;
        if (elem) {
            return elem;
        }

        elem = document.getElementById('pdfPlayer');
        if (!elem) {
            elem = dialogHelper.createDialog({
                exitAnimationDuration: 400,
                size: 'fullscreen',
                autoFocus: false,
                scrollY: false,
                exitAnimation: 'fadeout',
                removeOnClose: true
            });

            elem.id = 'pdfPlayer';
            elem.innerHTML = '<div id="bookOsdMount"></div><div id="container"><div id="canvasWrapper"><canvas id="canvas"></canvas><div id="textLayer"></div></div></div>';

            dialogHelper.open(elem);
        }

        this.mediaElement = elem;
        this.unmountBookOsd = renderComponent(BookOsd, {
            item: options.items[0],
            onExit: this.onDialogClosed,
            onPrevious: this.previous,
            onNext: this.next,
            onToggleFullscreen: this.toggleFullscreen,
            onRotateTheme: this.toggleTheme
        }, elem.querySelector('#bookOsdMount'));

        this.applyTheme();

        return elem;
    }

    setCurrentSrc(elem, options) {
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

        return import('pdfjs-dist').then(({ GlobalWorkerOptions, getDocument }) => {
            const api = ServerConnections.getApi(item.ServerId);
            if (!api) {
                console.error('[PdfPlayer] no Api instance available for server', item.ServerId);
                return;
            }

            const downloadHref = getLibraryApi(api).getDownloadUrl({ itemId: item.Id });

            this.bindEvents();
            GlobalWorkerOptions.workerSrc = appRouter.baseUrl() + '/libraries/pdf.worker.js';

            const downloadTask = getDocument({
                url: downloadHref,
                isEvalSupported: false
            });
            return downloadTask.promise.then(book => {
                if (this.cancellationToken) return;
                this.currentSrc = () => downloadHref;
                this.book = book;
                this.loaded = true;

                const percentageTicks = options.startPositionTicks / 10000;
                if (percentageTicks !== 0) {
                    this.loadPage(percentageTicks + 1);
                    this.progress = percentageTicks;
                } else {
                    this.loadPage(1);
                }
            });
        });
    }

    next() {
        if (this.progress === this.duration() - 1) return;
        this.loadPage(this.progress + 2);
        this.progress = this.progress + 1;

        Events.trigger(this, 'pause');
    }

    previous() {
        if (this.progress === 0) return;
        this.loadPage(this.progress);
        this.progress = this.progress - 1;

        Events.trigger(this, 'pause');
    }

    loadPage(number) {
        const prefix = 'page';
        const pad = 2;
        const canvasWrapper = document.querySelector('#canvasWrapper');

        const pages = [prefix + number];
        for (let i = 1; i <= pad; i++) {
            if (number - i > 0) pages.push(prefix + (number - i));
            if (number + i < this.duration()) pages.push(prefix + (number + i));
        }

        for (const page of pages) {
            if (!this.pages[page] || this.cacheWidth !== window.innerWidth || this.cacheHeight !== window.innerHeight) {
                const canvas = document.createElement('canvas');
                const textLayer = document.createElement('div');
                textLayer.className = 'textLayer';
                this.pages[page] = { canvas, textLayer };
                this.renderPage(canvas, textLayer, parseInt(page.slice(4), 10));

                canvas.id = 'canvas';
            }
        }

        const pageData = this.pages[prefix + number];
        if (pageData) {
            const oldCanvas = canvasWrapper.querySelector('#canvas');
            const oldTextLayer = canvasWrapper.querySelector('#textLayer');
            if (oldCanvas) oldCanvas.replaceWith(pageData.canvas);
            if (oldTextLayer) oldTextLayer.replaceWith(pageData.textLayer);
            pageData.canvas.id = 'canvas';
            pageData.textLayer.id = 'textLayer';
        }

        this.cacheWidth = window.innerWidth;
        this.cacheHeight = window.innerHeight;

        for (const page in this.pages) {
            if (!pages.includes(page)) {
                delete this.pages[page];
            }
        }
    }

    async renderPage(canvas, textLayer, number) {
        const devicePixelRatio = window.devicePixelRatio || 1;
        const page = await this.book.getPage(number);

        const original = page.getViewport({ scale: 1 });
        const scale = Math.min((window.innerHeight / original.height), (window.innerWidth / original.width));
        const viewport = page.getViewport({ scale: scale * devicePixelRatio });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        canvas.style.width = `${original.width * scale}px`;
        canvas.style.height = `${original.height * scale}px`;

        textLayer.style.width = `${original.width * scale}px`;
        textLayer.style.height = `${original.height * scale}px`;

        // Render page to canvas with transparent background
        const context = canvas.getContext('2d');
        const renderContext = {
            canvasContext: context,
            viewport: viewport,
            background: 'rgba(0,0,0,0)' // Transparent background
        };

        const renderTask = page.render(renderContext);
        await renderTask.promise;

        // Get text content for text layer
        const textContent = await page.getTextContent();
        const pdfjsLib = await import('pdfjs-dist');

        // Render text layer on top
        pdfjsLib.renderTextLayer({
            textContent: textContent,
            container: textLayer,
            viewport: viewport,
            textDivs: [],
            enhanceTextSelection: true
        });

        loading.hide();
    }

    canPlayMediaType(mediaType) {
        return (mediaType || '').toLowerCase() === 'book';
    }

    canPlayItem(item) {
        return item.Path ? item.Path.toLowerCase().endsWith('pdf') : false;
    }
}

export default PdfPlayer;
