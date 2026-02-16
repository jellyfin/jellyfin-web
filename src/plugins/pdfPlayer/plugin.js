import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';

import { toApi } from 'utils/jellyfin-apiclient/compat';

import loading from '../../components/loading/loading';
import keyboardnavigation from '../../scripts/keyboardNavigation';
import dialogHelper from '../../components/dialogHelper/dialogHelper';
import { appRouter } from '../../components/router/appRouter';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { PluginType } from '../../types/plugin.ts';
import Events from '../../utils/events.ts';

import './style.scss';
import '../../elements/emby-button/paper-icon-button-light';

const DEFAULT_INTERACTION_CONFIG = {
    swipeMinDistance: 80,
    swipeMaxVerticalDistance: 48,
    swipeMaxDuration: 550,
    tapMaxDistance: 18,
    tapMaxDuration: 320,
    doubleTapDelay: 320,
    pinchTapCooldown: 220,
    zoomStep: 0.2,
    maxZoom: 4
};

export class PdfPlayer {
    constructor() {
        this.name = 'PDF Player';
        this.type = PluginType.MediaPlayer;
        this.id = 'pdfplayer';
        this.priority = 1;

        this.onDialogClosed = this.onDialogClosed.bind(this);
        this.onWindowKeyDown = this.onWindowKeyDown.bind(this);
        this.onSwipeStart = this.onSwipeStart.bind(this);
        this.onSwipeEnd = this.onSwipeEnd.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
        this.onDragMove = this.onDragMove.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
        this.onViewportDoubleClick = this.onViewportDoubleClick.bind(this);
        this.onPreviousClick = this.onPreviousClick.bind(this);
        this.onNextClick = this.onNextClick.bind(this);
        this.onZoomInClick = this.onZoomInClick.bind(this);
        this.onZoomOutClick = this.onZoomOutClick.bind(this);
        this.onResetZoomClick = this.onResetZoomClick.bind(this);
        this.interactionConfig = { ...DEFAULT_INTERACTION_CONFIG };
    }

