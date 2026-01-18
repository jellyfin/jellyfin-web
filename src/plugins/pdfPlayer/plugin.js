import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';

import { toApi } from 'utils/jellyfin-apiclient/compat';

import loading from '../../components/loading/loading';
import keyboardnavigation from '../../scripts/keyboardNavigation';
import dialogHelper from '../../components/dialogHelper/dialogHelper';
import dom from '../../utils/dom';
import { appRouter } from '../../components/router/appRouter';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { PluginType } from '../../types/plugin';
import Events from '../../utils/events';

import './style.scss';
import '../../elements/emby-button/paper-icon-button-light';

export class PdfPlayer {
    constructor() {
        this.name = 'PDF Player';
        this.type = PluginType.MediaPlayer;
        this.id = 'pdfplayer';
        this.priority = 1;

        this.onDialogClosed = this.onDialogClosed.bind(this);
        this.onWindowKeyDown = this.onWindowKeyDown.bind(this);
        this.onTouchStart = this.onTouchStart.bind(this);
    }

    play(options) {
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

        // hide loading animation
        loading.hide();

        // cancel page render
        this.cancellationToken = true;
    }

    destroy() {
        // Nothing to do here
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

        // Skip modified keys
        if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;

        const key = keyboardnavigation.getKeyName(e);

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

    onTouchStart(e) {
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

    bindMediaElementEvents() {
        const elem = this.mediaElement;

        elem.addEventListener('close', this.onDialogClosed, { once: true });
        elem.querySelector('.btnExit').addEventListener('click', this.onDialogClosed, { once: true });
    }

    bindEvents() {
        this.bindMediaElementEvents();

        document.addEventListener('keydown', this.onWindowKeyDown);
        document.addEventListener('touchstart', this.onTouchStart);
    }

    unbindMediaElementEvents() {
        const elem = this.mediaElement;

        elem.removeEventListener('close', this.onDialogClosed);
        elem.querySelector('.btnExit').removeEventListener('click', this.onDialogClosed);
    }

    unbindEvents() {
        if (this.mediaElement) {
            this.unbindMediaElementEvents();
        }

        document.removeEventListener('keydown', this.onWindowKeyDown);
        document.removeEventListener('touchstart', this.onTouchStart);
    }

    createMediaElement() {
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

            let html = '';
            html += '<canvas id="canvas"></canvas>';
            html += '<div class="actionButtons">';
            html += '<button is="paper-icon-button-light" class="autoSize btnExit" tabindex="-1"><span class="material-icons actionButtonIcon close" aria-hidden="true"></span></button>';
            html += '</div>';

            elem.id = 'pdfPlayer';
            elem.innerHTML = html;

            dialogHelper.open(elem);
        }

        this.mediaElement = elem;
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
            const api = toApi(ServerConnections.getApiClient(item));
            const downloadHref = getLibraryApi(api).getDownloadUrl({ itemId: item.Id });

            this.bindEvents();
            GlobalWorkerOptions.workerSrc = appRouter.baseUrl() + '/libraries/pdf.worker.js';

            const downloadTask = getDocument({
                url: downloadHref,
                // Disable for PDF.js XSS vulnerability
                // https://github.com/mozilla/pdf.js/security/advisories/GHSA-wgrm-67xf-hhpq
                isEvalSupported: false
            });
            return downloadTask.promise.then(book => {
                if (this.cancellationToken) return;
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

    replaceCanvas(canvas) {
        const old = document.getElementById('canvas');

        canvas.id = 'canvas';
        old.parentNode.replaceChild(canvas, old);
    }

    loadPage(number) {
        const prefix = 'page';
        const pad = 2;

        // generate list of cached pages by padding the requested page on both sides
        const pages = [prefix + number];
        for (let i = 1; i <= pad; i++) {
            if (number - i > 0) pages.push(prefix + (number - i));
            if (number + i < this.duration()) pages.push(prefix + (number + i));
        }

        // load any missing pages in the cache
        for (const page of pages) {
            if (!this.pages[page]) {
                this.pages[page] = document.createElement('canvas');
                this.renderPage(this.pages[page], parseInt(page.slice(4), 10));
            }
        }

        // show the requested page
        this.replaceCanvas(this.pages[prefix + number], number);

        // delete all pages outside the cache area
        for (const page in this.pages) {
            if (!pages.includes(page)) {
                delete this.pages[page];
            }
        }
    }

    renderPage(canvas, number) {
        const devicePixelRatio = window.devicePixelRatio || 1;
        this.book.getPage(number).then(page => {
            const original = page.getViewport({ scale: 1 });
            const scale = Math.min((window.innerHeight / original.height), (window.innerWidth / original.width)) * devicePixelRatio;
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

    canPlayMediaType(mediaType) {
        return (mediaType || '').toLowerCase() === 'book';
    }

    canPlayItem(item) {
        return item.Path ? item.Path.toLowerCase().endsWith('pdf') : false;
    }
}

export { PdfPlayer };
export default PdfPlayer;
