// eslint-disable-next-line import/named, import/namespace
import { Archive } from 'libarchive.js';
import loading from '../../components/loading/loading';
import dialogHelper from '../../components/dialogHelper/dialogHelper';
import keyboardnavigation from '../../scripts/keyboardNavigation';
import { appRouter } from '../../components/appRouter';
import ServerConnections from '../../components/ServerConnections';
// eslint-disable-next-line import/named, import/namespace
import { Swiper } from 'swiper/swiper-bundle.esm';
import 'swiper/swiper-bundle.css';

import './style.scss';

export class ComicsPlayer {
    constructor() {
        this.name = 'Comics Player';
        this.type = 'mediaplayer';
        this.id = 'comicsplayer';
        this.priority = 1;
        this.imageMap = new Map();

        this.onDialogClosed = this.onDialogClosed.bind(this);
        this.onWindowKeyUp = this.onWindowKeyUp.bind(this);
    }

    play(options) {
        this.progress = 0;

        const elem = this.createMediaElement();
        return this.setCurrentSrc(elem, options);
    }

    stop() {
        this.unbindEvents();

        this.archiveSource?.release();

        const elem = this.mediaElement;
        if (elem) {
            dialogHelper.close(elem);
            this.mediaElement = null;
        }

        loading.hide();
    }

    onDialogClosed() {
        this.stop();
    }

    onWindowKeyUp(e) {
        const key = keyboardnavigation.getKeyName(e);
        switch (key) {
            case 'Escape':
                this.stop();
                break;
        }
    }

    bindMediaElementEvents() {
        const elem = this.mediaElement;

        elem?.addEventListener('close', this.onDialogClosed, {once: true});
        elem?.querySelector('.btnExit').addEventListener('click', this.onDialogClosed, {once: true});
    }

    bindEvents() {
        this.bindMediaElementEvents();

        document.addEventListener('keyup', this.onWindowKeyUp);
    }

    unbindMediaElementEvents() {
        const elem = this.mediaElement;

        elem?.removeEventListener('close', this.onDialogClosed);
        elem?.querySelector('.btnExit').removeEventListener('click', this.onDialogClosed);
    }

    unbindEvents() {
        this.unbindMediaElementEvents();

        document.removeEventListener('keyup', this.onWindowKeyUp);
    }

    createMediaElement() {
        let elem = this.mediaElement;
        if (elem) {
            return elem;
        }

        elem = document.getElementById('comicsPlayer');
        if (!elem) {
            elem = dialogHelper.createDialog({
                exitAnimationDuration: 400,
                size: 'fullscreen',
                autoFocus: false,
                scrollY: false,
                exitAnimation: 'fadeout',
                removeOnClose: true
            });

            elem.id = 'comicsPlayer';
            elem.classList.add('slideshowDialog');

            elem.innerHTML = `<div class="slideshowSwiperContainer"><div class="swiper-wrapper"></div></div>
<div class="actionButtons">
    <button is="paper-icon-button-light" class="autoSize btnExit" tabindex="-1"><i class="material-icons actionButtonIcon close"></i></button>
</div>`;

            dialogHelper.open(elem);
        }

        this.mediaElement = elem;
        this.bindEvents();
        return elem;
    }

    setCurrentSrc(elem, options) {
        const item = options.items[0];
        this.currentItem = item;

        loading.show();

        const serverId = item.ServerId;
        const apiClient = ServerConnections.getApiClient(serverId);

        Archive.init({
            workerUrl: appRouter.baseUrl() + '/libraries/worker-bundle.js'
        });

        const downloadUrl = apiClient.getItemDownloadUrl(item.Id);
        this.archiveSource = new ArchiveSource(downloadUrl);

        return this.archiveSource.load().then(() => {
            loading.hide();
            this.swiperInstance = new Swiper(elem.querySelector('.slideshowSwiperContainer'), {
                direction: 'horizontal',
                // loop is disabled due to the lack of Swiper support in virtual slides
                loop: false,
                zoom: {
                    minRatio: 1,
                    toggle: true,
                    containerClass: 'slider-zoom-container'
                },
                autoplay: false,
                keyboard: {
                    enabled: true
                },
                preloadImages: true,
                slidesPerView: 1,
                slidesPerColumn: 1,
                initialSlide: 0,
                // reduces memory consumption for large libraries while allowing preloading of images
                virtual: {
                    slides: this.archiveSource.urls,
                    cache: true,
                    renderSlide: this.getImgFromUrl,
                    addSlidesBefore: 1,
                    addSlidesAfter: 1
                }
            });
        });
    }

    getImgFromUrl(url) {
        return `<div class="swiper-slide">
                   <div class="slider-zoom-container">
                       <img src="${url}" class="swiper-slide-img">
                   </div>
               </div>`;
    }

    canPlayMediaType(mediaType) {
        return (mediaType || '').toLowerCase() === 'book';
    }

    canPlayItem(item) {
        if (item.Path && (item.Path.endsWith('cbz') || item.Path.endsWith('cbr'))) {
            return true;
        }

        return false;
    }
}

class ArchiveSource {
    constructor(url) {
        this.url = url;
        this.files = [];
        this.urls = [];
    }

    async load() {
        const res = await fetch(this.url);
        if (!res.ok) {
            return;
        }

        const blob = await res.blob();
        this.archive = await Archive.open(blob);
        this.raw = await this.archive.getFilesArray();
        await this.archive.extractFiles();

        const files = await this.archive.getFilesArray();
        files.sort((a, b) => {
            if (a.file.name < b.file.name) {
                return -1;
            } else {
                return 1;
            }
        });

        for (const file of files) {
            /* eslint-disable-next-line compat/compat */
            const url = URL.createObjectURL(file.file);
            this.urls.push(url);
        }
    }

    release() {
        this.files = [];
        /* eslint-disable-next-line compat/compat */
        this.urls.forEach(URL.revokeObjectURL);
        this.urls = [];
    }
}

export default ComicsPlayer;
