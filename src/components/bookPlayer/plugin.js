define(['connectionManager', 'dom', 'loading', 'playbackManager', 'keyboardnavigation', 'dialogHelper', 'apphost', 'css!./style', 'material-icons', 'paper-icon-button-light'], function (connectionManager, dom, loading, playbackManager, keyboardnavigation, dialogHelper, appHost) {
    'use strict';

    function BookPlayer() {
        let self = this;

        self.name = 'Book Player';
        self.type = 'mediaplayer';
        self.id = 'bookplayer';
        self.priority = 1;

        self.play = function (options) {
            loading.show();
            let elem = createMediaElement();
            return setCurrentSrc(elem, options);
        };

        self.stop = function () {
            let elem = self._mediaElement;
            let rendition = self._rendition;

            if (elem && rendition) {
                rendition.destroy();

                elem.remove();
                self._mediaElement = null;
            }
        };

        function onWindowKeyUp(e) {
            let key = keyboardnavigation.getKeyName(e);
            let rendition = self._rendition;
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
                    dialogHelper.close(self._mediaElement);
                    break;
            }
        }

        function onDialogClosed() {
            self.stop();
        }

        function createMediaElement() {
            let elem = self._mediaElement;

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
                html += '<div class="topActionButtons">';
                html += '<button is="paper-icon-button-light" class="autoSize bookplayerButton btnBookplayerExit hide-mouse-idle-tv" tabindex="-1"><i class="material-icons bookplayerButtonIcon close"></i></button>';
                html += '</div>';

                elem.innerHTML = html;

                elem.querySelector('.btnBookplayerExit').addEventListener('click', function () {
                    dialogHelper.close(elem);
                });

                dialogHelper.open(elem);

                elem.addEventListener('close', onDialogClosed);
            }

            self._mediaElement = elem;

            return elem;
        }

        function setCurrentSrc(elem, options) {
            let serverId = options.items[0].ServerId;
            let apiClient = connectionManager.getApiClient(serverId);

            return new Promise(function (resolve, reject) {
                require(['epubjs'], function (epubjs) {
                    let downloadHref = apiClient.getItemDownloadUrl(options.items[0].Id);
                    self._currentSrc = downloadHref;

                    let book = epubjs.default(downloadHref, {openAs: 'epub'});

                    let rendition = book.renderTo(elem, {width: '100%', height: '97%'});
                    self._rendition = rendition;

                    return rendition.display().then(function () {
                        document.addEventListener('keyup', onWindowKeyUp);
                        // FIXME: I don't really get why document keyup event is not triggered when epub is in focus
                        self._rendition.on('keyup', onWindowKeyUp);

                        loading.hide();

                        return resolve();
                    }, function () {
                        console.error('Failed to display epub');
                        return reject();
                    });
                });
            });
        }
    }

    BookPlayer.prototype.canPlayMediaType = function (mediaType) {
        return (mediaType || '').toLowerCase() === 'book';
    };

    return BookPlayer;
});
