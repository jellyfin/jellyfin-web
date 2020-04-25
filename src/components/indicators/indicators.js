define(['datetime', 'itemHelper', 'emby-progressbar', 'css!./indicators.css', 'material-icons'], function (datetime, itemHelper) {
    'use strict';

    function enableProgressIndicator(item) {
        if (item.MediaType === 'Video') {
            if (item.Type !== 'TvChannel') {
                return true;
            }
        }

        if (item.Type === 'AudioBook' || item.Type === 'AudioPodcast') {
            return true;
        }

        return false;
    }

    function getProgressHtml(pct, options) {
        var containerClass = 'itemProgressBar';
        if (options) {
            if (options.containerClass) {
                containerClass += ' ' + options.containerClass;
            }
        }

        return '<div class="' + containerClass + '"><div class="itemProgressBarForeground" style="width:' + pct + '%;"></div></div>';
    }

    function getAutoTimeProgressHtml(pct, options, isRecording, start, end) {
        var containerClass = 'itemProgressBar';
        if (options) {
            if (options.containerClass) {
                containerClass += ' ' + options.containerClass;
            }
        }

        var foregroundClass = 'itemProgressBarForeground';
        if (isRecording) {
            foregroundClass += ' itemProgressBarForeground-recording';
        }

        return '<div is="emby-progressbar" data-automode="time" data-starttime="' + start + '" data-endtime="' + end + '" class="' + containerClass + '"><div class="' + foregroundClass + '" style="width:' + pct + '%;"></div></div>';
    }

    function getProgressBarHtml(item, options) {
        var pct;
        if (enableProgressIndicator(item) && item.Type !== "Recording") {
            var userData = options ? (options.userData || item.UserData) : item.UserData;
            if (userData) {
                pct = userData.PlayedPercentage;
                if (pct && pct < 100) {
                    return getProgressHtml(pct, options);
                }
            }
        }

        if ((item.Type === 'Program' || item.Type === 'Timer' || item.Type === 'Recording') && item.StartDate && item.EndDate) {
            var startDate = 0;
            var endDate = 1;

            try {
                startDate = datetime.parseISO8601Date(item.StartDate).getTime();
                endDate = datetime.parseISO8601Date(item.EndDate).getTime();
            } catch (err) {
                console.error(err);
            }

            var now = new Date().getTime();
            var total = endDate - startDate;
            pct = 100 * ((now - startDate) / total);

            if (pct > 0 && pct < 100) {
                var isRecording = item.Type === 'Timer' || item.Type === 'Recording' || item.TimerId;
                return getAutoTimeProgressHtml(pct, options, isRecording, startDate, endDate);
            }
        }

        return '';
    }

    function enablePlayedIndicator(item) {
        return itemHelper.canMarkPlayed(item);
    }

    function getPlayedIndicator(item) {
        if (enablePlayedIndicator(item)) {
            var userData = item.UserData || {};
            if (userData.UnplayedItemCount) {
                return '<div class="countIndicator indicator">' + userData.UnplayedItemCount + '</div>';
            }

            if (userData.PlayedPercentage && userData.PlayedPercentage >= 100 || (userData.Played)) {
                return '<div class="playedIndicator indicator"><span class="material-icons indicatorIcon check"></span></div>';
            }
        }

        return '';
    }

    function getCountIndicatorHtml(count) {
        return '<div class="countIndicator indicator">' + count + '</div>';
    }

    function getChildCountIndicatorHtml(item, options) {
        var minCount = 0;
        if (options) {
            minCount = options.minCount || minCount;
        }

        if (item.ChildCount && item.ChildCount > minCount) {
            return getCountIndicatorHtml(item.ChildCount);
        }

        return '';
    }

    function getTimerIndicator(item) {
        var status;

        if (item.Type === 'SeriesTimer') {
            return '<span class="material-icons timerIndicator indicatorIcon fiber_smart_record"></span>';
        } else if (item.TimerId || item.SeriesTimerId) {
            status = item.Status || 'Cancelled';
        } else if (item.Type === 'Timer') {
            status = item.Status;
        } else {
            return '';
        }

        if (item.SeriesTimerId) {
            if (status !== 'Cancelled') {
                return '<span class="material-icons timerIndicator indicatorIcon fiber_smart_record"></span>';
            }

            return '<span class="material-icons timerIndicator timerIndicator-inactive indicatorIcon fiber_smart_record"></span>';
        }

        return '<span class="material-icons timerIndicator indicatorIcon fiber_manual_record"></span>';
    }

    function getSyncIndicator(item) {
        if (item.SyncPercent === 100) {
            return '<div class="syncIndicator indicator fullSyncIndicator"><span class="material-icons indicatorIcon file_download"></span></div>';
        } else if (item.SyncPercent != null) {
            return '<div class="syncIndicator indicator emptySyncIndicator"><span class="material-icons indicatorIcon file_download"></span></div>';
        }

        return '';
    }

    function getTypeIndicator(item) {
        if (item.Type === 'Video') {
            return '<div class="indicator videoIndicator"><span class="material-icons indicatorIcon videocam"></span></div>';
        }
        if (item.Type === 'Folder') {
            return '<div class="indicator videoIndicator"><span class="material-icons indicatorIcon folder"></span></div>';
        }
        if (item.Type === 'PhotoAlbum') {
            return '<div class="indicator videoIndicator"><span class="material-icons indicatorIcon photo_album"></span></div>';
        }
        if (item.Type === 'Photo') {
            return '<div class="indicator videoIndicator"><span class="material-icons indicatorIcon photo"></span></div>';
        }

        return '';
    }

    function getMissingIndicator(item) {
        if (item.Type === 'Episode' && item.LocationType === 'Virtual') {
            if (item.PremiereDate) {
                try {
                    var premiereDate = datetime.parseISO8601Date(item.PremiereDate).getTime();
                    if (premiereDate > new Date().getTime()) {
                        return '<div class="unairedIndicator">Unaired</div>';
                    }
                } catch (err) {
                    console.error(err);
                }
            }
            return '<div class="missingIndicator">Missing</div>';
        }

        return '';
    }

    return {
        getProgressHtml: getProgressHtml,
        getProgressBarHtml: getProgressBarHtml,
        getPlayedIndicatorHtml: getPlayedIndicator,
        getChildCountIndicatorHtml: getChildCountIndicatorHtml,
        enableProgressIndicator: enableProgressIndicator,
        getTimerIndicator: getTimerIndicator,
        enablePlayedIndicator: enablePlayedIndicator,
        getSyncIndicator: getSyncIndicator,
        getTypeIndicator: getTypeIndicator,
        getMissingIndicator: getMissingIndicator
    };
});