    play(options) {
        this.progress = 0;
        this.loaded = false;
        this.cancellationToken = false;
        this.pages = {};
        this.zoomLevel = 1;
        this.swipeStart = null;
        this.dragState = null;
        this.pinchState = null;
        this.lastPinchTimestamp = 0;
        this.lastTapTimestamp = 0;
        this.chromeHidden = false;

        loading.show();

        const elem = this.createMediaElement();
        this.loadInteractionConfig(elem);
        elem.classList.remove('readerChromeHidden');
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

    getTitle() {
        return this.item?.SeriesName || this.item?.Album || this.item?.Name || '';
    }

    getChapter() {
        if (!this.item) return '';

        const parts = [];
        if (this.item.ParentIndexNumber != null) {
            parts.push(`Book ${this.item.ParentIndexNumber}`);
        }
        if (this.item.IndexNumber != null) {
            parts.push(`Chapter ${this.item.IndexNumber}`);
        }

        if (parts.length) {
            return parts.join(' • ');
        }

        if (this.item.SeriesName && this.item.Name && this.item.SeriesName !== this.item.Name) {
            return this.item.Name;
        }

        return '';
    }

    updateReaderHeader() {
        if (!this.mediaElement) return;

        const titleElement = this.mediaElement.querySelector('.readerTitle');
        const chapterElement = this.mediaElement.querySelector('.readerChapter');
        const pageElement = this.mediaElement.querySelector('.readerPage');

        titleElement.textContent = this.getTitle();
        chapterElement.textContent = this.getChapter();
        pageElement.textContent = `Page ${Math.min(this.progress + 1, this.duration())} / ${this.duration()}`;
    }

    updateZoomLabel() {
        if (!this.mediaElement) return;

        const zoomElement = this.mediaElement.querySelector('.zoomValue');
        zoomElement.textContent = `${Math.round(this.zoomLevel * 100)}%`;
    }

    getCssNumberVar(style, name, fallback) {
        const raw = style.getPropertyValue(name).trim();
        if (!raw) return fallback;

        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    loadInteractionConfig(elem) {
        const style = window.getComputedStyle(elem || document.documentElement);

        this.interactionConfig = {
            swipeMinDistance: this.getCssNumberVar(style, '--jellyfin-pdf-swipe-min-distance', DEFAULT_INTERACTION_CONFIG.swipeMinDistance),
            swipeMaxVerticalDistance: this.getCssNumberVar(style, '--jellyfin-pdf-swipe-max-vertical-distance', DEFAULT_INTERACTION_CONFIG.swipeMaxVerticalDistance),
            swipeMaxDuration: this.getCssNumberVar(style, '--jellyfin-pdf-swipe-max-duration', DEFAULT_INTERACTION_CONFIG.swipeMaxDuration),
            tapMaxDistance: this.getCssNumberVar(style, '--jellyfin-pdf-tap-max-distance', DEFAULT_INTERACTION_CONFIG.tapMaxDistance),
            tapMaxDuration: this.getCssNumberVar(style, '--jellyfin-pdf-tap-max-duration', DEFAULT_INTERACTION_CONFIG.tapMaxDuration),
            doubleTapDelay: this.getCssNumberVar(style, '--jellyfin-pdf-double-tap-delay', DEFAULT_INTERACTION_CONFIG.doubleTapDelay),
            pinchTapCooldown: this.getCssNumberVar(style, '--jellyfin-pdf-pinch-tap-cooldown', DEFAULT_INTERACTION_CONFIG.pinchTapCooldown),
            zoomStep: this.getCssNumberVar(style, '--jellyfin-pdf-zoom-step', DEFAULT_INTERACTION_CONFIG.zoomStep),
            maxZoom: this.getCssNumberVar(style, '--jellyfin-pdf-max-zoom', DEFAULT_INTERACTION_CONFIG.maxZoom)
        };
    }

    setZoom(zoomLevel, anchorPoint) {
        const previousZoom = this.zoomLevel;
        this.zoomLevel = Math.min(this.interactionConfig.maxZoom, Math.max(1, zoomLevel));
        this.applyZoom(previousZoom, anchorPoint);
        this.updateZoomLabel();
    }

    applyZoom(previousZoom = this.zoomLevel, anchorPoint) {
        if (!this.mediaElement) return;

        const canvas = this.mediaElement.querySelector('#canvas');
        const viewport = this.mediaElement.querySelector('.readerViewport');
        const baseWidth = Number(canvas.dataset.baseWidth || 0);
        const baseHeight = Number(canvas.dataset.baseHeight || 0);
        const hasAnchor = anchorPoint && typeof anchorPoint.clientX === 'number' && typeof anchorPoint.clientY === 'number';
        const viewportBounds = hasAnchor ? viewport.getBoundingClientRect() : null;
        const relativeAnchorX = hasAnchor ? (anchorPoint.clientX - viewportBounds.left) : 0;
        const relativeAnchorY = hasAnchor ? (anchorPoint.clientY - viewportBounds.top) : 0;
        const contentAnchorX = hasAnchor ? (viewport.scrollLeft + relativeAnchorX) : 0;
        const contentAnchorY = hasAnchor ? (viewport.scrollTop + relativeAnchorY) : 0;

        if (baseWidth > 0 && baseHeight > 0) {
            canvas.style.width = `${Math.round(baseWidth * this.zoomLevel)}px`;
            canvas.style.height = `${Math.round(baseHeight * this.zoomLevel)}px`;
        }

        if (hasAnchor && previousZoom > 0 && this.zoomLevel !== previousZoom) {
            const zoomRatio = this.zoomLevel / previousZoom;
            viewport.scrollLeft = (contentAnchorX * zoomRatio) - relativeAnchorX;
            viewport.scrollTop = (contentAnchorY * zoomRatio) - relativeAnchorY;
        }

        if (this.zoomLevel <= 1) {
            viewport.classList.remove('isZoomed');
            viewport.scrollLeft = 0;
            viewport.scrollTop = 0;
        } else {
            viewport.classList.add('isZoomed');
        }
    }

    toggleReaderChrome() {
        if (!this.mediaElement) return;

        this.chromeHidden = !this.chromeHidden;
        this.mediaElement.classList.toggle('readerChromeHidden', this.chromeHidden);
    }

    onZoomInClick() {
        this.setZoom(this.zoomLevel + this.interactionConfig.zoomStep);
    }

    onZoomOutClick() {
        this.setZoom(this.zoomLevel - this.interactionConfig.zoomStep);
    }

    onResetZoomClick() {
        this.setZoom(1);
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
            case '+':
            case '=':
                e.preventDefault();
                this.onZoomInClick();
                break;
            case '-':
                e.preventDefault();
                this.onZoomOutClick();
                break;
            case '0':
                e.preventDefault();
                this.onResetZoomClick();
                break;
            case 'Escape':
                e.preventDefault();
                this.stop();
                break;
        }
    }

    onSwipeStart(e) {
        if (!this.loaded || !e.touches || e.touches.length === 0) {
            this.swipeStart = null;
            this.pinchState = null;
            return;
        }

        if (e.touches.length === 2) {
            this.swipeStart = null;
            const [a, b] = e.touches;
            this.pinchState = {
                distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
                zoomLevel: this.zoomLevel
            };
            return;
        }

        this.pinchState = null;
        if (this.zoomLevel > 1.05 || e.touches.length !== 1) {
            this.swipeStart = null;
            return;
        }

        const touch = e.touches[0];
        this.swipeStart = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now()
        };
    }

