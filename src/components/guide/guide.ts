import escapeHtml from 'escape-html';
import inputManager from 'scripts/inputManager';
import browser from 'scripts/browser';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import Events from 'utils/events.ts';
import scrollHelper from 'scripts/scrollHelper';
import serverNotifications from 'scripts/serverNotifications';
import loading from '../loading/loading';
import datetime from 'scripts/datetime';
import focusManager from '../focusManager';
import { playbackManager } from '../playback/playbackmanager';
import * as userSettings from 'scripts/settings/userSettings';
import imageLoader from '../images/imageLoader';
import layoutManager from '../layoutManager';
import itemShortcuts from '../shortcuts';
import dom from 'scripts/dom';
import './guide.scss';
import './programs.scss';
import 'material-design-icons-iconfont';
import 'styles/scrollstyles.scss';
import 'elements/emby-programcell/emby-programcell';
import 'elements/emby-button/emby-button';
import 'elements/emby-button/paper-icon-button-light';
import 'elements/emby-tabs/emby-tabs';
import 'elements/emby-scroller/emby-scroller';
import 'styles/flexstyles.scss';
import 'webcomponents.js/webcomponents-lite';
import template from './tvguide.template.html';

function showViewSettings(instance) {
    import('./guide-settings').then(({ default: guideSettingsDialog }) => {
        guideSettingsDialog.show(instance.categoryOptions).then(function () {
            instance.refresh();
        });
    });
}

function updateProgramCellOnScroll(cell, scrollPct) {
    let left = cell.posLeft;
    if (!left) {
        left = parseFloat(cell.style.left.replace('%', ''));
        cell.posLeft = left;
    }
    let width = cell.posWidth;
    if (!width) {
        width = parseFloat(cell.style.width.replace('%', ''));
        cell.posWidth = width;
    }

    const right = left + width;
    const newPct = Math.max(Math.min(scrollPct, right), left);

    const offset = newPct - left;
    const pctOfWidth = (offset / width) * 100;

    let guideProgramName = cell.guideProgramName;
    if (!guideProgramName) {
        guideProgramName = cell.querySelector('.guideProgramName');
        cell.guideProgramName = guideProgramName;
    }

    let caret = cell.caret;
    if (!caret) {
        caret = cell.querySelector('.guide-programNameCaret');
        cell.caret = caret;
    }

    if (guideProgramName) {
        if (pctOfWidth > 0 && pctOfWidth <= 100) {
            guideProgramName.style.transform = 'translateX(' + pctOfWidth + '%)';
            caret.classList.remove('hide');
        } else {
            guideProgramName.style.transform = 'none';
            caret.classList.add('hide');
        }
    }
}

let isUpdatingProgramCellScroll = false;
function updateProgramCellsOnScroll(programGrid, programCells) {
    if (isUpdatingProgramCellScroll) {
        return;
    }

    isUpdatingProgramCellScroll = true;

    requestAnimationFrame(function () {
        const scrollLeft = programGrid.scrollLeft;

        const scrollPct = scrollLeft ? (scrollLeft / programGrid.scrollWidth) * 100 : 0;

        for (const programCell of programCells) {
            updateProgramCellOnScroll(programCell, scrollPct);
        }

        isUpdatingProgramCellScroll = false;
    });
}

function onProgramGridClick(e: Event) {
    if (!layoutManager.tv) {
        return;
    }

    const programCell = dom.parentWithClass(e.target, 'programCell');
    if (programCell) {
        let startDate = programCell.getAttribute('data-startdate');
        let endDate = programCell.getAttribute('data-enddate');
        startDate = datetime.parseISO8601Date(startDate, { toLocal: true }).getTime();
        endDate = datetime.parseISO8601Date(endDate, { toLocal: true }).getTime();

        const now = new Date().getTime();
        if (now >= startDate && now < endDate) {
            const channelId = programCell.getAttribute('data-channelid');
            const serverId = programCell.getAttribute('data-serverid');

            e.preventDefault();
            e.stopPropagation();

            playbackManager.play({
                ids: [channelId],
                serverId: serverId
            });
        }
    }
}

