import escapeHtml from 'escape-html';
import datetime from '../../scripts/datetime';
import globalize from '../../lib/globalize';
import { appRouter } from '../router/appRouter';
import itemHelper from '../itemHelper';
import indicators from '../indicators/indicators';
import 'material-design-icons-iconfont';
import './mediainfo.scss';
import '../guide/programs.scss';
import '../../elements/emby-button/emby-button';
import * as userSettings from '../../scripts/settings/userSettings';

function getTimerIndicator(item) {
    let status;

    if (item.Type === 'SeriesTimer') {
        return '<span class="material-icons mediaInfoItem mediaInfoIconItem mediaInfoTimerIcon fiber_smart_record" aria-hidden="true"></span>';
    } else if (item.TimerId || item.SeriesTimerId) {
        status = item.Status || 'Cancelled';
    } else if (item.Type === 'Timer') {
        status = item.Status;
    } else {
        return '';
    }

    if (item.SeriesTimerId) {
        if (status !== 'Cancelled') {
            return '<span class="material-icons mediaInfoItem mediaInfoIconItem mediaInfoTimerIcon fiber_smart_record" aria-hidden="true"></span>';
        }

        return '<span class="material-icons mediaInfoItem mediaInfoIconItem fiber_smart_record" aria-hidden="true"></span>';
    }

    return '<span class="material-icons mediaInfoItem mediaInfoIconItem mediaInfoTimerIcon fiber_manual_record" aria-hidden="true"></span>';
}

function getProgramInfoHtml(item, options) {
    let html = '';

    const miscInfo = [];
    let text;
    let date;

    if (item.StartDate && options.programTime !== false) {
        try {
            text = '';

            date = datetime.parseISO8601Date(item.StartDate);

            if (options.startDate !== false) {
                text += datetime.toLocaleDateString(date, { weekday: 'short', month: 'short', day: 'numeric' });
            }

            text += ` ${datetime.getDisplayTime(date)}`;

            if (item.EndDate) {
                date = datetime.parseISO8601Date(item.EndDate);
                text += ` - ${datetime.getDisplayTime(date)}`;
            }

            miscInfo.push(text);
        } catch (e) {
            console.error('error parsing date:', item.StartDate, e);
        }
    }

    if (item.ChannelNumber) {
        miscInfo.push(`CH ${item.ChannelNumber}`);
    }

    if (item.ChannelName) {
        if (options.interactive && item.ChannelId) {
            miscInfo.push({
                html: `<a is="emby-linkbutton" class="button-flat mediaInfoItem" href="${appRouter.getRouteUrl({

                    ServerId: item.ServerId,
                    Type: 'TvChannel',
                    Name: item.ChannelName,
                    Id: item.ChannelId

                })}">${escapeHtml(item.ChannelName)}</a>`
            });
        } else {
            miscInfo.push(escapeHtml(item.ChannelName));
        }
    }

    if (options.timerIndicator !== false) {
        const timerHtml = getTimerIndicator(item);
        if (timerHtml) {
            miscInfo.push({
                html: timerHtml
            });
        }
    }

    html += miscInfo.map(m => {
        return getMediaInfoItem(m);
    }).join('');

    return html;
}