    onTouchMove(e) {
        if (!this.loaded || !this.pinchState || !e.touches || e.touches.length !== 2) return;

        const [a, b] = e.touches;
        const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        if (this.pinchState.distance <= 0) return;

        e.preventDefault();
        this.lastPinchTimestamp = Date.now();
        this.setZoom(this.pinchState.zoomLevel * (distance / this.pinchState.distance), {
            clientX: (a.clientX + b.clientX) / 2,
            clientY: (a.clientY + b.clientY) / 2
        });
    }

    onSwipeEnd(e) {
        if (this.pinchState && (!e.touches || e.touches.length < 2)) {
            this.pinchState = null;
        }

        if (!this.swipeStart || !e.changedTouches || e.changedTouches.length === 0) return;

        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - this.swipeStart.x;
        const deltaY = touch.clientY - this.swipeStart.y;
        const elapsed = Date.now() - this.swipeStart.time;

        this.swipeStart = null;

        if ((Date.now() - this.lastPinchTimestamp) < this.interactionConfig.pinchTapCooldown) return;

        if (elapsed <= this.interactionConfig.tapMaxDuration
            && Math.abs(deltaX) <= this.interactionConfig.tapMaxDistance
            && Math.abs(deltaY) <= this.interactionConfig.tapMaxDistance) {
            const now = Date.now();
            if (now - this.lastTapTimestamp <= this.interactionConfig.doubleTapDelay) {
                this.lastTapTimestamp = 0;
                this.toggleReaderChrome();
            } else {
                this.lastTapTimestamp = now;
            }
            return;
        }

        if (elapsed > this.interactionConfig.swipeMaxDuration) return;
        if (Math.abs(deltaX) < this.interactionConfig.swipeMinDistance) return;
        if (Math.abs(deltaY) > this.interactionConfig.swipeMaxVerticalDistance) return;

        if (deltaX < 0) {
            this.next();
        } else {
            this.previous();
        }
    }

    onViewportDoubleClick() {
        this.toggleReaderChrome();
    }

