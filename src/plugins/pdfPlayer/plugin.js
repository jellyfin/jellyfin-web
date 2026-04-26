import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';

import { toApi } from 'utils/jellyfin-apiclient/compat';

import loading from '../../components/loading/loading';
import keyboardnavigation from '../../scripts/keyboardNavigation';
import dialogHelper from '../../components/dialogHelper/dialogHelper';
import dom from '../../utils/dom';
import { appRouter } from '../../components/router/appRouter';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { PluginType } from '../../types/plugin.ts';
import Events from '../../utils/events.ts';
import debounce from 'lodash/debounce';
import alert from '../../components/alert';
import '../../elements/emby-button/paper-icon-button-light';
import './style.scss';

export class PdfPlayer {
    constructor() {
        this.name = 'PDF Player';
        this.type = PluginType.MediaPlayer;
        this.id = 'pdfplayer';
        this.priority = 1;

        this.currentScaleFactor = 1.0;
        this.zoomIncrement = 0.25;
        this.minScaleFactor = 0.25;
        this.maxScaleFactor = 3.0;

        this.onDialogClosed = this.onDialogClosed.bind(this);
        this.onWindowKeyDown = this.onWindowKeyDown.bind(this);
        this.onTouchStart = this.onTouchStart.bind(this);
        this.zoomIn = this.zoomIn.bind(this);
        this.zoomOut = this.zoomOut.bind(this);
        this.onWindowResize = debounce(this.onWindowResize.bind(this), 250);
    }

    play(options) {
        this.progress = 0;
        this.loaded = false;
        this.cancellationToken = false;
        this.pages = {};
        this.currentScaleFactor = 1.0;

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

        const key = keyboardnavigation.getKeyName(e);
        const isNavigationKey = key === 'l' || key === 'ArrowRight' || key === 'Right' || key === 'j' || key === 'ArrowLeft' || key === 'Left' || key === 'Escape';
        const isZoomKey = key === '+' || key === '=' || key === '-';
        const hasModifier = e.ctrlKey || e.altKey || e.metaKey || e.shiftKey;
        const hasNonShiftModifier = e.ctrlKey || e.altKey || e.metaKey;

        if (isNavigationKey || isZoomKey) {
            e.preventDefault();
        }

        if (isNavigationKey && !hasModifier) {
            switch (key) {
                case 'l':
                case 'ArrowRight':
                case 'Right':
                    this.next();
                    break;
                case 'j':
                case 'ArrowLeft':
                case 'Left':
                    this.previous();
                    break;
                case 'Escape':
                    this.stop();
                    break;
            }
        } else if (isZoomKey && !hasNonShiftModifier) {
            if (key === '-' && e.shiftKey) {
                return;
            }
            switch (key) {
                case '+':
                case '=':
                    this.zoomIn();
                    break;
                case '-':
                    this.zoomOut();
                    break;
            }
        }
    }

    onTouchStart(e) {
        if (!this.loaded || !e.touches || e.touches.length === 0) return;
        if (e.touches.length === 1) { // Only handle single touch for navigation
            if (e.touches[0].clientX < dom.getWindowSize().innerWidth / 2) {
                this.previous();
            } else {
                this.next();
            }
        }
    }

    onDialogClosed() {
        this.stop();
    }

    onWindowResize() {
        if (this.loaded && this.book && !this.cancellationToken) {
            // Re-render the current page to adjust scale based on new window size
            this.loadPage(this.progress + 1);
        }
    }

    bindMediaElementEvents() {
        const elem = this.mediaElement;
        const btnExit = elem.querySelector('.btnExit');
        const btnZoomIn = elem.querySelector('.btnZoomIn');
        const btnZoomOut = elem.querySelector('.btnZoomOut');

        btnExit.addEventListener('click', this.onDialogClosed, { once: true });
        btnZoomIn.addEventListener('click', this.zoomIn);
        btnZoomOut.addEventListener('click', this.zoomOut);
        elem.addEventListener('close', this.onDialogClosed, { once: true });
    }

