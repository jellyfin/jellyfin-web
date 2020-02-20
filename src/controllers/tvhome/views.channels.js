define(['cardBuilder', 'globalize', 'emby-itemscontainer'], function (cardBuilder, globalize) {
    'use strict';

    function loadChannels(element, parentId, autoFocus) {

        return Emby.Models.channels().then(function (result) {

            var section = element.querySelector('.channelsSection');

            if (!section) {
                return;
            }

            cardBuilder.buildCards(result.Items, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'backdrop',
                rows: 3,
                preferThumb: true,
                autoFocus: autoFocus,
                scalable: false
            });

            var latestContainer = element.querySelector('.latestContainer');

            latestContainer.innerHTML = '';

            return Promise.all(result.Items.map(function (i) {
                return loadLatest(latestContainer, i);
            }));
        });
    }

    function loadLatest(element, channel) {

        var html = '<div class="sectionTitle">'+ globalize.translate('LatestFromValue', channel.Name) + '</div><div is="emby-itemscontainer" class="itemsContainer"></div>';

        var section = document.createElement('div');
        section.classList.add('hide');
        section.classList.add('horizontalSection');

        section.innerHTML = html;
        element.appendChild(section);

        var options = {

            Limit: 6,
            ChannelIds: channel.Id
        };

        return Emby.Models.latestChannelItems(options).then(function (result) {

            cardBuilder.buildCards(result.Items, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'auto',
                showTitle: false,
                rows: {
                    portrait: 2,
                    square: 3,
                    backdrop: 3
                },
                scalable: false
            });
        });
    }

    function view(element, parentId, autoFocus) {

        var self = this;

        self.loadData = function () {
            return loadChannels(element, parentId, autoFocus);
        };

        self.destroy = function () {

        };
    }

    return view;
});