function Guide(options) {
    const self = this;
    let items = {};

    self.options = options;
    self.categoryOptions = { categories: [] };

    // 30 mins
    const cellCurationMinutes = 30;
    const cellDurationMs = cellCurationMinutes * 60 * 1000;
    const msPerDay = 86400000;

    let currentDate;
    let currentStartIndex = 0;
    let currentChannelLimit = 0;
    let autoRefreshInterval;
    let programCells;
    let lastFocusDirection;

    self.refresh = function () {
        currentDate = null;
        reloadPage(options.element);
        restartAutoRefresh();
    };

    self.pause = function () {
        stopAutoRefresh();
    };

    self.resume = function (refreshData) {
        if (refreshData) {
            self.refresh();
        } else {
            restartAutoRefresh();
        }
    };

    self.destroy = function () {
        stopAutoRefresh();

        Events.off(serverNotifications, 'TimerCreated', onTimerCreated);
        Events.off(serverNotifications, 'TimerCancelled', onTimerCancelled);
        Events.off(serverNotifications, 'SeriesTimerCancelled', onSeriesTimerCancelled);

        setScrollEvents(options.element, false);
        itemShortcuts.off(options.element);
        items = {};
    };

    function restartAutoRefresh() {
        stopAutoRefresh();

        const intervalMs = 60000 * 15; // (minutes)

        autoRefreshInterval = setInterval(function () {
            self.refresh();
        }, intervalMs);
    }

    function stopAutoRefresh() {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
            autoRefreshInterval = null;
        }
    }

    function normalizeDateToTimeslot(date) {
        const minutesOffset = date.getMinutes() - cellCurationMinutes;

        if (minutesOffset >= 0) {
            date.setHours(date.getHours(), cellCurationMinutes, 0, 0);
        } else {
            date.setHours(date.getHours(), 0, 0, 0);
        }

        return date;
    }

    function showLoading() {
        loading.show();
    }

    function hideLoading() {
        loading.hide();
    }

    function reloadGuide(context, newStartDate, scrollToTimeMs, focusToTimeMs, startTimeOfDayMs, focusProgramOnRender) {
        const apiClient = ServerConnections.getApiClient(options.serverId);

        const channelQuery = {

            StartIndex: 0,
            EnableFavoriteSorting: userSettings.get('livetv-favoritechannelsattop') !== 'false'
        };

        channelQuery.UserId = apiClient.getCurrentUserId();

        const channelLimit = 500;
        currentChannelLimit = channelLimit;

        showLoading();

        channelQuery.StartIndex = currentStartIndex;
        channelQuery.Limit = channelLimit;
        channelQuery.AddCurrentProgram = false;
        channelQuery.EnableUserData = false;
        channelQuery.EnableImageTypes = 'Primary';

        const categories = self.categoryOptions.categories || [];
        const displayMovieContent = !categories.length || categories.indexOf('movies') !== -1;
        const displaySportsContent = !categories.length || categories.indexOf('sports') !== -1;
        const displayNewsContent = !categories.length || categories.indexOf('news') !== -1;
        const displayKidsContent = !categories.length || categories.indexOf('kids') !== -1;
        const displaySeriesContent = !categories.length || categories.indexOf('series') !== -1;

        if (displayMovieContent && displaySportsContent && displayNewsContent && displayKidsContent) {
            channelQuery.IsMovie = null;
            channelQuery.IsSports = null;
            channelQuery.IsKids = null;
            channelQuery.IsNews = null;
            channelQuery.IsSeries = null;
        } else {
            if (displayNewsContent) {
                channelQuery.IsNews = true;
            }
            if (displaySportsContent) {
                channelQuery.IsSports = true;
            }
            if (displayKidsContent) {
                channelQuery.IsKids = true;
            }
            if (displayMovieContent) {
                channelQuery.IsMovie = true;
            }
            if (displaySeriesContent) {
                channelQuery.IsSeries = true;
            }
        }

        if (userSettings.get('livetv-channelorder') === 'DatePlayed') {
            channelQuery.SortBy = 'DatePlayed';
            channelQuery.SortOrder = 'Descending';
        } else {
            channelQuery.SortBy = null;
            channelQuery.SortOrder = null;
        }

        let date = newStartDate;
        // Add one second to avoid getting programs that are just ending
        date = new Date(date.getTime() + 1000);

        // Subtract to avoid getting programs that are starting when the grid ends
        const nextDay = new Date(date.getTime() + msPerDay - 2000);

        // Normally we'd want to just let responsive css handle this,
        // but since mobile browsers are often underpowered,
        // it can help performance to get them out of the markup
        const allowIndicators = dom.getWindowSize().innerWidth >= 600;

        const renderOptions = {
            showHdIcon: allowIndicators && userSettings.get('guide-indicator-hd') === 'true',
            showLiveIndicator: allowIndicators && userSettings.get('guide-indicator-live') !== 'false',
            showPremiereIndicator: allowIndicators && userSettings.get('guide-indicator-premiere') !== 'false',
            showNewIndicator: allowIndicators && userSettings.get('guide-indicator-new') !== 'false',
            showRepeatIndicator: allowIndicators && userSettings.get('guide-indicator-repeat') === 'true',
            showEpisodeTitle: !layoutManager.tv
        };

        apiClient.getLiveTvChannels(channelQuery).then(function (channelsResult) {
            const btnPreviousPage = context.querySelector('.btnPreviousPage');
            const btnNextPage = context.querySelector('.btnNextPage');

            if (channelsResult.TotalRecordCount > channelLimit) {
                context.querySelector('.guideOptions').classList.remove('hide');

                btnPreviousPage.classList.remove('hide');
                btnNextPage.classList.remove('hide');

                if (channelQuery.StartIndex) {
                    context.querySelector('.btnPreviousPage').disabled = false;
                } else {
                    context.querySelector('.btnPreviousPage').disabled = true;
                }

                if ((channelQuery.StartIndex + channelLimit) < channelsResult.TotalRecordCount) {
                    btnNextPage.disabled = false;
                } else {
                    btnNextPage.disabled = true;
                }
            } else {
                context.querySelector('.guideOptions').classList.add('hide');
            }

            const programFields = [];

            const programQuery = {
                UserId: apiClient.getCurrentUserId(),
                MaxStartDate: nextDay.toISOString(),
                MinEndDate: date.toISOString(),
                channelIds: channelsResult.Items.map(function (c) {
                    return c.Id;
                }).join(','),
                ImageTypeLimit: 1,
                EnableImages: false,
                //EnableImageTypes: layoutManager.tv ? "Primary,Backdrop" : "Primary",
                SortBy: 'StartDate',
                EnableTotalRecordCount: false,
                EnableUserData: false
            };

            if (renderOptions.showHdIcon) {
                programFields.push('IsHD');
            }

            if (programFields.length) {
                programQuery.Fields = programFields.join('');
            }

            apiClient.getLiveTvPrograms(programQuery).then(function (programsResult) {
                const guideOptions = { focusProgramOnRender, scrollToTimeMs, focusToTimeMs, startTimeOfDayMs };

                renderGuide(context, date, channelsResult.Items, programsResult.Items, renderOptions, guideOptions, apiClient);

                hideLoading();
            });
        });
    }

    function getDisplayTime(date) {
        if ((typeof date).toString().toLowerCase() === 'string') {
            try {
                date = datetime.parseISO8601Date(date, { toLocal: true });
            } catch {
                return date;
            }
        }

        return datetime.getDisplayTime(date).toLowerCase();
    }

    function getTimeslotHeadersHtml(startDate, endDateTime) {
        let html = '';

        // clone
        startDate = new Date(startDate.getTime());

        html += '<div class="timeslotHeadersInner">';

        while (startDate.getTime() < endDateTime) {
            html += '<div class="timeslotHeader">';

            html += getDisplayTime(startDate);
            html += '</div>';

            // Add 30 mins
            startDate.setTime(startDate.getTime() + cellDurationMs);
        }

        return html;
    }

    function parseDates(program) {
        if (!program.StartDateLocal) {
            try {
                program.StartDateLocal = datetime.parseISO8601Date(program.StartDate, { toLocal: true });
            } catch (err) {
                console.error('error parsing timestamp for start date', err);
            }
        }

        if (!program.EndDateLocal) {
            try {
                program.EndDateLocal = datetime.parseISO8601Date(program.EndDate, { toLocal: true });
            } catch (err) {
                console.error('error parsing timestamp for end date', err);
            }
        }

        return null;
    }

    function getTimerIndicator(item) {
        let status;

        if (item.Type === 'SeriesTimer') {
            return '<span class="material-icons programIcon seriesTimerIcon fiber_smart_record" aria-hidden="true"></span>';
        } else if (item.TimerId || item.SeriesTimerId) {
            status = item.Status || 'Cancelled';
        } else if (item.Type === 'Timer') {
            status = item.Status;
        } else {
            return '';
        }

        if (item.SeriesTimerId) {
            if (status !== 'Cancelled') {
                return '<span class="material-icons programIcon seriesTimerIcon fiber_smart_record" aria-hidden="true"></span>';
            }

            return '<span class="material-icons programIcon seriesTimerIcon seriesTimerIcon-inactive fiber_smart_record" aria-hidden="true"></span>';
        }

        return '<span class="material-icons programIcon timerIcon fiber_manual_record" aria-hidden="true"></span>';
    }

    function getChannelProgramsHtml(context, date, channel, programs, programOptions, listInfo) {
        let html = '';

        const startMs = date.getTime();
        const endMs = startMs + msPerDay - 1;

        const outerCssClass = layoutManager.tv ? 'channelPrograms channelPrograms-tv' : 'channelPrograms';

        html += '<div class="' + outerCssClass + '" data-channelid="' + channel.Id + '">';

        const clickAction = layoutManager.tv ? 'link' : 'programdialog';

        const categories = self.categoryOptions.categories || [];
        const displayMovieContent = !categories.length || categories.indexOf('movies') !== -1;
        const displaySportsContent = !categories.length || categories.indexOf('sports') !== -1;
        const displayNewsContent = !categories.length || categories.indexOf('news') !== -1;
        const displayKidsContent = !categories.length || categories.indexOf('kids') !== -1;
        const displaySeriesContent = !categories.length || categories.indexOf('series') !== -1;
        const enableColorCodedBackgrounds = userSettings.get('guide-colorcodedbackgrounds') === 'true';

        let programsFound;
        const now = new Date().getTime();

        for (let i = listInfo.startIndex, length = programs.length; i < length; i++) {
            const program = programs[i];

            if (program.ChannelId !== channel.Id) {
                if (programsFound) {
                    break;
                }

                continue;
            }

            programsFound = true;
            listInfo.startIndex++;

            parseDates(program);

            const startDateLocalMs = program.StartDateLocal.getTime();
            const endDateLocalMs = program.EndDateLocal.getTime();

            if (endDateLocalMs < startMs) {
                continue;
            }

            if (startDateLocalMs > endMs) {
                break;
            }

            items[program.Id] = program;

            const renderStartMs = Math.max(startDateLocalMs, startMs);
            let startPercent = (startDateLocalMs - startMs) / msPerDay;
            startPercent *= 100;
            startPercent = Math.max(startPercent, 0);

            const renderEndMs = Math.min(endDateLocalMs, endMs);
            let endPercent = (renderEndMs - renderStartMs) / msPerDay;
            endPercent *= 100;

            let cssClass = 'programCell itemAction';
            let accentCssClass = null;
            let displayInnerContent = true;

            if (program.IsKids) {
                displayInnerContent = displayKidsContent;
                accentCssClass = 'kids';
            } else if (program.IsSports) {
                displayInnerContent = displaySportsContent;
                accentCssClass = 'sports';
            } else if (program.IsNews) {
                displayInnerContent = displayNewsContent;
                accentCssClass = 'news';
            } else if (program.IsMovie) {
                displayInnerContent = displayMovieContent;
                accentCssClass = 'movie';
            } else if (program.IsSeries) {
                displayInnerContent = displaySeriesContent;
            } else {
                displayInnerContent = displayMovieContent && displayNewsContent && displaySportsContent && displayKidsContent && displaySeriesContent;
            }

            if (displayInnerContent && enableColorCodedBackgrounds && accentCssClass) {
                cssClass += ' programCell-' + accentCssClass;
            }

            if (now >= startDateLocalMs && now < endDateLocalMs) {
                cssClass += ' programCell-active';
            }

            let timerAttributes = '';
            if (program.TimerId) {
                timerAttributes += ' data-timerid="' + program.TimerId + '"';
            }
            if (program.SeriesTimerId) {
                timerAttributes += ' data-seriestimerid="' + program.SeriesTimerId + '"';
            }

            const isAttribute = endPercent >= 2 ? ' is="emby-programcell"' : '';

            html += '<button' + isAttribute + ' data-action="' + clickAction + '"' + timerAttributes + ' data-channelid="' + program.ChannelId + '" data-id="' + program.Id + '" data-serverid="' + program.ServerId + '" data-startdate="' + program.StartDate + '" data-enddate="' + program.EndDate + '" data-type="' + program.Type + '" class="' + cssClass + '" style="left:' + startPercent + '%;width:' + endPercent + '%;">';

            if (displayInnerContent) {
                const guideProgramNameClass = 'guideProgramName';

                html += '<div class="' + guideProgramNameClass + '">';

                html += '<div class="guide-programNameCaret hide"><span class="guideProgramNameCaretIcon material-icons keyboard_arrow_left" aria-hidden="true"></span></div>';

                html += '<div class="guideProgramNameText">' + escapeHtml(program.Name);

                let indicatorHtml = null;
                if (program.IsLive && programOptions.showLiveIndicator) {
                    indicatorHtml = '<span class="liveTvProgram guideProgramIndicator">' + globalize.translate('Live') + '</span>';
                } else if (program.IsPremiere && programOptions.showPremiereIndicator) {
                    indicatorHtml = '<span class="premiereTvProgram guideProgramIndicator">' + globalize.translate('Premiere') + '</span>';
                } else if (program.IsSeries && !program.IsRepeat && programOptions.showNewIndicator) {
                    indicatorHtml = '<span class="newTvProgram guideProgramIndicator">' + globalize.translate('New') + '</span>';
                } else if (program.IsSeries && program.IsRepeat && programOptions.showRepeatIndicator) {
                    indicatorHtml = '<span class="repeatTvProgram guideProgramIndicator">' + globalize.translate('Repeat') + '</span>';
                }
                html += indicatorHtml || '';

                if ((program.EpisodeTitle && programOptions.showEpisodeTitle)) {
                    html += '<div class="guideProgramSecondaryInfo">';

                    if (program.EpisodeTitle && programOptions.showEpisodeTitle) {
                        html += '<span class="programSecondaryTitle">' + escapeHtml(program.EpisodeTitle) + '</span>';
                    }
                    html += '</div>';
                }

                html += '</div>';

                if (program.IsHD && programOptions.showHdIcon) {
                    if (layoutManager.tv) {
                        html += '<div class="programIcon guide-programTextIcon guide-programTextIcon-tv">HD</div>';
                    } else {
                        html += '<div class="programIcon guide-programTextIcon">HD</div>';
                    }
                }

                html += getTimerIndicator(program);

                html += '</div>';
            }

            html += '</button>';
        }

        html += '</div>';

        return html;
    }

    function renderChannelHeaders(context, channels, apiClient) {
        let html = '';

        for (const channel of channels) {
            const hasChannelImage = channel.ImageTags.Primary;

            let cssClass = 'guide-channelHeaderCell itemAction';

            if (layoutManager.tv) {
                cssClass += ' guide-channelHeaderCell-tv';
            }

            const title = [];
            if (channel.ChannelNumber) {
                title.push(channel.ChannelNumber);
            }
            if (channel.Name) {
                title.push(channel.Name);
            }

            html += '<button title="' + escapeHtml(title.join(' ')) + '" type="button" class="' + cssClass + '"' + ' data-action="link" data-isfolder="' + channel.IsFolder + '" data-id="' + channel.Id + '" data-serverid="' + channel.ServerId + '" data-type="' + channel.Type + '">';

            if (hasChannelImage) {
                const url = apiClient.getScaledImageUrl(channel.Id, {
                    maxHeight: 220,
                    tag: channel.ImageTags.Primary,
                    type: 'Primary'
                });

                html += '<div class="guideChannelImage lazy" data-src="' + url + '"></div>';
            }

            if (channel.ChannelNumber) {
                html += '<h3 class="guideChannelNumber">' + channel.ChannelNumber + '</h3>';
            }

            if (!hasChannelImage && channel.Name) {
                html += '<div class="guideChannelName">' + escapeHtml(channel.Name) + '</div>';
            }

            html += '</button>';
        }

        const channelList = context.querySelector('.channelsContainer');
        channelList.innerHTML = html;
        imageLoader.lazyChildren(channelList);
    }

    function renderPrograms(context, date, channels, programs, programOptions) {
        const listInfo = {
            startIndex: 0
        };

        const html = [];

        for (const channel of channels) {
            html.push(getChannelProgramsHtml(context, date, channel, programs, programOptions, listInfo));
        }

        programGrid.innerHTML = html.join('');

        programCells = programGrid.querySelectorAll('[is=emby-programcell]');

        updateProgramCellsOnScroll(programGrid, programCells);
    }

    function getProgramSortOrder(program, channels) {
        const channelId = program.ChannelId;
        let channelIndex = -1;

        for (let i = 0, length = channels.length; i < length; i++) {
            if (channelId === channels[i].Id) {
                channelIndex = i;
                break;
            }
        }

        const start = datetime.parseISO8601Date(program.StartDate, { toLocal: true });

        return (channelIndex * 10000000) + (start.getTime() / 60000);
    }

    function renderGuide(context, date, channels, programs, renderOptions, guideOptions, apiClient) {
        programs.sort(function (a, b) {
            return getProgramSortOrder(a, channels) - getProgramSortOrder(b, channels);
        });

        const activeElement = document.activeElement;
        const itemId = activeElement?.getAttribute ? activeElement.getAttribute('data-id') : null;
        let channelRowId = null;

        if (activeElement) {
            channelRowId = dom.parentWithClass(activeElement, 'channelPrograms');
            channelRowId = channelRowId?.getAttribute ? channelRowId.getAttribute('data-channelid') : null;
        }

        renderChannelHeaders(context, channels, apiClient);

        const startDate = date;
        const endDate = new Date(startDate.getTime() + msPerDay);
        context.querySelector('.timeslotHeaders').innerHTML = getTimeslotHeadersHtml(startDate, endDate);
        items = {};
        renderPrograms(context, date, channels, programs, renderOptions);

        if (guideOptions.focusProgramOnRender) {
            focusProgram(context, itemId, channelRowId, guideOptions.focusToTimeMs, guideOptions.startTimeOfDayMs);
        }

        scrollProgramGridToTimeMs(context, guideOptions.scrollToTimeMs, guideOptions.startTimeOfDayMs);
    }

    function scrollProgramGridToTimeMs(context, scrollToTimeMs, startTimeOfDayMs) {
        scrollToTimeMs -= startTimeOfDayMs;

        const pct = scrollToTimeMs / msPerDay;

        programGrid.scrollTop = 0;

        const scrollPos = pct * programGrid.scrollWidth;

        nativeScrollTo(programGrid, scrollPos, true);
    }

    function focusProgram(context, itemId, channelRowId, focusToTimeMs, startTimeOfDayMs) {
        let focusElem;
        if (itemId) {
            focusElem = context.querySelector('[data-id="' + itemId + '"]');
        }

        if (focusElem) {
            focusManager.focus(focusElem);
        } else {
            let autoFocusParent;

            if (channelRowId) {
                autoFocusParent = context.querySelector('[data-channelid="' + channelRowId + '"]');
            }

            if (!autoFocusParent) {
                autoFocusParent = programGrid;
            }

            focusToTimeMs -= startTimeOfDayMs;

            const pct = (focusToTimeMs / msPerDay) * 100;

            let programCell = autoFocusParent.querySelector('.programCell');

            while (programCell) {
                let left = (programCell.style.left || '').replace('%', '');
                left = left ? parseFloat(left) : 0;
                let width = (programCell.style.width || '').replace('%', '');
                width = width ? parseFloat(width) : 0;

                if (left >= pct || (left + width) >= pct) {
                    break;
                }
                programCell = programCell.nextSibling;
            }

            if (programCell) {
                focusManager.focus(programCell);
            } else {
                focusManager.autoFocus(autoFocusParent, true);
            }
        }
    }

    function nativeScrollTo(container, pos, horizontal) {
        if (container.scrollTo) {
            if (horizontal) {
                container.scrollTo(pos, 0);
            } else {
                container.scrollTo(0, pos);
            }
        } else if (horizontal) {
            container.scrollLeft = Math.round(pos);
        } else {
            container.scrollTop = Math.round(pos);
        }
    }

    let lastGridScroll = 0;
    let lastHeaderScroll = 0;
    let scrollXPct = 0;
    function onProgramGridScroll(context, elem, headers) {
        if ((new Date().getTime() - lastHeaderScroll) >= 1000) {
            lastGridScroll = new Date().getTime();

            const scrollLeft = elem.scrollLeft;
            scrollXPct = (scrollLeft * 100) / elem.scrollWidth;
            nativeScrollTo(headers, scrollLeft, true);
        }

        updateProgramCellsOnScroll(elem, programCells);
    }

    function onTimeslotHeadersScroll(context, elem) {
        if ((new Date().getTime() - lastGridScroll) >= 1000) {
            lastHeaderScroll = new Date().getTime();
            nativeScrollTo(programGrid, elem.scrollLeft, true);
        }
    }

    function changeDate(page, date, scrollToTimeMs, focusToTimeMs, startTimeOfDayMs, focusProgramOnRender) {
        const newStartDate = normalizeDateToTimeslot(date);
        currentDate = newStartDate;

        reloadGuide(page, newStartDate, scrollToTimeMs, focusToTimeMs, startTimeOfDayMs, focusProgramOnRender);
    }

    function getDateTabText(date, isActive, tabIndex) {
        const cssClass = isActive ? 'emby-tab-button guide-date-tab-button emby-tab-button-active' : 'emby-tab-button guide-date-tab-button';

        let html = '<button is="emby-button" class="' + cssClass + '" data-index="' + tabIndex + '" data-date="' + date.getTime() + '">';
        let tabText = datetime.toLocaleDateString(date, { weekday: 'short' });

        tabText += '<br/>';
        tabText += date.getDate();
        html += '<div class="emby-button-foreground">' + tabText + '</div>';
        html += '</button>';

        return html;
    }

    function setDateRange(page, guideInfo) {
        const today = new Date();
        const nowHours = today.getHours();
        today.setHours(nowHours, 0, 0, 0);

        let start = datetime.parseISO8601Date(guideInfo.StartDate, { toLocal: true });
        const end = datetime.parseISO8601Date(guideInfo.EndDate, { toLocal: true });

        start.setHours(nowHours, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        if (start.getTime() >= end.getTime()) {
            end.setDate(start.getDate() + 1);
        }

        start = new Date(Math.max(today, start));

        let dateTabsHtml = '';
        let tabIndex = 0;

        // TODO: Use date-fns
        const date = new Date();

        if (currentDate) {
            date.setTime(currentDate.getTime());
        }

        date.setHours(nowHours, 0, 0, 0);

        let startTimeOfDayMs = (start.getHours() * 60 * 60 * 1000);
        startTimeOfDayMs += start.getMinutes() * 60 * 1000;

        while (start <= end) {
            const isActive = date.getDate() === start.getDate() && date.getMonth() === start.getMonth() && date.getFullYear() === start.getFullYear();

            dateTabsHtml += getDateTabText(start, isActive, tabIndex);

            start.setDate(start.getDate() + 1);
            start.setHours(0, 0, 0, 0);
            tabIndex++;
        }

        page.querySelector('.emby-tabs-slider').innerHTML = dateTabsHtml;
        page.querySelector('.guideDateTabs').refresh();

        const newDate = new Date();
        const newDateHours = newDate.getHours();
        let scrollToTimeMs = newDateHours * 60 * 60 * 1000;

        const minutes = newDate.getMinutes();
        if (minutes >= 30) {
            scrollToTimeMs += 30 * 60 * 1000;
        }

        const focusToTimeMs = ((newDateHours * 60) + minutes) * 60 * 1000;
        changeDate(page, date, scrollToTimeMs, focusToTimeMs, startTimeOfDayMs, layoutManager.tv);
    }

    function reloadPage(page) {
        showLoading();

        const apiClient = ServerConnections.getApiClient(options.serverId);

        apiClient.getLiveTvGuideInfo().then(function (guideInfo) {
            setDateRange(page, guideInfo);
        });
    }

    function getChannelProgramsFocusableElements(container) {
        const elements = container.querySelectorAll('.programCell');

        const list = [];
        // add 1 to avoid programs that are out of view to the left
        const currentScrollXPct = scrollXPct + 1;

        for (const elem of elements) {
            let left = (elem.style.left || '').replace('%', '');
            left = left ? parseFloat(left) : 0;

            let width = (elem.style.width || '').replace('%', '');
            width = width ? parseFloat(width) : 0;

            if ((left + width) >= currentScrollXPct) {
                list.push(elem);
            }
        }

        return list;
    }

    function onInputCommand(e) {
        const target = e.target;
        const programCell = dom.parentWithClass(target, 'programCell');
        let container;
        let channelPrograms;
        let focusableElements;
        let newRow;

        switch (e.detail.command) {
            case 'up':
                if (programCell) {
                    container = programGrid;
                    channelPrograms = dom.parentWithClass(programCell, 'channelPrograms');

                    newRow = channelPrograms.previousSibling;
                    if (newRow) {
                        focusableElements = getChannelProgramsFocusableElements(newRow);
                        if (focusableElements.length) {
                            container = newRow;
                        } else {
                            focusableElements = null;
                        }
                    } else {
                        container = null;
                    }
                } else {
                    container = null;
                }
                lastFocusDirection = e.detail.command;

                focusManager.moveUp(target, {
                    container: container,
                    focusableElements: focusableElements
                });
                break;
            case 'down':
                if (programCell) {
                    container = programGrid;
                    channelPrograms = dom.parentWithClass(programCell, 'channelPrograms');

                    newRow = channelPrograms.nextSibling;
                    if (newRow) {
                        focusableElements = getChannelProgramsFocusableElements(newRow);
                        if (focusableElements.length) {
                            container = newRow;
                        } else {
                            focusableElements = null;
                        }
                    } else {
                        container = null;
                    }
                } else {
                    container = null;
                }
                lastFocusDirection = e.detail.command;

                focusManager.moveDown(target, {
                    container: container,
                    focusableElements: focusableElements
                });
                break;
            case 'left':
                container = programCell ? dom.parentWithClass(programCell, 'channelPrograms') : null;
                // allow left outside the channelProgramsContainer when the first child is currently focused
                if (container && !programCell.previousSibling) {
                    container = null;
                }
                lastFocusDirection = e.detail.command;

                focusManager.moveLeft(target, {
                    container: container
                });
                break;
            case 'right':
                container = programCell ? dom.parentWithClass(programCell, 'channelPrograms') : null;
                lastFocusDirection = e.detail.command;

                focusManager.moveRight(target, {
                    container: container
                });
                break;
            default:
                return;
        }

        e.preventDefault();
        e.stopPropagation();
    }

    function onScrollerFocus(e) {
        const target = e.target;
        const programCell = dom.parentWithClass(target, 'programCell');

        if (programCell) {
            const focused = target;

            const id = focused.getAttribute('data-id');
            const item = items[id];

            if (item) {
                Events.trigger(self, 'focus', [
                    {
                        item: item
                    }]);
            }
        }

        if (lastFocusDirection === 'left') {
            if (programCell) {
                scrollHelper.toStart(programGrid, programCell, true, true);
            }
        } else if (lastFocusDirection === 'right') {
            if (programCell) {
                scrollHelper.toCenter(programGrid, programCell, true, true);
            }
        } else if (lastFocusDirection === 'up' || lastFocusDirection === 'down') {
            const verticalScroller = dom.parentWithClass(target, 'guideVerticalScroller');
            if (verticalScroller) {
                const focusedElement = programCell || dom.parentWithTag(target, 'BUTTON');
                verticalScroller.toCenter(focusedElement, true);
            }
        }
    }

    function setScrollEvents(view, enabled) {
        if (layoutManager.tv) {
            const guideVerticalScroller = view.querySelector('.guideVerticalScroller');

            if (enabled) {
                inputManager.on(guideVerticalScroller, onInputCommand);
            } else {
                inputManager.off(guideVerticalScroller, onInputCommand);
            }
        }
    }

    function onTimerCreated(e, apiClient, data) {
        const programId = data.ProgramId;
        // This could be null, not supported by all tv providers
        const newTimerId = data.Id;

        // find guide cells by program id, ensure timer icon
        const cells = options.element.querySelectorAll('.programCell[data-id="' + programId + '"]');
        for (const cell of cells) {
            const icon = cell.querySelector('.timerIcon');
            if (!icon) {
                cell.querySelector('.guideProgramName').insertAdjacentHTML('beforeend', '<span class="timerIcon material-icons programIcon fiber_manual_record"></span>');
            }

            if (newTimerId) {
                cell.setAttribute('data-timerid', newTimerId);
            }
        }
    }

    function onTimerCancelled(e, apiClient, data) {
        const id = data.Id;
        // find guide cells by timer id, remove timer icon
        const cells = options.element.querySelectorAll('.programCell[data-timerid="' + id + '"]');

        for (const cell of cells) {
            const icon = cell.querySelector('.timerIcon');

            if (icon) {
                icon.parentNode.removeChild(icon);
            }

            cell.removeAttribute('data-timerid');
        }
    }

    function onSeriesTimerCancelled(e, apiClient, data) {
        const id = data.Id;
        // find guide cells by timer id, remove timer icon
        const cells = options.element.querySelectorAll('.programCell[data-seriestimerid="' + id + '"]');

        for (const cell of cells) {
            const icon = cell.querySelector('.seriesTimerIcon');

            if (icon) {
                icon.parentNode.removeChild(icon);
            }

            cell.removeAttribute('data-seriestimerid');
        }
    }

    const guideContext = options.element;

    guideContext.classList.add('tvguide');

    guideContext.innerHTML = globalize.translateHtml(template, 'core');

    const programGrid = guideContext.querySelector('.programGrid');
    const timeslotHeaders = guideContext.querySelector('.timeslotHeaders');

    if (layoutManager.tv) {
        dom.addEventListener(guideContext.querySelector('.guideVerticalScroller'), 'focus', onScrollerFocus, {
            capture: true,
            passive: true
        });
    } else if (layoutManager.desktop) {
        timeslotHeaders.classList.add('timeslotHeaders-desktop');
    }

    if (browser.iOS || browser.osx) {
        guideContext.querySelector('.channelsContainer').classList.add('noRubberBanding');

        programGrid.classList.add('noRubberBanding');
    }

    dom.addEventListener(programGrid, 'scroll', function () {
        onProgramGridScroll(guideContext, this, timeslotHeaders);
    }, {
        passive: true
    });

    dom.addEventListener(timeslotHeaders, 'scroll', function () {
        onTimeslotHeadersScroll(guideContext, this);
    }, {
        passive: true
    });

    programGrid.addEventListener('click', onProgramGridClick);

    guideContext.querySelector('.btnNextPage').addEventListener('click', function () {
        currentStartIndex += currentChannelLimit;
        reloadPage(guideContext);
        restartAutoRefresh();
    });

    guideContext.querySelector('.btnPreviousPage').addEventListener('click', function () {
        currentStartIndex = Math.max(currentStartIndex - currentChannelLimit, 0);
        reloadPage(guideContext);
        restartAutoRefresh();
    });

    guideContext.querySelector('.btnGuideViewSettings').addEventListener('click', function () {
        showViewSettings(self);
        restartAutoRefresh();
    });

    guideContext.querySelector('.guideDateTabs').addEventListener('tabchange', function (e) {
        const allTabButtons = e.target.querySelectorAll('.guide-date-tab-button');

        const tabButton = allTabButtons[parseInt(e.detail.selectedTabIndex, 10)];
        if (tabButton) {
            const previousButton = e.detail.previousIndex == null ? null : allTabButtons[parseInt(e.detail.previousIndex, 10)];

            const date = new Date();
            date.setTime(parseInt(tabButton.getAttribute('data-date'), 10));

            const scrollWidth = programGrid.scrollWidth;
            let scrollToTimeMs;
            if (scrollWidth) {
                scrollToTimeMs = (programGrid.scrollLeft / scrollWidth) * msPerDay;
            } else {
                scrollToTimeMs = 0;
            }

            if (previousButton) {
                const previousDate = new Date();
                previousDate.setTime(parseInt(previousButton.getAttribute('data-date'), 10));

                scrollToTimeMs += (previousDate.getHours() * 60 * 60 * 1000);
                scrollToTimeMs += (previousDate.getMinutes() * 60 * 1000);
            }

            let startTimeOfDayMs = (date.getHours() * 60 * 60 * 1000);
            startTimeOfDayMs += (date.getMinutes() * 60 * 1000);

            changeDate(guideContext, date, scrollToTimeMs, scrollToTimeMs, startTimeOfDayMs, false);
        }
    });

    setScrollEvents(guideContext, true);
    itemShortcuts.on(guideContext);

    Events.trigger(self, 'load');

    Events.on(serverNotifications, 'TimerCreated', onTimerCreated);
    Events.on(serverNotifications, 'TimerCancelled', onTimerCancelled);
    Events.on(serverNotifications, 'SeriesTimerCancelled', onSeriesTimerCancelled);

    self.refresh();
}

export default Guide;
