import connectionManager from 'connectionManager';
import dom from 'dom';
import loading from 'loading';
import playbackManager from 'playbackManager';
import keyboardnavigation from 'keyboardnavigation';
import dialogHelper from 'dialogHelper';
import appHost from 'apphost';
import 'css!./style';
import 'material-icons';
import 'paper-icon-button-light';

import TableOfContent from './tableOfContent';

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
    }

    onWindowKeyUp(e) {
        let key = keyboardnavigation.getKeyName(e);
        let rendition = this._rendition;
        let book = rendition.book;

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
        // FIXME: I don't really get why document keyup event is not triggered when epub is in focus
        this._rendition.on('keyup', this.onWindowKeyUp);
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
        if (this._rendition) {
            this._rendition.off('keyup', this.onWindowKeyUp);
        }
    }

    openTableOfContents() {
        this._tocElement = new TableOfContent(this);
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
        if (!item.Path.endsWith('.epub')) {
            return new Promise((resolve, reject) => {
                let errorDialog = dialogHelper.createDialog({
                    size: 'small',
                    autoFocus: false,
                    removeOnClose: true
                });

                errorDialog.innerHTML = '<h1 class="bookplayerErrorMsg">This book type is not supported yet</h1>';

                this.stop();

                dialogHelper.open(errorDialog);
                loading.hide();

                return resolve();
            });
        }
        let serverId = item.ServerId;
        let apiClient = connectionManager.getApiClient(serverId);

        return new Promise((resolve, reject) => {
            require(['epubjs'], (epubjs) => {
                let downloadHref = apiClient.getItemDownloadUrl(item.Id);
                let book = epubjs.default(downloadHref, {openAs: 'epub'});
                let rendition = book.renderTo(elem, {width: '100%', height: '97%'});

                this._currentSrc = downloadHref;
                this._rendition = rendition;
                return rendition.display().then(() => {
                    this.bindEvents();

                    loading.hide();
                    return resolve();
                }, () => {
                    console.error('Failed to display epub');
                    return reject();
                });
            });
        });
    }

    canPlayMediaType(mediaType) {
        return (mediaType || '').toLowerCase() === 'book';
    }
}

export default BookPlayer;
