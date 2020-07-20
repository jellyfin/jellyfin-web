import cardBuilder from 'cardBuilder';
import focusManager from 'focusManager';
import appRouter from 'appRouter';

function loadLatestRecordings(element, apiClient) {
    return apiClient.getLiveTvRecordings({
        limit: 6,
        UserId: apiClient.getCurrentUserId(),
        IsInProgress: false,
        ImageTypeLimit: 1,
        Fields: 'PrimaryImageAspectRatio'
    }).then(({Items}) => {
        const section = element.querySelector('.latestRecordingsSection');
        if (!section) {
            return;
        }
        cardBuilder.buildCards(Items, {
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
        return;
    });
}

function loadNowPlaying(element, apiClient) {
    return apiClient.getLiveTvRecommendedPrograms({
        UserId: apiClient.getCurrentUserId(),
        IsAiring: true,
        limit: 9,
        EnableImageTypes: 'Primary',
        ImageTypeLimit: 1,
        Fields: 'PrimaryImageAspectRatio'
    }).then(({Items}) => {
        const section = element.querySelector('.nowPlayingSection');
        if (!section) {
            return;
        }
        cardBuilder.buildCards(Items, {
            parentContainer: section,
            itemsContainer: section.querySelector('.itemsContainer'),
            preferThumb: 'auto',
            shape: 'auto',
            overlayText: true,
            rows: {
                portrait: 2,
                square: 3,
                backdrop: 3
            },
            scalable: false,
            coverImage: true,
            showTitle: true
        });
        return;
    });
}

function loadUpcomingPrograms(section, apiClient, options) {
    options.ImageTypeLimit = 1;
    options.Fields = 'PrimaryImageAspectRatio';
    options.UserId = apiClient.getCurrentUserId();
    return apiClient.getLiveTvRecommendedPrograms(options).then(({Items}) => {
        cardBuilder.buildCards(Items, {
            parentContainer: section,
            itemsContainer: section.querySelector('.itemsContainer'),
            preferThumb: 'auto',
            shape: 'auto',
            overlayText: true,
            rows: {
                portrait: 2,
                square: 3,
                backdrop: 3
            },
            scalable: false,
            coverImage: true,
            showTitle: true
        });
        return;
    });
}

function gotoLivetvView(tab, parentId) {
    appRouter.show(`/livetv.html?tab=${tab}&parentid=${parentId}`);
}

export class LivetvView {
    constructor(element, apiClient, parentId, autoFocus) {
        if (autoFocus) {
            focusManager.autoFocus(element);
        }
        this.loadData = () => {
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
                }),
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
        element.querySelector('.guideCard').addEventListener('click', () => {
            gotoLivetvView('1', parentId);
        });
        element.querySelector('.channelsLiveTvCard').addEventListener('click', () => {
            gotoLivetvView('2', parentId);
        });
        element.querySelector('.recordingsCard').addEventListener('click', () => {
            gotoLivetvView('3', parentId);
        });
    }

    destroy () {}
}

export default LivetvView;