export function getMediaInfoHtml(item, options = {}) {
    let html = '';

    const miscInfo = [];
    let text;
    let date;
    let count;

    const showFolderRuntime = item.Type === 'MusicAlbum' || item.MediaType === 'MusicArtist' || item.Type === 'Playlist' || item.MediaType === 'Playlist' || item.MediaType === 'MusicGenre';

    if (showFolderRuntime) {
        count = item.SongCount || item.ChildCount;

        if (count) {
            miscInfo.push(globalize.translate('TrackCount', count));
        }

        if (item.RunTimeTicks) {
            miscInfo.push(datetime.getDisplayDuration(item.RunTimeTicks));
        }
    } else if (item.Type === 'PhotoAlbum' || item.Type === 'BoxSet') {
        count = item.ChildCount;

        if (count) {
            miscInfo.push(globalize.translate('ItemCount', count));
        }
    }

    if ((item.Type === 'Episode' || item.MediaType === 'Photo')
            && options.originalAirDate !== false
            && item.PremiereDate
    ) {
        try {
            //don't modify date to locale if episode. Only Dates (not times) are stored, or editable in the edit metadata dialog
            date = datetime.parseISO8601Date(item.PremiereDate, item.Type !== 'Episode');

            text = datetime.toLocaleDateString(date);
            miscInfo.push(text);
        } catch (e) {
            console.error('error parsing date:', item.PremiereDate, e);
        }
    }

    if (item.Type === 'SeriesTimer') {
        if (item.RecordAnyTime) {
            miscInfo.push(globalize.translate('Anytime'));
        } else {
            miscInfo.push(datetime.getDisplayTime(item.StartDate));
        }

        if (item.RecordAnyChannel) {
            miscInfo.push(globalize.translate('AllChannels'));
        } else {
            miscInfo.push(item.ChannelName || globalize.translate('OneChannel'));
        }
    }

    if (item.StartDate && item.Type !== 'Program' && item.Type !== 'SeriesTimer' && item.Type !== 'Timer') {
        try {
            date = datetime.parseISO8601Date(item.StartDate);

            text = datetime.toLocaleDateString(date);
            miscInfo.push(text);

            if (item.Type !== 'Recording') {
                text = datetime.getDisplayTime(date);
                miscInfo.push(text);
            }
        } catch (e) {
            console.error('error parsing date:', item.StartDate, e);
        }
    }

    if (options.year !== false && item.ProductionYear && item.Type === 'Series') {
        if (item.Status === 'Continuing') {
            miscInfo.push(globalize.translate('SeriesYearToPresent', datetime.toLocaleString(item.ProductionYear, { useGrouping: false })));
        } else if (item.ProductionYear) {
            text = datetime.toLocaleString(item.ProductionYear, { useGrouping: false });

            if (item.EndDate) {
                try {
                    const endYear = datetime.toLocaleString(datetime.parseISO8601Date(item.EndDate).getFullYear(), { useGrouping: false });
                    /* At this point, text will contain only the start year */
                    if (endYear !== text) {
                        text += ` - ${endYear}`;
                    }
                } catch (e) {
                    console.error('error parsing date:', item.EndDate, e);
                }
            }

            miscInfo.push(text);
        }
    }

    if (item.Type === 'Program' || item.Type === 'Timer') {
        let program = item;
        if (item.Type === 'Timer') {
            program = item.ProgramInfo;
        }

        if (options.programIndicator !== false) {
            if (program.IsLive && userSettings.get('guide-indicator-live') === 'true') {
                miscInfo.push({
                    html: `<div class="mediaInfoProgramAttribute mediaInfoItem liveTvProgram">${globalize.translate('Live')}</div>`
                });
            } else if (program.IsPremiere && userSettings.get('guide-indicator-premiere') === 'true') {
                miscInfo.push({
                    html: `<div class="mediaInfoProgramAttribute mediaInfoItem premiereTvProgram">${globalize.translate('Premiere')}</div>`
                });
            } else if (program.IsSeries && !program.IsRepeat && userSettings.get('guide-indicator-new') === 'true') {
                miscInfo.push({
                    html: `<div class="mediaInfoProgramAttribute mediaInfoItem newTvProgram">${globalize.translate('New')}</div>`
                });
            } else if (program.IsSeries && program.IsRepeat && userSettings.get('guide-indicator-repeat') === 'true') {
                miscInfo.push({
                    html: `<div class="mediaInfoProgramAttribute mediaInfoItem repeatTvProgram">${globalize.translate('Repeat')}</div>`
                });
            }
        }

        if ((program.IsSeries || program.EpisodeTitle) && options.episodeTitle !== false) {
            text = itemHelper.getDisplayName(program, {
                includeIndexNumber: options.episodeTitleIndexNumber
            });

            if (text) {
                miscInfo.push(escapeHtml(text));
            }
        } else if (program.IsMovie && program.ProductionYear && options.originalAirDate !== false) {
            miscInfo.push(program.ProductionYear);
        } else if (program.PremiereDate && options.originalAirDate !== false) {
            try {
                date = datetime.parseISO8601Date(program.PremiereDate);
                text = globalize.translate('OriginalAirDateValue', datetime.toLocaleDateString(date));
                miscInfo.push(text);
            } catch (e) {
                console.error('error parsing date:', program.PremiereDate, e);
            }
        } else if (program.ProductionYear && options.year !== false ) {
            miscInfo.push(program.ProductionYear);
        }
    }

    if (options.year !== false && item.Type !== 'Series' && item.Type !== 'Episode' && item.Type !== 'Person'
            && item.MediaType !== 'Photo' && item.Type !== 'Program' && item.Type !== 'Season'
    ) {
        if (item.ProductionYear) {
            miscInfo.push(item.ProductionYear);
        } else if (item.PremiereDate) {
            try {
                text = datetime.toLocaleString(datetime.parseISO8601Date(item.PremiereDate).getFullYear(), { useGrouping: false });
                miscInfo.push(text);
            } catch (e) {
                console.error('error parsing date:', item.PremiereDate, e);
            }
        }
    }

    if (item.RunTimeTicks && item.Type !== 'Series' && item.Type !== 'Program' && item.Type !== 'Timer' && item.Type !== 'Book' && !showFolderRuntime && options.runtime !== false) {
        if (item.Type === 'Audio') {
            miscInfo.push(datetime.getDisplayRunningTime(item.RunTimeTicks));
        } else {
            miscInfo.push(datetime.getDisplayDuration(item.RunTimeTicks));
        }
    }

    if (options.officialRating !== false && item.OfficialRating && item.Type !== 'Season' && item.Type !== 'Episode') {
        miscInfo.push({
            text: item.OfficialRating,
            cssClass: 'mediaInfoText mediaInfoOfficialRating'
        });
    }

    if (item.Video3DFormat) {
        miscInfo.push('3D');
    }

    if (item.MediaType === 'Photo' && item.Width && item.Height) {
        miscInfo.push(`${item.Width}x${item.Height}`);
    }

    if (options.container !== false && item.Type === 'Audio' && item.Container) {
        miscInfo.push(item.Container);
    }

    html += miscInfo.map(m => {
        return getMediaInfoItem(m);
    }).join('');

    if (options.starRating !== false) {
        html += getStarIconsHtml(item);
    }

    if (item.HasSubtitles && options.subtitles !== false) {
        html += '<div class="mediaInfoItem mediaInfoText closedCaptionMediaInfoText">CC</div>';
    }

    if (item.CriticRating && options.criticRating !== false) {
        if (item.CriticRating >= 60) {
            html += `<div class="mediaInfoItem mediaInfoCriticRating mediaInfoCriticRatingFresh">${item.CriticRating}</div>`;
        } else {
            html += `<div class="mediaInfoItem mediaInfoCriticRating mediaInfoCriticRatingRotten">${item.CriticRating}</div>`;
        }
    }

    if (options.endsAt !== false) {
        const endsAt = getEndsAt(item);
        if (endsAt) {
            html += getMediaInfoItem(endsAt, 'endsAt');
        }
    }

    html += indicators.getMissingIndicator(item);

    return html;
}

