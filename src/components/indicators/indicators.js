import datetime from '../../scripts/datetime';
import itemHelper from '../itemHelper';
import '../../elements/emby-progressbar/emby-progressbar';
import './indicators.scss';

export function enableProgressIndicator(item) {
    return (
        (item.MediaType === 'Video' && item.Type !== 'TvChannel') ||
        item.Type === 'AudioBook' ||
        item.Type === 'AudioPodcast'
    );
}

export function getProgressHtml(pct, options) {
    let containerClass = 'itemProgressBar';
    if (options?.containerClass) {
        containerClass += ' ' + options.containerClass;
    }

    return (
        '<div class="' +
        containerClass +
        '"><div class="itemProgressBarForeground" style="width:' +
        pct +
        '%;"></div></div>'
    );
}

function getAutoTimeProgressHtml(pct, options, isRecording, start, end) {
    let containerClass = 'itemProgressBar';
    if (options?.containerClass) {
        containerClass += ' ' + options.containerClass;
    }

    let foregroundClass = 'itemProgressBarForeground';
    if (isRecording) {
        foregroundClass += ' itemProgressBarForeground-recording';
    }

    return (
        '<div is="emby-progressbar" data-automode="time" data-starttime="' +
        start +
        '" data-endtime="' +
        end +
        '" class="' +
        containerClass +
        '"><div class="' +
        foregroundClass +
        '" style="width:' +
        pct +
        '%;"></div></div>'
    );
}

export function getProgressBarHtml(item, options) {
    let pct;
    if (enableProgressIndicator(item) && item.Type !== 'Recording') {
        const userData = options?.userData ? options.userData : item.UserData;

        if (userData) {
            pct = userData.PlayedPercentage;
            if (pct && pct < 100) {
                return getProgressHtml(pct, options);
            }
        }
    }

    if (
        (item.Type === 'Program' || item.Type === 'Timer' || item.Type === 'Recording') &&
        item.StartDate &&
        item.EndDate
    ) {
        let startDate = 0;
        let endDate = 1;

        try {
            startDate = datetime.parseISO8601Date(item.StartDate).getTime();
            endDate = datetime.parseISO8601Date(item.EndDate).getTime();
        } catch (err) {
            console.error(err);
        }

        const now = new Date().getTime();
        const total = endDate - startDate;
        pct = 100 * ((now - startDate) / total);

        if (pct > 0 && pct < 100) {
            const isRecording = item.Type === 'Timer' || item.Type === 'Recording' || item.TimerId;
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
        const userData = item.UserData || {};
        if (userData.UnplayedItemCount) {
            return (
                '<div class="countIndicator indicator">' + formatCountIndicator(userData.UnplayedItemCount) + '</div>'
            );
        }

        if ((userData.PlayedPercentage && userData.PlayedPercentage >= 100) || userData.Played) {
            return '<div class="playedIndicator indicator"><span class="material-icons indicatorIcon check" aria-hidden="true"></span></div>';
        }
    }

    return '';
}

export function getChildCountIndicatorHtml(item, options) {
    const minCount = options?.minCount ? options.minCount : 0;

    if (item.ChildCount && item.ChildCount > minCount) {
        return '<div class="countIndicator indicator">' + formatCountIndicator(item.ChildCount) + '</div>';
    }

    return '';
}

function formatCountIndicator(count) {
    return count >= 100 ? '99+' : count.toString();
}

export function getTimerIndicator(item) {
    let status;

    if (item.Type === 'SeriesTimer') {
        return '<span class="material-icons timerIndicator indicatorIcon fiber_smart_record" aria-hidden="true"></span>';
    } else if (item.TimerId || item.SeriesTimerId) {
        status = item.Status || 'Cancelled';
    } else if (item.Type === 'Timer') {
        status = item.Status;
    } else {
        return '';
    }

    if (item.SeriesTimerId) {
        if (status !== 'Cancelled') {
            return '<span class="material-icons timerIndicator indicatorIcon fiber_smart_record" aria-hidden="true"></span>';
        }

        return '<span class="material-icons timerIndicator timerIndicator-inactive indicatorIcon fiber_smart_record" aria-hidden="true"></span>';
    }

    return '<span class="material-icons timerIndicator indicatorIcon fiber_manual_record" aria-hidden="true"></span>';
}

export function getSyncIndicator(item) {
    if (item.SyncPercent === 100) {
        return '<div class="syncIndicator indicator fullSyncIndicator"><span class="material-icons indicatorIcon file_download" aria-hidden="true"></span></div>';
    } else if (item.SyncPercent != null) {
        return '<div class="syncIndicator indicator emptySyncIndicator"><span class="material-icons indicatorIcon file_download" aria-hidden="true"></span></div>';
    }

    return '';
}

export function getTypeIndicator(item) {
    const iconT = {
        Video: 'videocam',
        Folder: 'folder',
        PhotoAlbum: 'photo_album',
        Photo: 'photo'
    };

    const icon = iconT[item.Type];
    return icon
        ? '<div class="indicator videoIndicator"><span class="material-icons indicatorIcon ' +
              icon +
              '" aria-hidden="true"></span></div>'
        : '';
}

export function getMissingIndicator(item) {
    if (item.Type === 'Episode' && item.LocationType === 'Virtual') {
        if (item.PremiereDate) {
            try {
                const premiereDate = datetime.parseISO8601Date(item.PremiereDate).getTime();
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
