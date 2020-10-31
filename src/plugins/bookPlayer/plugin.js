import browser from 'browser';
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
        this.prevChapter = this.prevChapter.bind(this);
        this.nextChapter = this.nextChapter.bind(this);
        this.onWindowKeyUp = this.onWindowKeyUp.bind(this);
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
        const rendition = this.rendition;
        const book = rendition.book;

        if (!this.loaded) return;
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

    onDialogClosed() {
        this.stop();
    }

    bindMediaElementEvents() {
        const elem = this.mediaElement;

        elem.addEventListener('close', this.onDialogClosed, {once: true});
        elem.querySelector('#btnBookplayerExit').addEventListener('click', this.onDialogClosed, {once: true});
        elem.querySelector('#btnBookplayerToc').addEventListener('click', this.openTableOfContents);
        if (browser.mobile) {
            elem.querySelector('#btnBookplayerPrev').addEventListener('click', this.prevChapter);
            elem.querySelector('#btnBookplayerNext').addEventListener('click', this.nextChapter);
        }
    }

    bindEvents() {
        this.bindMediaElementEvents();

        document.addEventListener('keyup', this.onWindowKeyUp);

        // FIXME: I don't really get why document keyup event is not triggered when epub is in focus
        this.rendition.on('keyup', this.onWindowKeyUp);
    }

    unbindMediaElementEvents() {
        const elem = this.mediaElement;

        elem.removeEventListener('close', this.onDialogClosed);
        elem.querySelector('#btnBookplayerExit').removeEventListener('click', this.onDialogClosed);
        elem.querySelector('#btnBookplayerToc').removeEventListener('click', this.openTableOfContents);
        if (browser.mobile) {
            elem.querySelector('#btnBookplayerPrev').removeEventListener('click', this.prevChapter);
            elem.querySelector('#btnBookplayerNext').removeEventListener('click', this.nextChapter);
        }
    }

    unbindEvents() {
        if (this.mediaElement) {
            this.unbindMediaElementEvents();
        }

        document.removeEventListener('keyup', this.onWindowKeyUp);

        if (this.rendition) {
            this.rendition.off('keyup', this.onWindowKeyUp);
        }
    }

    openTableOfContents() {
        if (this.loaded) {
            this.tocElement = new TableOfContents(this);
        }
    }

    prevChapter(e) {
        this._rendition.prev();
        e.preventDefault();
    }

    nextChapter(e) {
        this._rendition.next();
        e.preventDefault();
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

            let html = '';

            if (browser.mobile) {
                html += '<div class="button-wrapper top-button"><button id="btnBookplayerPrev" is="paper-icon-button-light" class="autoSize bookplayerButton hide-mouse-idle-tv"><i class="material-icons bookplayerButtonIcon navigate_before"></i> Prev</button></div>';
            }

            html += '<div id="viewer">';
            html += '<div class="topButtons">';
            html += '<button is="paper-icon-button-light" id="btnBookplayerToc" class="autoSize bookplayerButton hide-mouse-idle-tv" tabindex="-1"><i class="material-icons bookplayerButtonIcon toc"></i></button>';
            html += '<button is="paper-icon-button-light" id="btnBookplayerExit" class="autoSize bookplayerButton hide-mouse-idle-tv" tabindex="-1"><i class="material-icons bookplayerButtonIcon close"></i></button>';
            html += '</div>';
            html += '</div>';

            if (browser.mobile) {
                html += '<div class="button-wrapper bottom-button"><button id="btnBookplayerNext" is="paper-icon-button-light" class="autoSize bookplayerButton hide-mouse-idle-tv">Next <i class="material-icons bookplayerButtonIcon navigate_next"></i></button></div>';
            }

            elem.id = 'bookPlayer';
            elem.innerHTML = html;

            dialogHelper.open(elem);
        }

        this.mediaElement = elem;
        return elem;
    }

    render(elem, book) {
        if (browser.mobile) {
            return book.renderTo(elem, {
                width: '100%',
                height: '100%',
                flow: 'scrolled-doc'
            });
        } else {
            return book.renderTo(elem, {
                width: '100%',
                height: '100%'
            });
        }
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
        const apiClient = window.connectionManager.getApiClient(serverId);

        return new Promise((resolve, reject) => {
            import('epubjs').then(({default: epubjs}) => {
                const downloadHref = apiClient.getItemDownloadUrl(item.Id);
                const book = epubjs(downloadHref, {openAs: 'epub'});
                const rendition = this.render('viewer', book);

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
        if (item.Path && item.Path.endsWith('epub')) {
            return true;
        }

        return false;
    }
}

export default BookPlayer;