export function getEndsAt(item) {
    if (item.MediaType === 'Video' && item.RunTimeTicks && !item.StartDate) {
        const positionTicks = item.UserData?.PlaybackPositionTicks;
        const playbackRate = 1;
        const includeText = true;
        return getEndsAtFromPosition(item.RunTimeTicks, positionTicks, playbackRate, includeText);
    }

    return null;
}

export function getEndsAtFromPosition(runtimeTicks, positionTicks, playbackRate, includeText) {
    let endDate = new Date().getTime() + (1 / playbackRate) * ((runtimeTicks - (positionTicks || 0)) / 10000);
    endDate = new Date(endDate);

    const displayTime = datetime.getDisplayTime(endDate);

    if (includeText === false) {
        return displayTime;
    }
    return globalize.translate('EndsAtValue', displayTime);
}

function getMediaInfoItem(m, cssClass) {
    cssClass = cssClass ? (`${cssClass} mediaInfoItem`) : 'mediaInfoItem';
    let mediaInfoText = m;

    if (typeof (m) !== 'string' && typeof (m) !== 'number') {
        if (m.html) {
            return m.html;
        }
        mediaInfoText = m.text;
        cssClass += ` ${m.cssClass}`;
    }
    return `<div class="${cssClass}">${mediaInfoText}</div>`;
}

function getStarIconsHtml(item) {
    let html = '';

    if (item.CommunityRating) {
        html += '<div class="starRatingContainer mediaInfoItem">';

        html += '<span class="material-icons starIcon star" aria-hidden="true"></span>';
        html += item.CommunityRating.toFixed(1);
        html += '</div>';
    }

    return html;
}

function dynamicEndTime(elem, item) {
    const interval = setInterval(() => {
        if (!document.body.contains(elem)) {
            clearInterval(interval);
            return;
        }

        elem.innerHTML = getEndsAt(item);
    }, 60000);
}

export function fillPrimaryMediaInfo(elem, item, options) {
    const html = getPrimaryMediaInfoHtml(item, options);

    elem.innerHTML = html;
    afterFill(elem, item, options);
}

export function fillSecondaryMediaInfo(elem, item, options) {
    const html = getSecondaryMediaInfoHtml(item, options);

    elem.innerHTML = html;
    afterFill(elem, item, options);
}

function afterFill(elem, item, options) {
    if (options.endsAt !== false) {
        const endsAtElem = elem.querySelector('.endsAt');
        if (endsAtElem) {
            dynamicEndTime(endsAtElem, item);
        }
    }

    const lnkChannel = elem.querySelector('.lnkChannel');
    if (lnkChannel) {
        lnkChannel.addEventListener('click', onChannelLinkClick);
    }
}

