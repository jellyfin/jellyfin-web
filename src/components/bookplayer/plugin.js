define(['connectionManager', 'dom'], function (connectionManager, dom) {
    'use strict';

    function BookPlayer() {
        var self = this;

        self.name = 'Book Player';
        self.type = 'mediaplayer';
        self.id = 'bookplayer';
        self.priority = 1;
    }

    BookPlayer.prototype.play = function (values) {
        var serverId = values.items[0].ServerId
        var apiClient = connectionManager.getApiClient(serverId);
        var options = values;

        require(['epubjs', 'appFooter-shared'], function (epubjs, appFooter) {
            appFooter.element.insertAdjacentHTML('beforebegin', '<div id="bookPlayer"></div>');
            var element = document.getElementById('bookPlayer');

            var downloadHref = apiClient.getItemDownloadUrl(options.items[0].Id);

            var book = epubjs.default(downloadHref, { openAs: 'epub' });
            var rendition = book.renderTo(element, { method: "continuous", width: "100%", height: "100%" });
            var displayed = rendition.display();
        });
    };

    BookPlayer.prototype.canPlayMediaType = function (mediaType) {
        return (mediaType || '').toLowerCase() === 'book';
    };

    return BookPlayer;
});
