import ServerConnections from '../../components/ServerConnections';
import loading from '../../components/loading/loading';
import keyboardnavigation from '../../scripts/keyboardNavigation';
import dialogHelper from '../../components/dialogHelper/dialogHelper';
import dom from '../../scripts/dom';
import { appRouter } from '../../components/router/appRouter';
import { PluginType } from '../../types/plugin.ts';
import Events from '../../utils/events.ts';

import './style.scss';
import '../../elements/emby-button/paper-icon-button-light';

export class PdfPlayer {
    constructor() {
        this.name = 'PDF Player';
        this.type = PluginType.MediaPlayer;
        this.id = 'pdfplayer';
        this.priority = 1;

        this.onDialogClosed = this.onDialogClosed.bind(this);
        this.onFullPage = this.onFullPage.bind(this);
        this.onWindowKeyUp = this.onWindowKeyUp.bind(this);
        this.onClick = this.onClick.bind(this);
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

    onWindowKeyUp(e) {
        const key = keyboardnavigation.getKeyName(e);

        if (!this.loaded) return;
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
            case 'Home':
                this.setPage(1);
                break;
            case 'End':
                this.setPage(-1);
                break;
        }
    }

    onClick(e) {
        if (!this.loaded) return;
        if (e.clientX < dom.getWindowSize().innerWidth / 2) {
            this.previous();
        } else {
            this.next();
        }
    }

    onFullPage() {
        document.getElementById('pdfContainer').classList.toggle('fullPage');
    }

    onDialogClosed() {
        this.stop();
    }

    bindMediaElementEvents() {
        const elem = this.mediaElement;

        elem.addEventListener('close', this.onDialogClosed, { once: true });
        document.getElementById('pdfContainer').addEventListener('click', this.onClick);
        elem.querySelector('.btnExit').addEventListener('click', this.onDialogClosed, { once: true });
        elem.querySelector('.btnFull').addEventListener('click', this.onFullPage);
    }

    bindEvents() {
        this.bindMediaElementEvents();

        document.addEventListener('keyup', this.onWindowKeyUp);
    }

    unbindMediaElementEvents() {
        const elem = this.mediaElement;

        elem.removeEventListener('close', this.onDialogClosed);
        document.getElementById('pdfContainer').removeEventListener('click', this.onClick);
        elem.querySelector('.btnExit').removeEventListener('click', this.onDialogClosed);
        elem.querySelector('.btnFull').removeEventListener('click', this.onFullPage);
    }

    unbindEvents() {
        if (this.mediaElement) {
            this.unbindMediaElementEvents();
        }

        document.removeEventListener('keyup', this.onWindowKeyUp);
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
            html += '<div id="pdfContainer"  class="fullPage"></div>';
            html += '<div class="actionButtons">';
            html += '<button is="paper-icon-button-light" class="autoSize btnFull" tabindex="-1"><span class="material-icons actionButtonIcon fullscreen" aria-hidden="true"></span></button>';
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

        const serverId = item.ServerId;
        const apiClient = ServerConnections.getApiClient(serverId);

        return import('pdfjs-dist').then(({ GlobalWorkerOptions, getDocument }) => {
            const downloadHref = apiClient.getItemDownloadUrl(item.Id);

            this.bindEvents();
            GlobalWorkerOptions.workerSrc = appRouter.baseUrl() + '/libraries/pdf.worker.js';

            const downloadTask = getDocument(downloadHref);
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
        const visiblePages = document.getElementById('pdfContainer').childElementCount;
        const newPage = 1 + Math.min(this.progress + visiblePages, this.duration() - 1);
        this.setPage(newPage);
    }

    previous() {
        const visiblePages = document.getElementById('pdfContainer').childElementCount;
        const newPage = 1 + Math.max(this.progress - visiblePages, 0);
        this.setPage(newPage);
    }

    setPage(pageNumber) {
        if (pageNumber < 0) pageNumber = this.duration - pageNumber;

        let newProgress = pageNumber - 1;
        newProgress = Math.max(newProgress, 0);
        newProgress = Math.min(newProgress, this.duration() - 1);
        if (newProgress === this.progress) return;

        this.loadPage(newProgress + 1);
        this.progress = newProgress;

        Events.trigger(this, 'pause');
    }

    // TODO save container element so we don't have to look it up everytime
    replaceCanvas(...canvas) {
        const container = document.getElementById('pdfContainer');
        container.replaceChildren(...canvas.filter(item => item !== undefined));
    }

    // TODO reload page on browser-size / phone-orientation change
    loadPage(number) {
        const bookMode = (window.innerWidth >= window.innerHeight && number != 1) ? true : false;
        const prefix = 'page';
        const pad = 3;

        // correctly show double pages in bookmode
        if (bookMode) number = Math.floor(number / 2) * 2;

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
                this.renderPage(this.pages[page], parseInt(page.slice(4), 10), bookMode);
            }
        }

        // show the requested page
        if (bookMode) this.replaceCanvas(this.pages[prefix + (number)], this.pages[prefix + (number + 1)]);
        else this.replaceCanvas(this.pages[prefix + number]);

        // delete all pages outside the cache area
        for (const page in this.pages) {
            if (!pages.includes(page)) {
                delete this.pages[page];
            }
        }
    }

    renderPage(canvas, number, bookMode) {
        const devicePixelRatio = window.devicePixelRatio || 1;
        this.book.getPage(number).then(page => {
            const original = page.getViewport({ scale: 1 });
            const widthFactor = (bookMode) ? 0.5 : 1;
            const scale = Math.max((window.screen.height / original.height), (window.screen.width * widthFactor / original.width)) * devicePixelRatio;
            const viewport = page.getViewport({ scale });

            canvas.width = viewport.width;
            canvas.height = viewport.height;
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
        return item.Path?.endsWith('pdf');
    }
}

export default PdfPlayer;
