define(['focusManager', 'cardBuilder'], function (focusManager, cardBuilder) {
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
                    backdrop: 3
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
                    backdrop: 3
                },
                scalable: false
            });
        });
    }

    function loadChannelGuide(element, apiClient) {

        return apiClient.getLiveTvPrograms({

            UserId: apiClient.getCurrentUserId(),
            HasAired: false,
            SortBy: "StartDate",
            EnableTotalRecordCount: false,
            EnableImageTypes: "Primary",
            ImageTypeLimit: 1,
            Fields: "PrimaryImageAspectRatio"
        }).then(function (result) {

            var section = element.querySelector('.programGuideSection');

            if (!section) {
                return;
            }

            cardBuilder.buildCards(result.Items, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'backdrop',
                rows: 3,
                scalable: false
            });
        });
    }

    function loadUpcomingPrograms(element, apiClient) {

        return apiClient.getLiveTvRecordings({
            UserId: apiClient.getCurrentUserId(),
            IsAiring: false,
            HasAired: false,
            limit: 9,
            IsMovie: false,
            IsSports: false,
            IsKids: false,
            IsSeries: true

        }).then(function (result) {

            var section = element.querySelector('.upcomingProgramsSection');

            cardBuilder.buildCards(result.Items, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                preferThumb: 'auto',
                shape: 'auto',
                coverImage: true,
                rows: {
                    portrait: 2,
                    square: 3,
                    backdrop: 3
                },
                scalable: false
            });
        });
    }

    function loadUpcomingMovies(element, apiClient) {

        return apiClient.getLiveTvRecordings({

            UserId: apiClient.getCurrentUserId(),

            IsAiring: false,
            HasAired: false,
            limit: 9,
            IsMovie: true

        }).then(function (result) {

            var section = element.querySelector('.upcomingMoviesSection');

            cardBuilder.buildCards(result.Items, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                preferThumb: 'auto',
                shape: 'auto',
                coverImage: true,
                rows: {
                    portrait: 2,
                    square: 3,
                    backdrop: 3
                },
                scalable: false
            });
        });
    }

    function loadUpcomingSports(element, apiClient) {

        return apiClient.getLiveTvRecordings({

            UserId: apiClient.getCurrentUserId(),

            IsAiring: false,
            HasAired: false,
            limit: 9,
            IsSports: true

        }).then(function (result) {

            var section = element.querySelector('.upcomingSportsSection');

            cardBuilder.buildCards(result.Items, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                preferThumb: 'auto',
                shape: 'auto',
                coverImage: true,
                rows: {
                    portrait: 2,
                    square: 3,
                    backdrop: 3
                },
                scalable: false
            });
        });
    }

    function loadUpcomingKids(element, apiClient) {

        return apiClient.getLiveTvRecordings({

            UserId: apiClient.getCurrentUserId(),

            IsAiring: false,
            HasAired: false,
            limit: 9,
            IsSports: false,
            IsKids: true

        }).then(function (result) {

            var section = element.querySelector('.upcomingKidsSection');

            cardBuilder.buildCards(result.Items, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                preferThumb: 'auto',
                shape: 'auto',
                coverImage: true,
                rows: {
                    portrait: 2,
                    square: 3,
                    backdrop: 3
                },
                scalable: false
            });
        });
    }

    function gotoTvView(tab, parentId) {

        Emby.Page.show('/livetv.html?tab=' + tab);
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
                loadChannelGuide(element, apiClient),

                loadUpcomingPrograms(element, apiClient),
                loadUpcomingMovies(element, apiClient),

                loadUpcomingSports(element, apiClient),

                loadUpcomingKids(element, apiClient)
            ]);
        };

        element.querySelector('.guideCard').addEventListener('click', function () {
            gotoTvView('1', parentId);
        });

        element.querySelector('.channelsLiveTvCard').addEventListener('click', function () {
            gotoTvView('2', parentId);
        });

        element.querySelector('.recordingsCard').addEventListener('click', function () {
            gotoTvView('3', parentId);
        });

        self.destroy = function () {

        };
    }

    return view;

});