    onDragStart(e) {
        if (!this.loaded || this.zoomLevel <= 1) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;

        const viewport = this.mediaElement?.querySelector('.readerViewport');
        if (!viewport) return;

        this.dragState = {
            x: e.clientX,
            y: e.clientY,
            scrollLeft: viewport.scrollLeft,
            scrollTop: viewport.scrollTop
        };

        viewport.classList.add('isDragging');
        if (viewport.setPointerCapture) {
            viewport.setPointerCapture(e.pointerId);
        }
    }

    onDragMove(e) {
        if (!this.dragState || this.zoomLevel <= 1) return;

        const viewport = this.mediaElement?.querySelector('.readerViewport');
        if (!viewport) return;

        const deltaX = e.clientX - this.dragState.x;
        const deltaY = e.clientY - this.dragState.y;

        viewport.scrollLeft = this.dragState.scrollLeft - deltaX;
        viewport.scrollTop = this.dragState.scrollTop - deltaY;
    }

    onDragEnd(e) {
        if (!this.dragState) return;

        const viewport = this.mediaElement?.querySelector('.readerViewport');
        if (viewport) {
            viewport.classList.remove('isDragging');
            if (viewport.releasePointerCapture && typeof e.pointerId === 'number') {
                viewport.releasePointerCapture(e.pointerId);
            }
        }

        this.dragState = null;
    }

    onPreviousClick() {
        this.previous();
    }

    onNextClick() {
        this.next();
    }

    onDialogClosed() {
        this.stop();
    }

    bindMediaElementEvents() {
        const elem = this.mediaElement;
        const viewport = elem.querySelector('.readerViewport');

        elem.addEventListener('close', this.onDialogClosed, { once: true });
        elem.querySelector('.btnExit').addEventListener('click', this.onDialogClosed, { once: true });
        elem.querySelector('.btnPrevious').addEventListener('click', this.onPreviousClick);
        elem.querySelector('.btnNext').addEventListener('click', this.onNextClick);
        elem.querySelector('.btnZoomIn').addEventListener('click', this.onZoomInClick);
        elem.querySelector('.btnZoomOut').addEventListener('click', this.onZoomOutClick);
        elem.querySelector('.btnZoomReset').addEventListener('click', this.onResetZoomClick);

        viewport.addEventListener('touchstart', this.onSwipeStart, { passive: true });
        viewport.addEventListener('touchmove', this.onTouchMove, { passive: false });
        viewport.addEventListener('touchend', this.onSwipeEnd, { passive: true });
        viewport.addEventListener('touchcancel', this.onDragEnd);
        viewport.addEventListener('dblclick', this.onViewportDoubleClick);
        viewport.addEventListener('pointerdown', this.onDragStart);
        viewport.addEventListener('pointermove', this.onDragMove);
        viewport.addEventListener('pointerup', this.onDragEnd);
        viewport.addEventListener('pointercancel', this.onDragEnd);
    }

    bindEvents() {
        this.bindMediaElementEvents();
        document.addEventListener('keydown', this.onWindowKeyDown);
    }

    unbindMediaElementEvents() {
        const elem = this.mediaElement;
        const viewport = elem.querySelector('.readerViewport');

        elem.removeEventListener('close', this.onDialogClosed);
        elem.querySelector('.btnExit').removeEventListener('click', this.onDialogClosed);
        elem.querySelector('.btnPrevious').removeEventListener('click', this.onPreviousClick);
        elem.querySelector('.btnNext').removeEventListener('click', this.onNextClick);
        elem.querySelector('.btnZoomIn').removeEventListener('click', this.onZoomInClick);
        elem.querySelector('.btnZoomOut').removeEventListener('click', this.onZoomOutClick);
        elem.querySelector('.btnZoomReset').removeEventListener('click', this.onResetZoomClick);

        viewport.removeEventListener('touchstart', this.onSwipeStart);
        viewport.removeEventListener('touchmove', this.onTouchMove);
        viewport.removeEventListener('touchend', this.onSwipeEnd);
        viewport.removeEventListener('touchcancel', this.onDragEnd);
        viewport.removeEventListener('dblclick', this.onViewportDoubleClick);
        viewport.removeEventListener('pointerdown', this.onDragStart);
        viewport.removeEventListener('pointermove', this.onDragMove);
        viewport.removeEventListener('pointerup', this.onDragEnd);
        viewport.removeEventListener('pointercancel', this.onDragEnd);
    }

