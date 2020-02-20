define(['focusManager', 'cardBuilder'], function (focusManager, cardBuilder) {
    'use strict';

    function loadLatestRecordings(element) {

        return Emby.Models.liveTvRecordings({

            limit: 6,
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

    function loadNowPlaying(element) {

        return Emby.Models.liveTvRecommendedPrograms({

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

    function loadUpcomingPrograms(section, options, shape) {

        return Emby.Models.liveTvRecommendedPrograms(options).then(function (result) {

            cardBuilder.buildCards(result.Items, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                preferThumb: 'auto',
                shape: shape || 'auto',
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

    function view(element, parentId, autoFocus) {
        var self = this;

        if (autoFocus) {
            focusManager.autoFocus(element);
        }

        self.loadData = function () {

            return Promise.all([
                loadLatestRecordings(element),
                loadNowPlaying(element),

                loadUpcomingPrograms(element.querySelector('.upcomingProgramsSection'), {

                    IsAiring: false,
                    HasAired: false,
                    limit: 9,
                    IsMovie: false,
                    IsSports: false,
                    IsKids: false,
                    IsSeries: true

                }),

                loadUpcomingPrograms(element.querySelector('.upcomingMoviesSection'), {

                    IsAiring: false,
                    HasAired: false,
                    limit: 9,
                    IsMovie: true

                }),

                loadUpcomingPrograms(element.querySelector('.upcomingSportsSection'), {

                    IsAiring: false,
                    HasAired: false,
                    limit: 9,
                    IsSports: true

                }),

                loadUpcomingPrograms(element.querySelector('.upcomingKidsSection'), {

                    IsAiring: false,
                    HasAired: false,
                    limit: 9,
                    IsSports: false,
                    IsKids: true
                })
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

        element.querySelector('.scheduledLiveTvCard').addEventListener('click', function () {
            gotoTvView('4', parentId);
        });

        self.destroy = function () {

        };
    }

    return view;

});
