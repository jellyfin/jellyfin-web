import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
// @ts-ignore
import { Archive } from 'libarchive.js';

import { ServerConnections } from 'lib/jellyfin-apiclient';
import { toApi } from 'utils/jellyfin-apiclient/compat';

import loading from '../../components/loading/loading';
import dialogHelper from '../../components/dialogHelper/dialogHelper';
import keyboardnavigation from '../../scripts/keyboardNavigation';
import { appRouter } from '../../components/router/appRouter';
import * as userSettings from '../../scripts/settings/userSettings';
import { PluginType } from '../../types/plugin';
import Events from '../../utils/events';
import { useBookStore } from '../../store/bookStore';

import './style.scss';

// supported book file extensions
const FILE_EXTENSIONS = ['.cbr', '.cbt', '.cbz', '.cb7'];
// the comic book archive supports any kind of image format as it's just a zip archive
const IMAGE_FORMATS = [
    'jpg',
    'jpeg',
    'jpe',
    'jif',
    'jfif',
    'jfi',
    'png',
    'avif',
    'gif',
    'bmp',
    'dib',
    'tiff',
    'tif',
    'webp'
];

export class ComicsPlayer {
    name: string = 'Comics Player';
    type: any = PluginType.MediaPlayer;
    id: string = 'comicsplayer';
    isLocalPlayer: boolean = true;
    priority: number = 1;
    imageMap: Map<string, string> = new Map();

    item: any;
    mediaElement: any;
    swiperInstance: any;
    archiveSource: any;
    comicsPlayerSettings: any;
    currentPage: number = 0;
    pageCount: number = 0;

    constructor() {
        this.onDialogClosed = this.onDialogClosed.bind(this);
        this.onWindowKeyDown = this.onWindowKeyDown.bind(this);
    }

    play(options: any) {
        this.currentPage = 0;
        this.pageCount = 0;

        const mediaSourceId = options.items[0].Id;
        this.comicsPlayerSettings = (userSettings as any).getComicsPlayerSettings(mediaSourceId);

        const elem = this.createMediaElement();
        return this.setCurrentSrc(elem, options);
    }

    stop() {
        this.unbindEvents();

        const stopInfo = {
            src: this.item
        };

        Events.trigger(this, 'stopped', [stopInfo]);

        const mediaSourceId = this.item.Id;
        (userSettings as any).setComicsPlayerSettings(this.comicsPlayerSettings, mediaSourceId);

        this.archiveSource?.release();

        const elem = this.mediaElement;
        if (elem) {
            dialogHelper.close(elem);
            this.mediaElement = null;
        }

        loading.hide();
        useBookStore.getState().reset();
    }

    destroy() {
        // Nothing to do here
    }

    currentItem() {
        return this.item;
    }

    currentTime() {
        return this.currentPage;
    }

    duration() {
        return this.pageCount;
    }

    onDialogClosed() {
        this.stop();
    }

    onDirChanged = () => {
        let langDir = this.comicsPlayerSettings.langDir;

        if (!langDir || langDir === 'ltr') {
            langDir = 'rtl';
        } else {
            langDir = 'ltr';
        }

        this.changeLanguageDirection(langDir);
        this.comicsPlayerSettings.langDir = langDir;
    };

    changeLanguageDirection(langDir: string) {
        const currentPage = this.currentPage;
        this.swiperInstance.changeLanguageDirection(langDir);

        const prevIcon = langDir === 'ltr' ? 'arrow_circle_left' : 'arrow_circle_right';
        this.mediaElement.querySelector('.btnToggleLangDir > span').classList.remove(prevIcon);

        const newIcon = langDir === 'ltr' ? 'arrow_circle_right' : 'arrow_circle_left';
        this.mediaElement.querySelector('.btnToggleLangDir > span').classList.add(newIcon);

        const dirTitle = langDir === 'ltr' ? 'Right To Left' : 'Left To Right';
        this.mediaElement.querySelector('.btnToggleLangDir').title = dirTitle;

        this.reload(currentPage);
    }