    unbindMediaElementEvents() {
        const elem = this.mediaElement;

        const btnExit = elem.querySelector('.btnExit');
        const btnZoomIn = elem.querySelector('.btnZoomIn');
        const btnZoomOut = elem.querySelector('.btnZoomOut');

        elem.removeEventListener('close', this.onDialogClosed);
        btnExit.removeEventListener('click', this.onDialogClosed);
        btnZoomIn.removeEventListener('click', this.zoomIn);
        btnZoomOut.removeEventListener('click', this.zoomOut);
    }

    bindEvents() {
        this.bindMediaElementEvents();

        document.addEventListener('keydown', this.onWindowKeyDown);
        document.addEventListener('touchstart', this.onTouchStart);
        window.addEventListener('resize', this.onWindowResize);
    }

    unbindEvents() {
        if (this.mediaElement) {
            this.unbindMediaElementEvents();
        }

        document.removeEventListener('keydown', this.onWindowKeyDown);
        document.removeEventListener('touchstart', this.onTouchStart);
        window.removeEventListener('resize', this.onWindowResize);
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
                scrollY: true, // IMPORTANT for zoom
                exitAnimation: 'fadeout',
                removeOnClose: true,
                dialogClass: 'pdf-player-dialog'
            });

            let html = '';
            // Container for the canvas to handle scrolling correctly
            html += '<div class="pdf-canvas-container">';
            html += '<canvas id="canvas"></canvas>';
            html += '</div>';
            html += '<div class="actionButtons">';
            html += '<button is="paper-icon-button-light" class="autoSize btnZoomOut" tabindex="-1"><span class="material-icons actionButtonIcon remove" aria-hidden="true"></span></button>';
            html += '<button is="paper-icon-button-light" class="autoSize btnZoomIn" tabindex="-1"><span class="material-icons actionButtonIcon add" aria-hidden="true"></span></button>';
            html += '<button is="paper-icon-button-light" class="autoSize btnExit" tabindex="-1"><span class="material-icons actionButtonIcon close" aria-hidden="true"></span></button>';
            html += '</div>';

            elem.id = 'pdfPlayer';
            const dialogContent = elem.querySelector('.dialogContent');
            if (dialogContent) {
                dialogContent.innerHTML = html;
            } else {
                console.error('Could not find dialog content area to insert HTML.');
                elem.innerHTML = html;
            }

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

                const percentageTicks = options.startPositionTicks ? options.startPositionTicks / 10000 : 0;
                // page numbers are 1-based
                const startPage = percentageTicks > 0 ? Math.min(Math.floor(percentageTicks) + 1, book.numPages) : 1;
                this.progress = startPage - 1; // progress is 0-based index

                this.loadPage(startPage);

                Events.trigger(this, 'playing');
            }).catch(reason => {
                loading.hide();
                alert({ title: 'Error', text: 'Failed to load PDF document.' });
                this.stop();
                return Promise.reject(new Error(reason));
            });
        }).catch(error => {
            loading.hide();
            alert({ title: 'Error', text: 'Failed to load PDF viewer component.' });
            this.stop();
            return Promise.reject(new Error(error));
        });
    }

    zoomIn() {
        if (!this.loaded) return;
        const newScaleFactor = Math.min(this.currentScaleFactor + this.zoomIncrement, this.maxScaleFactor);
        if (newScaleFactor !== this.currentScaleFactor) {
            this.currentScaleFactor = newScaleFactor;
            this.loadPage(this.progress + 1);
            Events.trigger(this, 'zoomchange');
        }
    }

    zoomOut() {
        if (!this.loaded) return;
        const newScaleFactor = Math.max(this.currentScaleFactor - this.zoomIncrement, this.minScaleFactor);
        if (newScaleFactor !== this.currentScaleFactor) {
            this.currentScaleFactor = newScaleFactor;
            this.loadPage(this.progress + 1);
            Events.trigger(this, 'zoomchange');
        }
    }

    next() {
        if (!this.loaded || this.progress >= this.duration() - 1) return;
        this.progress++;
        this.loadPage(this.progress + 1);
        Events.trigger(this, 'timeupdate');
        Events.trigger(this, 'pause');
    }

    previous() {
        if (!this.loaded || this.progress <= 0) return;
        this.progress--;
        this.loadPage(this.progress + 1);
        Events.trigger(this, 'timeupdate');
        Events.trigger(this, 'pause');
    }

    replaceCanvas(newCanvas) {
        const container = this.mediaElement?.querySelector('.pdf-canvas-container');
        if (!container) {
            console.error('Cannot find .pdf-canvas-container to replace canvas');
            return;
        }
        const oldCanvas = container.querySelector('#canvas');
        if (oldCanvas) {
            oldCanvas.remove();
        }
        newCanvas.id = 'canvas';
        container.appendChild(newCanvas);
    }

    loadPage(number) {
        if (!this.book || number < 1 || number > this.duration()) {
            console.warn(`PdfPlayer: Invalid page number requested: ${number}`);
            return;
        }
        if (this.cancellationToken) {
            return;
        }

        loading.show();
        const pageKey = `page${number}`;

        let canvas = this.pages[pageKey];
        if (!canvas) {
            canvas = document.createElement('canvas');
            this.pages[pageKey] = canvas;
        }

        this.renderPage(canvas, number).then(() => {
            // Only replace the visible canvas if the rendered page is the current page
            if (!this.cancellationToken && number === this.progress + 1) {
                this.replaceCanvas(canvas);
            }
        }).catch(error => {
            console.error(`PdfPlayer: Failed to render page ${number}`, error);
            loading.hide();
        }).finally(() => {
            if (number === this.progress + 1 || this.cancellationToken) {
                loading.hide();
            }
        });

        const pagesToKeep = [`page${number}`];
        if (number > 1) pagesToKeep.push(`page${number - 1}`);
        if (number < this.duration()) pagesToKeep.push(`page${number + 1}`);

        for (const pageKeyToDelete in this.pages) {
            if (!pagesToKeep.includes(pageKeyToDelete)) {
                delete this.pages[pageKeyToDelete];
            }
        }
    }

    renderPage(canvas, number) {
        if (!this.book || number < 1 || number > this.duration()) {
            return Promise.reject(new Error(`Invalid state for rendering page ${number}`));
        }

        const devicePixelRatio = window.devicePixelRatio || 1;

        return this.book.getPage(number).then(page => {
            if (this.cancellationToken) return Promise.reject(new Error('cancelled')); // Check for cancellation

            // Get viewport at 100% scale first to calculate base fit-to-window scale
            const viewport100 = page.getViewport({ scale: 1 });

            // Calculate the scale needed to fit the page within the window
            // Use the dialog's content area dimensions if possible, otherwise fallback to window
            const container = this.mediaElement?.querySelector('.pdf-canvas-container') || this.mediaElement || document.body;
            const availableWidth = container.clientWidth;
            const availableHeight = container.clientHeight;

            const scaleToFitWidth = availableWidth / viewport100.width;
            const scaleToFitHeight = availableHeight / viewport100.height;
            const baseScale = Math.min(scaleToFitWidth, scaleToFitHeight);

            const finalScale = baseScale * this.currentScaleFactor * devicePixelRatio;

            const viewport = page.getViewport({ scale: finalScale });

            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);

            // Let the browser handle sizing based on width/height attributes
            canvas.style.width = `${Math.floor(viewport.width / devicePixelRatio)}px`;
            canvas.style.height = `${Math.floor(viewport.height / devicePixelRatio)}px`;

            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            const renderTask = page.render(renderContext);
            return renderTask.promise.then(() => {
                console.debug(`PdfPlayer: Finished rendering page ${number}`);
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

export default PdfPlayer;
