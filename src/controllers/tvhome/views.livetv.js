define(['cardBuilder', 'focusManager'], function (cardBuilder, focusManager) {
    'use strict';

    function loadLatestRecordings(element, apiClient) {

        return apiClient.getLiveTvRecordings({

            limit: 6,
            UserId: apiClient.getCurrentUserId(),
            IsInProgress: false,
            ImageTypeLimit: 1,
            Fields: "PrimaryImageAspectRatio"

        }).then(function (result) {

            var section = element.querySelector('.latestRecordingsSection');

            cardBuilder.buildCards(result.Items, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'auto',
                showParentTitleOrTitle: true,
                coverImage: true,
                rows: {
                    portrait: 2,
                    square: 3,
                    backdrop: 2
                },
                scalable: false,
                overlayText: true
            });
        });
    }

    function loadNowPlaying(element, apiClient) {

        return apiClient.getLiveTvRecommendedPrograms({

            UserId: apiClient.getCurrentUserId(),
            IsAiring: true,
            limit: 9,
            EnableImageTypes: "Primary",
            ImageTypeLimit: 1,
            Fields: "PrimaryImageAspectRatio"

        }).then(function (result) {

            var section = element.querySelector('.nowPlayingSection');

            cardBuilder.buildCards(result.Items, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                preferThumb: 'auto',
                shape: 'auto',
                coverImage: true,
                rows: {
                    portrait: 2,
                    square: 3,
                    backdrop: 2
                },
                scalable: false
            });
        });
    }

    function loadUpcomingPrograms(section, apiClient, options, shape) {

        options.ImageTypeLimit = 1;
        options.Fields = "PrimaryImageAspectRatio";
        options.UserId = apiClient.getCurrentUserId();

        return apiClient.getLiveTvRecommendedPrograms(options).then(function (result) {

            cardBuilder.buildCards(result.Items, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                preferThumb: 'auto',
                shape: 'auto',
                coverImage: true,
                rows: {
                    portrait: 2,
                    square: 3,
                    backdrop: 2
                },
                scalable: false
            });
        });
    }

    function view(element, apiClient, parentId, autoFocus) {
        var self = this;

        if (autoFocus) {
            focusManager.autoFocus(element);
        }

        self.loadData = function () {

            return Promise.all([
                loadLatestRecordings(element, apiClient),
                loadNowPlaying(element, apiClient),

                loadUpcomingPrograms(element.querySelector('.upcomingProgramsSection'), apiClient, {

                    HasAired: false,
                    limit: 10,
                    IsMovie: false,
                    IsSports: false,
                    IsKids: false,
                    IsSeries: true

                }),

                loadUpcomingPrograms(element.querySelector('.upcomingMoviesSection'), apiClient, {

                    HasAired: false,
                    limit: 10,
                    IsMovie: true

                }, 'portrait'),

                loadUpcomingPrograms(element.querySelector('.upcomingSportsSection'), apiClient, {

                    HasAired: false,
                    limit: 10,
                    IsSports: true

                }),

                loadUpcomingPrograms(element.querySelector('.upcomingKidsSection'), apiClient, {

                    HasAired: false,
                    limit: 10,
                    IsKids: true
                })
            ]);
        };

        element.querySelector('.guideCard').addEventListener('click', function () {
            Emby.Page.show('/livetv.html?tab=1&parentId=' + parentId);
        });

        element.querySelector('.channelsLiveTvCard').addEventListener('click', function () {
            Emby.Page.show('/livetv.html?tab=2&parentId=' + parentId);
        });

        element.querySelector('.recordingsCard').addEventListener('click', function () {
            Emby.Page.show('/livetv.html?tab=3&parentId=' + parentId);
        });

        self.destroy = function () {

        };
    }

    return view;

});