function onChannelLinkClick(e) {
    const channelId = this.getAttribute('data-id');
    const serverId = this.getAttribute('data-serverid');

    appRouter.showItem(channelId, serverId);

    e.preventDefault();
    return false;
}

export function getPrimaryMediaInfoHtml(item, options = {}) {
    if (options.interactive === undefined) {
        options.interactive = false;
    }

    return getMediaInfoHtml(item, options);
}

export function getSecondaryMediaInfoHtml(item, options) {
    options = options || {};
    if (options.interactive == null) {
        options.interactive = false;
    }
    if (item.Type === 'Program') {
        return getProgramInfoHtml(item, options);
    }

    return '';
}

export function getResolutionText(i) {
    const width = i.Width;
    const height = i.Height;

    if (width && height) {
        if (width >= 3800 || height >= 2000) {
            return '4K';
        }
        if (width >= 2500 || height >= 1400) {
            if (i.IsInterlaced) {
                return '1440i';
            }
            return '1440p';
        }
        if (width >= 1800 || height >= 1000) {
            if (i.IsInterlaced) {
                return '1080i';
            }
            return '1080p';
        }
        if (width >= 1200 || height >= 700) {
            if (i.IsInterlaced) {
                return '720i';
            }
            return '720p';
        }
        if (width >= 700 || height >= 400) {
            if (i.IsInterlaced) {
                return '480i';
            }
            return '480p';
        }
    }
    return null;
}

function getAudioStreamForDisplay(item) {
    if (!item.MediaSources) {
        return null;
    }

    const mediaSource = item.MediaSources[0];
    if (!mediaSource) {
        return null;
    }

    return (mediaSource.MediaStreams || []).filter(i => {
        return i.Type === 'Audio' && (i.Index === mediaSource.DefaultAudioStreamIndex || mediaSource.DefaultAudioStreamIndex == null);
    })[0];
}

export function getMediaInfoStats(item) {
    const list = [];

    const mediaSource = (item.MediaSources || [])[0] || {};

    const videoStream = (mediaSource.MediaStreams || []).filter(i => {
        return i.Type === 'Video';
    })[0] || {};
    const audioStream = getAudioStreamForDisplay(item) || {};

    if (item.VideoType === 'Dvd') {
        list.push({
            type: 'mediainfo',
            text: 'Dvd'
        });
    }

    if (item.VideoType === 'BluRay') {
        list.push({
            type: 'mediainfo',
            text: 'BluRay'
        });
    }

    const resolutionText = getResolutionText(videoStream);
    if (resolutionText) {
        list.push({
            type: 'mediainfo',
            text: resolutionText
        });
    }

    if (videoStream.Codec) {
        list.push({
            type: 'mediainfo',
            text: videoStream.Codec
        });
    }

    const channels = audioStream.Channels;
    let channelText;

    if (channels === 8) {
        channelText = '7.1';
    } else if (channels === 7) {
        channelText = '6.1';
    } else if (channels === 6) {
        channelText = '5.1';
    } else if (channels === 2) {
        channelText = '2.0';
    }

    if (channelText) {
        list.push({
            type: 'mediainfo',
            text: channelText
        });
    }

    const audioCodec = (audioStream.Codec || '').toLowerCase();

    if ((audioCodec === 'dca' || audioCodec === 'dts') && audioStream.Profile) {
        list.push({
            type: 'mediainfo',
            text: audioStream.Profile
        });
    } else if (audioStream.Codec) {
        list.push({
            type: 'mediainfo',
            text: audioStream.Codec
        });
    }

    if (item.DateCreated && itemHelper.enableDateAddedDisplay(item)) {
        const dateCreated = datetime.parseISO8601Date(item.DateCreated);

        list.push({
            type: 'added',
            text: globalize.translate('AddedOnValue', `${datetime.toLocaleDateString(dateCreated)} ${datetime.getDisplayTime(dateCreated)}`)
        });
    }

    return list;
}

export default {
    getMediaInfoHtml: getPrimaryMediaInfoHtml,
    getEndsAt: getEndsAt,
    getEndsAtFromPosition: getEndsAtFromPosition,
    getPrimaryMediaInfoHtml: getPrimaryMediaInfoHtml,
    getSecondaryMediaInfoHtml: getSecondaryMediaInfoHtml,
    fillPrimaryMediaInfo: fillPrimaryMediaInfo,
    fillSecondaryMediaInfo: fillSecondaryMediaInfo,
    getMediaInfoStats: getMediaInfoStats,
    getResolutionText: getResolutionText
};
