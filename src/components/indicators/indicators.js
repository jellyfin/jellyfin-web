    import datetime from 'datetime';
    import itemHelper from 'itemHelper';
    import 'emby-progressbar';
    import 'css!./indicators.css';
    import 'material-icons';

    export function enableProgressIndicator(item) {
        if (item.MediaType === 'Video' && item.Type !== 'TvChannel') {
            return true;
        }

        if (item.Type === 'AudioBook' || item.Type === 'AudioPodcast') {
            return true;
        }

        return false;
    }

    export function getProgressHtml(pct, options) {
        var containerClass = options && options.containerClass ? 'itemProgressBar ' + options.containerClass : 'itemProgressBar';

        return '<div class="' + containerClass + '"><div class="itemProgressBarForeground" style="width:' + pct + '%;"></div></div>';
    }

    function getAutoTimeProgressHtml(pct, options, isRecording, start, end) {
        var containerClass = options && options.containerClass ? 'itemProgressBar ' + options.containerClass : 'itemProgressBar';
        var foregroundClass = isRecording ? 'itemProgressBarForeground itemProgressBarForeground-recording' : 'itemProgressBarForeground';

        return '<div is="emby-progressbar" data-automode="time" data-starttime="' + start + '" data-endtime="' + end + '" class="' + containerClass + '"><div class="' + foregroundClass + '" style="width:' + pct + '%;"></div></div>';
    }

    export function getProgressBarHtml(item, options) {
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

    export function enablePlayedIndicator(item) {
        return itemHelper.canMarkPlayed(item);
    }

    export function getPlayedIndicatorHtml(item) {
        if (enablePlayedIndicator(item)) {
            var userData = item.UserData || {};
            if (userData.UnplayedItemCount) {
                return '<div class="countIndicator indicator">' + userData.UnplayedItemCount + '</div>';
            }

            if (userData.PlayedPercentage && userData.PlayedPercentage >= 100 || (userData.Played)) {
                return '<div class="playedIndicator indicator"><i class="material-icons indicatorIcon">check</i></div>';
            }
        }

        return '';
    }

    export function getChildCountIndicatorHtml(item, options) {
        var minCount = options ? options.minCount : 0;

        if (item.ChildCount && item.ChildCount > minCount) {
            return '<div class="countIndicator indicator">' + item.ChildCount + '</div>';
        }

        return '';
    }

    export function getTimerIndicator(item) {
        var status;

        if (item.Type === 'SeriesTimer') {
            return '<i class="material-icons timerIndicator indicatorIcon fiber_smart_record"></i>';
        } else if (item.TimerId || item.SeriesTimerId) {
            status = item.Status || 'Cancelled';
        } else if (item.Type === 'Timer') {
            status = item.Status;
        } else {
            return '';
        }

        if (item.SeriesTimerId) {
            if (status !== 'Cancelled') {
                return '<i class="material-icons timerIndicator indicatorIcon fiber_smart_record"></i>';
            }

            return '<i class="material-icons timerIndicator timerIndicator-inactive indicatorIcon fiber_smart_record"></i>';
        }

        return '<i class="material-icons timerIndicator indicatorIcon fiber_manual_record"></i>';
    }

    export function getSyncIndicator(item) {
        if (item.SyncPercent === 100) {
            return '<div class="syncIndicator indicator fullSyncIndicator"><i class="material-icons indicatorIcon file_download"></i></div>';
        } else if (item.SyncPercent != null) {
            return '<div class="syncIndicator indicator emptySyncIndicator"><i class="material-icons indicatorIcon file_download"></i></div>';
        }

        return '';
    }

    export function getTypeIndicator(item) {
        if (item.Type === 'Video') {
            return '<div class="indicator videoIndicator"><i class="material-icons indicatorIcon">videocam</i></div>';
        }
        if (item.Type === 'Folder') {
            return '<div class="indicator videoIndicator"><i class="material-icons indicatorIcon">folder</i></div>';
        }
        if (item.Type === 'PhotoAlbum') {
            return '<div class="indicator videoIndicator"><i class="material-icons indicatorIcon photo_album"></i></div>';
        }
        if (item.Type === 'Photo') {
            return '<div class="indicator videoIndicator"><i class="material-icons indicatorIcon">photo</i></div>';
        }

        return '';
    }

    export function getMissingIndicator(item) {
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

    export default {
        getProgressHtml: getProgressHtml,
        getProgressBarHtml: getProgressBarHtml,
        getPlayedIndicatorHtml: getPlayedIndicatorHtml,
        getChildCountIndicatorHtml: getChildCountIndicatorHtml,
        enableProgressIndicator: enableProgressIndicator,
        getTimerIndicator: getTimerIndicator,
        enablePlayedIndicator: enablePlayedIndicator,
        getSyncIndicator: getSyncIndicator,
        getTypeIndicator: getTypeIndicator,
        getMissingIndicator: getMissingIndicator
    };