    onViewChanged = () => {
        let view = this.comicsPlayerSettings.pagesPerView;

        if (!view || view === 1) {
            view = 2;
        } else {
            view = 1;
        }

        this.changeView(view);
        this.comicsPlayerSettings.pagesPerView = view;
    };

    changeView(view: number) {
        const currentPage = this.currentPage;

        this.swiperInstance.params.slidesPerView = view;
        this.swiperInstance.params.slidesPerGroup = view;

        const prevIcon = view === 1 ? 'devices_fold' : 'import_contacts';
        this.mediaElement.querySelector('.btnToggleView > span').classList.remove(prevIcon);

        const newIcon = view === 1 ? 'import_contacts' : 'devices_fold';
        this.mediaElement.querySelector('.btnToggleView > span').classList.add(newIcon);

        const viewTitle = view === 1 ? 'Double Page View' : 'Single Page View';
        this.mediaElement.querySelector('.btnToggleView').title = viewTitle;

        this.reload(currentPage);
    }

    reload(currentPage: number) {
        const effect = this.swiperInstance.params.effect;

        this.swiperInstance.params.effect = 'none';
        this.swiperInstance.update();

        this.swiperInstance.slideNext();
        this.swiperInstance.slidePrev();

        if (this.currentPage !== currentPage) {
            this.swiperInstance.slideTo(currentPage);
            this.swiperInstance.update();
        }

        this.swiperInstance.params.effect = effect;
        this.swiperInstance.update();
    }

    onWindowKeyDown(e: KeyboardEvent) {
        if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;

        const key = (keyboardnavigation as any).getKeyName(e);
        if (key === 'Escape') {
            e.preventDefault();
            this.stop();
        }
    }

    bindEvents() {
        const elem = this.mediaElement;
        elem?.addEventListener('close', this.onDialogClosed, { once: true });
        elem?.querySelector('.btnExit').addEventListener('click', this.onDialogClosed, { once: true });
        elem?.querySelector('.btnToggleLangDir').addEventListener('click', this.onDirChanged);
        elem?.querySelector('.btnToggleView').addEventListener('click', this.onViewChanged);

        document.addEventListener('keydown', this.onWindowKeyDown);
    }

    unbindEvents() {
        const elem = this.mediaElement;
        elem?.removeEventListener('close', this.onDialogClosed);

        document.removeEventListener('keydown', this.onWindowKeyDown);
    }

    createMediaElement() {
        let elem = this.mediaElement;
        if (elem) return elem;

        elem = dialogHelper.createDialog({
            exitAnimationDuration: 400,
            size: 'fullscreen',
            autoFocus: false,
            scrollY: false,
            exitAnimation: 'fadeout',
            removeOnClose: true
        });

        const viewIcon = this.comicsPlayerSettings.pagesPerView === 1 ? 'import_contacts' : 'devices_fold';
        const dirIcon = this.comicsPlayerSettings.langDir === 'ltr' ? 'arrow_circle_right' : 'arrow_circle_left';

        elem.id = 'comicsPlayer';
        elem.classList.add('slideshowDialog');
        elem.innerHTML = `<div dir=${this.comicsPlayerSettings.langDir} class="slideshowSwiperContainer">
                            <div class="swiper-wrapper"></div>
                            <div class="swiper-button-next actionButtonIcon"></div>
                            <div class="swiper-button-prev actionButtonIcon"></div>
                            <div class="swiper-pagination"></div>
                        </div>
                        <div class="actionButtons">
                            <button is="paper-icon-button-light" class="autoSize btnToggleLangDir" tabindex="-1">
                                <span class="material-icons actionButtonIcon ${dirIcon}" aria-hidden="true"></span>
                            </button>
                            <button is="paper-icon-button-light" class="autoSize btnToggleView" tabindex="-1">
                                <span class="material-icons actionButtonIcon ${viewIcon}" aria-hidden="true"></span>
                            </button>
                            <button is="paper-icon-button-light" class="autoSize btnExit" tabindex="-1">
                                <span class="material-icons actionButtonIcon close" aria-hidden="true"></span>
                            </button>
                        </div>`;

        dialogHelper.open(elem);
        this.mediaElement = elem;

        const dirTitle = this.comicsPlayerSettings.langDir === 'ltr' ? 'Right To Left' : 'Left To Right';
        this.mediaElement.querySelector('.btnToggleLangDir').title = dirTitle;

        const viewTitle = this.comicsPlayerSettings.pagesPerView === 1 ? 'Double Page View' : 'Single Page View';
        this.mediaElement.querySelector('.btnToggleView').title = viewTitle;

        this.bindEvents();
        return elem;
    }

