import { Events } from 'jellyfin-apiclient';
import 'material-design-icons-iconfont';

import loading from '../../components/loading/loading';
import keyboardnavigation from '../../scripts/keyboardNavigation';
import dialogHelper from '../../components/dialogHelper/dialogHelper';
import ServerConnections from '../../components/ServerConnections';
import TableOfContents from './tableOfContents';
import dom from '../../scripts/dom';
import { translateHtml } from '../../scripts/globalize';

import '../../scripts/dom';
import '../../elements/emby-button/paper-icon-button-light';

import html from './template.html';
import './style.scss';

export class BookPlayer {
    constructor() {
        this.name = 'Book Player';
        this.type = 'mediaplayer';
        this.id = 'bookplayer';
        this.priority = 1;

        this.onDialogClosed = this.onDialogClosed.bind(this);
        this.openTableOfContents = this.openTableOfContents.bind(this);
        this.previous = this.previous.bind(this);
        this.next = this.next.bind(this);
        this.onWindowKeyUp = this.onWindowKeyUp.bind(this);
        this.onTouchStart = this.onTouchStart.bind(this);
    }

    play(options) {
        this.progress = 0;
        this.cancellationToken = false;
        this.loaded = false;

        loading.show();
        const elem = this.createMediaElement();
        return this.setCurrentSrc(elem, options);
    }

    stop() {
        this.unbindEvents();

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

        // hide loader in case player was not fully loaded yet
        loading.hide();
        this.cancellationToken = true;
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

    getBufferedRanges() {
        return [{
            start: 0,
            end: 10000000
        }];
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
                if (this.tocElement) {
                    // Close table of contents on ESC if it is open
                    this.tocElement.destroy();
                } else {
                    // Otherwise stop the entire book player
                    this.stop();
                }
                break;
        }
    }

    onTouchStart(e) {
        if (!this.loaded || !e.touches || e.touches.length === 0) return;

        // epubjs stores pages off the screen or something for preloading
        // get the modulus of the touch event to account for the increased width
        const touchX = e.touches[0].clientX % dom.getWindowSize().innerWidth;
        if (touchX < dom.getWindowSize().innerWidth / 2) {
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

        elem.addEventListener('close', this.onDialogClosed, {once: true});
        elem.querySelector('#btnBookplayerExit').addEventListener('click', this.onDialogClosed, {once: true});
        elem.querySelector('#btnBookplayerToc').addEventListener('click', this.openTableOfContents);
        elem.querySelector('#btnBookplayerPrev')?.addEventListener('click', this.previous);
        elem.querySelector('#btnBookplayerNext')?.addEventListener('click', this.next);
    }

    bindEvents() {
        this.bindMediaElementEvents();

        document.addEventListener('keyup', this.onWindowKeyUp);

        this.rendition.on('touchstart', this.onTouchStart);
        this.rendition.on('keyup', this.onWindowKeyUp);
    }

    unbindMediaElementEvents() {
        const elem = this.mediaElement;

        elem.removeEventListener('close', this.onDialogClosed);
        elem.querySelector('#btnBookplayerExit').removeEventListener('click', this.onDialogClosed);
        elem.querySelector('#btnBookplayerToc').removeEventListener('click', this.openTableOfContents);
        elem.querySelector('#btnBookplayerPrev')?.removeEventListener('click', this.previous);
        elem.querySelector('#btnBookplayerNext')?.removeEventListener('click', this.next);
    }

    unbindEvents() {
        if (this.mediaElement) {
            this.unbindMediaElementEvents();
        }

        document.removeEventListener('keyup', this.onWindowKeyUp);

        this.rendition?.off('touchstart', this.onTouchStart);
        this.rendition?.off('keyup', this.onWindowKeyUp);
    }

    openTableOfContents() {
        if (this.loaded) {
            this.tocElement = new TableOfContents(this);
        }
    }

    previous(e) {
        e?.preventDefault();
        if (this.rendition) {
            this.rendition.book.package.metadata.direction === 'rtl' ? this.rendition.next() : this.rendition.prev();
        }
    }

    next(e) {
        e?.preventDefault();
        if (this.rendition) {
            this.rendition.book.package.metadata.direction === 'rtl' ? this.rendition.prev() : this.rendition.next();
        }
    }

    createMediaElement() {
        let elem = this.mediaElement;
        if (elem) {
            return elem;
        }

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

    setCurrentSrc(elem, options) {
        const item = options.items[0];
        this.item = item;
        this.streamInfo = {
            started: true,
            ended: false,
            mediaSource: {
                Id: item.Id
            }
        };

        const serverId = item.ServerId;
        const apiClient = ServerConnections.getApiClient(serverId);

        return new Promise((resolve, reject) => {
            import('epubjs').then(({default: epubjs}) => {
                const downloadHref = apiClient.getItemDownloadUrl(item.Id);
                const book = epubjs(downloadHref, {openAs: 'epub'});

                const rendition = book.renderTo('bookPlayerContainer', {
                    width: '100%',
                    // Calculate the height of the window because using 100% is not accurate when the dialog is opening
                    height: document.body.clientHeight,
                    // TODO: Add option for scrolled-doc
                    flow: 'paginated'
                });

                this.currentSrc = downloadHref;
                this.rendition = rendition;

                return rendition.display().then(() => {
                    const epubElem = document.querySelector('.epub-container');
                    epubElem.style.display = 'none';

                    this.bindEvents();

                    return this.rendition.book.locations.generate(1024).then(async () => {
                        if (this.cancellationToken) reject();

                        const percentageTicks = options.startPositionTicks / 10000000;
                        if (percentageTicks !== 0.0) {
                            const resumeLocation = book.locations.cfiFromPercentage(percentageTicks);
                            await rendition.display(resumeLocation);
                        }

                        this.loaded = true;
                        epubElem.style.display = 'block';
                        rendition.on('relocated', (locations) => {
                            this.progress = book.locations.percentageFromCfi(locations.start.cfi);
                            Events.trigger(this, 'timeupdate');
                        });

                        loading.hide();
                        return resolve();
                    });
                }, () => {
                    console.error('failed to display epub');
                    return reject();
                });
            });
        });
    }

    canPlayMediaType(mediaType) {
        return (mediaType || '').toLowerCase() === 'book';
    }

    canPlayItem(item) {
        if (item.Path && item.Path.endsWith('epub')) {
            return true;
        }

        return false;
    }
}

export default BookPlayer;
