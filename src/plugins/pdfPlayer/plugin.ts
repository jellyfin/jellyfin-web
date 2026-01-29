import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { toApi } from 'utils/jellyfin-apiclient/compat';
import dialogHelper from '../../components/dialogHelper/dialogHelper';
import loading from '../../components/loading/loading';
import { appRouter } from '../../components/router/appRouter';
import keyboardnavigation from '../../scripts/keyboardNavigation';
import { useBookStore } from '../../store/bookStore';
import { PluginType } from '../../types/plugin';
import dom from '../../utils/dom';
import Events from '../../utils/events';

import './style.scss';
import '../../elements/emby-button/paper-icon-button-light';

export class PdfPlayer {
    name: string = 'PDF Player';
    type: any = PluginType.MediaPlayer;
    id: string = 'pdfplayer';
    isLocalPlayer: boolean = true;
    priority: number = 1;

    item: any;
    mediaElement: any;
    book: any;
    pages: Record<string, HTMLCanvasElement> = {};
    loaded: boolean = false;
    cancellationToken: boolean = false;
    progress: number = 0;
    streamInfo: any;

    constructor() {
        this.onDialogClosed = this.onDialogClosed.bind(this);
        this.onWindowKeyDown = this.onWindowKeyDown.bind(this);
        this.onTouchStart = this.onTouchStart.bind(this);
    }

    play(options: any) {
        this.progress = 0;
        this.loaded = false;
        this.cancellationToken = false;
        this.pages = {};

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
        if (elem) {
            dialogHelper.close(elem);
            this.mediaElement = null;
        }

        loading.hide();
        this.cancellationToken = true;
        useBookStore.getState().reset();
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

    onWindowKeyDown(e: KeyboardEvent) {
        if (!this.loaded) return;
        if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;

        const key = (keyboardnavigation as any).getKeyName(e);

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
                this.stop();
                break;
        }
    }

    onTouchStart(e: TouchEvent) {
        if (!this.loaded || !e.touches || e.touches.length === 0) return;
        if (e.touches[0].clientX < dom.getWindowSize().innerWidth / 2) {
            this.previous();
        } else {
            this.next();
        }
    }

    onDialogClosed() {
        this.stop();
    }

    bindEvents() {
        const elem = this.mediaElement;
        elem.addEventListener('close', this.onDialogClosed, { once: true });
        elem.querySelector('.btnExit').addEventListener('click', this.onDialogClosed, {
            once: true
        });

        document.addEventListener('keydown', this.onWindowKeyDown);
        document.addEventListener('touchstart', this.onTouchStart);
    }

    unbindEvents() {
        if (this.mediaElement) {
            this.mediaElement.removeEventListener('close', this.onDialogClosed);
        }

        document.removeEventListener('keydown', this.onWindowKeyDown);
        document.removeEventListener('touchstart', this.onTouchStart);
    }

    createMediaElement() {
        let elem = this.mediaElement;
        if (elem) return elem;

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
            elem.innerHTML =
                '<canvas id="canvas"></canvas><div class="actionButtons"><button is="paper-icon-button-light" class="autoSize btnExit" tabindex="-1"><span class="material-icons actionButtonIcon close" aria-hidden="true"></span></button></div>';

            dialogHelper.open(elem);
        }

        this.mediaElement = elem;
        return elem;
    }

    setCurrentSrc(elem: HTMLElement, options: any) {
        const item = options.items[0];
        this.item = item;

        return import('pdfjs-dist').then(({ GlobalWorkerOptions, getDocument }: any) => {
            const api = toApi(ServerConnections.getApiClient(item.ServerId));
            const libraryApi = getLibraryApi(api) as any;
            const downloadHref = (libraryApi.getDownloadUrl?.({ itemId: item.Id }) ||
                libraryApi.getDownload?.({ itemId: item.Id })) as string;

            this.bindEvents();
            GlobalWorkerOptions.workerSrc = appRouter.baseUrl() + '/libraries/pdf.worker.js';

            const downloadTask = getDocument({
                url: downloadHref,
                isEvalSupported: false
            });
            return downloadTask.promise.then((book: any) => {
                if (this.cancellationToken) return;
                this.book = book;
                this.loaded = true;

                useBookStore.getState().setCurrentBook(item.Id, book.numPages);

                const percentageTicks = options.startPositionTicks / 10000;
                if (percentageTicks !== 0) {
                    this.loadPage(percentageTicks + 1);
                    this.progress = percentageTicks;
                } else {
                    this.loadPage(1);
                }

                useBookStore.getState().setLoaded(true);
            });
        });
    }

    next() {
        if (this.progress === this.duration() - 1) return;
        this.loadPage(this.progress + 2);
        this.progress = this.progress + 1;
        useBookStore.getState().setPage(this.progress + 1);
        Events.trigger(this, 'pause');
    }

    previous() {
        if (this.progress === 0) return;
        this.loadPage(this.progress);
        this.progress = this.progress - 1;
        useBookStore.getState().setPage(this.progress + 1);
        Events.trigger(this, 'pause');
    }

    replaceCanvas(canvas: HTMLCanvasElement) {
        const old = document.getElementById('canvas');
        if (old && old.parentNode) {
            canvas.id = 'canvas';
            old.parentNode.replaceChild(canvas, old);
        }
    }

    loadPage(number: number) {
        const prefix = 'page';
        const pad = 2;

        const pages = [prefix + number];
        for (let i = 1; i <= pad; i++) {
            if (number - i > 0) pages.push(prefix + (number - i));
            if (number + i < this.duration()) pages.push(prefix + (number + i));
        }

        for (const page of pages) {
            if (!this.pages[page]) {
                this.pages[page] = document.createElement('canvas');
                this.renderPage(this.pages[page], parseInt(page.slice(4), 10));
            }
        }

        this.replaceCanvas(this.pages[prefix + number]);

        for (const page in this.pages) {
            if (!pages.includes(page)) {
                delete this.pages[page];
            }
        }
    }

    renderPage(canvas: HTMLCanvasElement, number: number) {
        const devicePixelRatio = window.devicePixelRatio || 1;
        this.book.getPage(number).then((page: any) => {
            const original = page.getViewport({ scale: 1 });
            const scale =
                Math.min(window.innerHeight / original.height, window.innerWidth / original.width) *
                devicePixelRatio;
            const viewport = page.getViewport({ scale });

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            if (window.innerWidth < window.innerHeight) {
                canvas.style.width = '100%';
                canvas.style.height = 'auto';
            } else {
                canvas.style.height = '100%';
                canvas.style.width = 'auto';
            }

            const context = canvas.getContext('2d');
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            const renderTask = page.render(renderContext);
            renderTask.promise.then(() => {
                loading.hide();
            });
        });
    }

    canPlayMediaType(mediaType: string) {
        return (mediaType || '').toLowerCase() === 'book';
    }

    canPlayItem(item: any) {
        return item.Path ? item.Path.toLowerCase().endsWith('pdf') : false;
    }
}

export default PdfPlayer;
