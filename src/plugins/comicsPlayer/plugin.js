import loading from 'loading';
import dialogHelper from 'dialogHelper';
import keyboardnavigation from 'keyboardnavigation';
import appRouter from 'appRouter';
import * as libarchive from 'libarchive';

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

        let elem = this.createMediaElement();
        return this.setCurrentSrc(elem, options);
    }

    stop() {
        this.unbindEvents();

        let elem = this.mediaElement;
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
        let key = keyboardnavigation.getKeyName(e);
        switch (key) {
            case 'Escape':
                this.stop();
                break;
        }
    }

    bindEvents() {
        document.addEventListener('keyup', this.onWindowKeyUp);
    }

    unbindEvents() {
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

            elem.innerHTML = '<div class="slideshowSwiperContainer"><div class="swiper-wrapper"></div></div>';

            this.bindEvents();
            dialogHelper.open(elem);
        }

        this.mediaElement = elem;
        return elem;
    }

    setCurrentSrc(elem, options) {
        let item = options.items[0];
        this.currentItem = item;

        loading.show();

        let serverId = item.ServerId;
        let apiClient = window.connectionManager.getApiClient(serverId);

        libarchive.Archive.init({
            workerUrl: appRouter.baseUrl() + '/libraries/worker-bundle.js'
        });

        return new Promise((resolve, reject) => {
            let downloadUrl = apiClient.getItemDownloadUrl(item.Id);
            const archiveSource = new ArchiveSource(downloadUrl);

            var instance = this;
            import('swiper').then(({default: Swiper}) => {
                archiveSource.load().then(() => {
                    loading.hide();
                    this.swiperInstance = new Swiper(elem.querySelector('.slideshowSwiperContainer'), {
                        direction: 'horizontal',
                        // loop is disabled due to the lack of support in virtual slides
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
                            slides: archiveSource.urls,
                            cache: true,
                            renderSlide: instance.getImgFromUrl,
                            addSlidesBefore: 1,
                            addSlidesAfter: 1
                        }
                    });
                });
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
        this.loadPromise = this.load();
        this.itemsLoaded = 0;
    }

    async load() {
        let res = await fetch(this.url);
        if (!res.ok) {
            return;
        }

        let blob = await res.blob();
        this.archive = await libarchive.Archive.open(blob);
        this.raw = await this.archive.getFilesArray();
        this.numberOfFiles = this.raw.length;
        await this.archive.extractFiles();

        let files = await this.archive.getFilesArray();
        files.sort((a, b) => {
            if (a.file.name < b.file.name) {
                return -1;
            } else {
                return 1;
            }
        });

        for (let file of files) {
            /* eslint-disable-next-line compat/compat */
            let url = URL.createObjectURL(file.file);
            this.urls.push(url);
        }
    }

    getLength() {
        return this.raw.length;
    }

    async item(index) {
        if (this.urls[index]) {
            return this.urls[index];
        }

        await this.loadPromise;
        return this.urls[index];
    }
}

export default ComicsPlayer;
