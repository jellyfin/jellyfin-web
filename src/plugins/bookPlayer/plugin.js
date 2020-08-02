import connectionManager from 'connectionManager';
import loading from 'loading';
import keyboardnavigation from 'keyboardnavigation';
import dialogHelper from 'dialogHelper';
import dom from 'dom';
import events from 'events';
import 'css!./style';
import 'material-icons';
import 'paper-icon-button-light';

import TableOfContents from './tableOfContents';

export class BookPlayer {
    constructor() {
        this.name = 'Book Player';
        this.type = 'mediaplayer';
        this.id = 'bookplayer';
        this.priority = 1;

        this.onDialogClosed = this.onDialogClosed.bind(this);
        this.openTableOfContents = this.openTableOfContents.bind(this);
        this.onWindowKeyUp = this.onWindowKeyUp.bind(this);
    }

    play(options) {
        this._progress = 0;
        this._loaded = false;

        loading.show();
        let elem = this.createMediaElement();
        return this.setCurrentSrc(elem, options);
    }

    stop() {
        this.unbindEvents();

        let elem = this._mediaElement;
        let tocElement = this._tocElement;
        let rendition = this._rendition;

        if (elem) {
            dialogHelper.close(elem);
            this._mediaElement = null;
        }

        if (tocElement) {
            tocElement.destroy();
            this._tocElement = null;
        }

        if (rendition) {
            rendition.destroy();
        }

        // Hide loader in case player was not fully loaded yet
        loading.hide();
        this._cancellationToken.shouldCancel = true;
    }

    currentItem() {
        return this._currentItem;
    }

    currentTime() {
        return this._progress * 1000;
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
        let key = keyboardnavigation.getKeyName(e);

        // TODO: depending on the event this can be the document or the rendition itself
        let rendition = this._rendition || this;
        let book = rendition.book;

        if (this._loaded === false) return;
        switch (key) {
            case 'l':
            case 'ArrowRight':
            case 'Right':
                book.package.metadata.direction === 'rtl' ? rendition.prev() : rendition.next();
                break;
            case 'j':
            case 'ArrowLeft':
            case 'Left':
                book.package.metadata.direction === 'rtl' ? rendition.next() : rendition.prev();
                break;
            case 'Escape':
                if (this._tocElement) {
                    // Close table of contents on ESC if it is open
                    this._tocElement.destroy();
                } else {
                    // Otherwise stop the entire book player
                    this.stop();
                }
                break;
        }
    }

    onTouchStart(e) {
        // TODO: depending on the event this can be the document or the rendition itself
        let rendition = this._rendition || this;
        let book = rendition.book;

        // check that the event is from the book or the document
        if (!book || this._loaded === false) return;

        // epubjs stores pages off the screen or something for preloading
        // get the modulus of the touch event to account for the increased width
        if (!e.touches || e.touches.length === 0) return;
        let touch = e.touches[0].clientX % dom.getWindowSize().innerWidth;
        if (touch < dom.getWindowSize().innerWidth / 2) {
            book.package.metadata.direction === 'rtl' ? rendition.next() : rendition.prev();
        } else {
            book.package.metadata.direction === 'rtl' ? rendition.prev() : rendition.next();
        }
    }

    onDialogClosed() {
        this.stop();
    }

    bindMediaElementEvents() {
        let elem = this._mediaElement;

        elem.addEventListener('close', this.onDialogClosed, {once: true});
        elem.querySelector('.btnBookplayerExit').addEventListener('click', this.onDialogClosed, {once: true});
        elem.querySelector('.btnBookplayerToc').addEventListener('click', this.openTableOfContents);
    }

    bindEvents() {
        this.bindMediaElementEvents();

        document.addEventListener('keyup', this.onWindowKeyUp);
        document.addEventListener('touchstart', this.onTouchStart);

        // FIXME: I don't really get why document keyup event is not triggered when epub is in focus
        this._rendition.on('keyup', this.onWindowKeyUp);
        this._rendition.on('touchstart', this.onTouchStart);
    }

    unbindMediaElementEvents() {
        let elem = this._mediaElement;

        elem.removeEventListener('close', this.onDialogClosed);
        elem.querySelector('.btnBookplayerExit').removeEventListener('click', this.onDialogClosed);
        elem.querySelector('.btnBookplayerToc').removeEventListener('click', this.openTableOfContents);
    }

    unbindEvents() {
        if (this._mediaElement) {
            this.unbindMediaElementEvents();
        }

        document.removeEventListener('keyup', this.onWindowKeyUp);
        document.removeEventListener('touchstart', this.onTouchStart);

        if (this._rendition) {
            this._rendition.off('keyup', this.onWindowKeyUp);
            this._rendition.off('touchstart', this.onTouchStart);
        }
    }

    openTableOfContents() {
        if (this._loaded) {
            this._tocElement = new TableOfContents(this);
        }
    }

    createMediaElement() {
        let elem = this._mediaElement;
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

            let html = '';
            html += '<div class="topRightActionButtons">';
            html += '<button is="paper-icon-button-light" class="autoSize bookplayerButton btnBookplayerExit hide-mouse-idle-tv" tabindex="-1"><i class="material-icons bookplayerButtonIcon close"></i></button>';
            html += '</div>';
            html += '<div class="topLeftActionButtons">';
            html += '<button is="paper-icon-button-light" class="autoSize bookplayerButton btnBookplayerToc hide-mouse-idle-tv" tabindex="-1"><i class="material-icons bookplayerButtonIcon toc"></i></button>';
            html += '</div>';

            elem.innerHTML = html;

            dialogHelper.open(elem);
        }

        this._mediaElement = elem;

        return elem;
    }

    setCurrentSrc(elem, options) {
        let item = options.items[0];
        this._currentItem = item;
        this.streamInfo = {
            started: true,
            ended: false,
            mediaSource: {
                Id: item.Id
            }
        };

        let serverId = item.ServerId;
        let apiClient = connectionManager.getApiClient(serverId);

        return new Promise((resolve, reject) => {
            require(['epubjs'], (epubjs) => {
                let downloadHref = apiClient.getItemDownloadUrl(item.Id);
                let book = epubjs.default(downloadHref, {openAs: 'epub'});
                let rendition = book.renderTo(elem, {width: '100%', height: '97%'});

                this._currentSrc = downloadHref;
                this._rendition = rendition;
                let cancellationToken = {
                    shouldCancel: false
                };

                this._cancellationToken = cancellationToken;

                return rendition.display().then(() => {
                    let epubElem = document.querySelector('.epub-container');
                    epubElem.style.display = 'none';

                    this.bindEvents();

                    return this._rendition.book.locations.generate(1024).then(async () => {
                        if (cancellationToken.shouldCancel) {
                            return reject();
                        }

                        const percentageTicks = options.startPositionTicks / 10000000;
                        if (percentageTicks !== 0.0) {
                            const resumeLocation = book.locations.cfiFromPercentage(percentageTicks);
                            await rendition.display(resumeLocation);
                        }

                        this._loaded = true;
                        epubElem.style.display = 'block';
                        rendition.on('relocated', (locations) => {
                            this._progress = book.locations.percentageFromCfi(locations.start.cfi);
                            events.trigger(this, 'timeupdate');
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
        if (item.Path && (item.Path.endsWith('epub'))) {
            return true;
        }

        return false;
    }
}

export default BookPlayer;