    unbindEvents() {
        if (this.mediaElement) {
            this.unbindMediaElementEvents();
        }

        document.removeEventListener('keydown', this.onWindowKeyDown);
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
            html += '<div class="readerHeader">';
            html += '<div class="readerTitle"></div>';
            html += '<div class="readerMeta"><span class="readerChapter"></span><span class="readerPage"></span></div>';
            html += '</div>';
            html += '<div class="readerViewport">';
            html += '<div class="canvasHost"><canvas id="canvas"></canvas></div>';
            html += '</div>';
            html += '<div class="actionButtons">';
            html += '<button is="paper-icon-button-light" class="autoSize btnPrevious" tabindex="-1" title="Previous page"><span class="material-icons actionButtonIcon chevron_left" aria-hidden="true"></span></button>';
            html += '<button is="paper-icon-button-light" class="autoSize btnNext" tabindex="-1" title="Next page"><span class="material-icons actionButtonIcon chevron_right" aria-hidden="true"></span></button>';
            html += '<button is="paper-icon-button-light" class="autoSize btnZoomOut" tabindex="-1" title="Zoom out"><span class="material-icons actionButtonIcon zoom_out" aria-hidden="true"></span></button>';
            html += '<button is="paper-icon-button-light" class="autoSize btnZoomIn" tabindex="-1" title="Zoom in"><span class="material-icons actionButtonIcon zoom_in" aria-hidden="true"></span></button>';
            html += '<button is="paper-icon-button-light" class="autoSize btnZoomReset" tabindex="-1" title="Reset zoom"><span class="zoomValue">100%</span></button>';
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

        this.updateReaderHeader();
        this.updateZoomLabel();

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
                this.updateReaderHeader();

                const percentageTicks = options.startPositionTicks / 10000;
                if (percentageTicks !== 0) {
                    this.loadPage(percentageTicks + 1);
                    this.progress = percentageTicks;
                } else {
                    this.loadPage(1);
                }
                this.updateReaderHeader();
            });
        });
    }

    next() {
        if (this.progress === this.duration() - 1) return;
        this.loadPage(this.progress + 2);
        this.progress = this.progress + 1;
        this.updateReaderHeader();

        Events.trigger(this, 'pause');
    }

    previous() {
        if (this.progress === 0) return;
        this.loadPage(this.progress);
        this.progress = this.progress - 1;
        this.updateReaderHeader();

        Events.trigger(this, 'pause');
    }

    replaceCanvas(canvas) {
        const old = this.mediaElement?.querySelector('#canvas');

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
            const viewportElement = this.mediaElement?.querySelector('.readerViewport');
            const availableHeight = viewportElement ? viewportElement.clientHeight : window.innerHeight;
            const availableWidth = viewportElement ? viewportElement.clientWidth : window.innerWidth;

            const scale = Math.min((availableHeight / original.height), (availableWidth / original.width)) * devicePixelRatio;
            const viewport = page.getViewport({ scale });

            canvas.width = viewport.width;
            canvas.height = viewport.height;
            canvas.dataset.baseWidth = String(Math.round(viewport.width / devicePixelRatio));
            canvas.dataset.baseHeight = String(Math.round(viewport.height / devicePixelRatio));
            canvas.style.width = `${canvas.dataset.baseWidth}px`;
            canvas.style.height = `${canvas.dataset.baseHeight}px`;

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

export default PdfPlayer;