    setCurrentSrc(elem: HTMLElement, options: any) {
        const item = options.items[0];
        this.item = item;

        loading.show();

        Archive.init({
            workerUrl: appRouter.baseUrl() + '/libraries/worker-bundle.js'
        });

        const api = toApi(ServerConnections.getApiClient(item.ServerId));
        const libraryApi = getLibraryApi(api) as any;
        const downloadUrl = (libraryApi.getDownloadUrl?.({ itemId: item.Id }) || libraryApi.getDownload?.({ itemId: item.Id })) as string;
        this.archiveSource = new ArchiveSource(downloadUrl);

        // @ts-ignore
        import('swiper/css/bundle');

        return (
            this.archiveSource
                .load()
                // @ts-ignore
                .then(() => import('swiper/bundle'))
                .then(({ Swiper }: any) => {
                    loading.hide();

                    this.pageCount = this.archiveSource.urls.length;
                    this.currentPage = options.startPositionTicks / 10000 || 0;

                    useBookStore.getState().setCurrentBook(item.Id, this.pageCount);

                    this.swiperInstance = new Swiper(elem.querySelector('.slideshowSwiperContainer'), {
                        direction: 'horizontal',
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
                        slidesPerView: this.comicsPlayerSettings.pagesPerView,
                        slidesPerGroup: this.comicsPlayerSettings.pagesPerView,
                        initialSlide: this.currentPage,
                        navigation: {
                            nextEl: '.swiper-button-next',
                            prevEl: '.swiper-button-prev'
                        },
                        pagination: {
                            el: '.swiper-pagination',
                            clickable: true,
                            type: 'fraction'
                        },
                        virtual: {
                            slides: this.archiveSource.urls,
                            cache: true,
                            renderSlide: this.getImgFromUrl,
                            addSlidesBefore: 1,
                            addSlidesAfter: 1
                        }
                    });

                    this.swiperInstance.on('slideChange', () => {
                        this.currentPage = this.swiperInstance.activeIndex;
                        useBookStore.getState().setPage(this.currentPage + 1);
                        Events.trigger(this, 'pause');
                    });

                    useBookStore.getState().setLoaded(true);
                })
        );
    }

    getImgFromUrl(url: string) {
        return `<div class="swiper-slide">
                   <div class="slider-zoom-container">
                       <img src="${url}" class="swiper-slide-img">
                   </div>
               </div>`;
    }

    canPlayMediaType(mediaType: string) {
        return (mediaType || '').toLowerCase() === 'book';
    }

    canPlayItem(item: any) {
        return item.Path && FILE_EXTENSIONS.some(ext => item.Path.endsWith(ext));
    }
}

class ArchiveSource {
    url: string;
    files: any[] = [];
    urls: string[] = [];
    archive: any;
    raw: any;

    constructor(url: string) {
        this.url = url;
    }

    async load() {
        const res = await fetch(this.url);
        if (!res.ok) return;

        const blob = await res.blob();
        this.archive = await Archive.open(blob as any);
        this.raw = await this.archive.getFilesArray();
        await this.archive.extractFiles();

        let files = await this.archive.getFilesArray();

        files = files.filter((file: any) => {
            const name = file.file.name;
            const index = name.lastIndexOf('.');
            return index !== -1 && IMAGE_FORMATS.includes(name.slice(index + 1).toLowerCase());
        });
        files.sort((a: any, b: any) => (a.file.name < b.file.name ? -1 : 1));

        for (const file of files) {
            const url = URL.createObjectURL(file.file);
            this.urls.push(url);
        }
    }

    release() {
        this.files = [];
        this.urls.forEach(URL.revokeObjectURL);
        this.urls = [];
    }
}

export default ComicsPlayer;
