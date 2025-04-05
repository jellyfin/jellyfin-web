import escapeHtml from 'escape-html';

import datetime from 'scripts/datetime';
import Events from 'utils/events.ts';
import itemHelper from 'components/itemHelper';
import serverNotifications from 'scripts/serverNotifications';
import dom from 'scripts/dom';
import globalize from 'lib/globalize';
import { formatDistanceToNow } from 'date-fns';
import { getLocaleWithSuffix } from 'utils/dateFnsLocale.ts';
import loading from 'components/loading/loading';
import playMethodHelper from 'components/playback/playmethodhelper';
import cardBuilder from 'components/cardbuilder/cardBuilder';
import imageLoader from 'components/images/imageLoader';
import ActivityLog from 'components/activitylog';
import imageHelper from 'utils/image';
import indicators from 'components/indicators/indicators';
import taskButton from 'scripts/taskbutton';
import Dashboard from 'utils/dashboard';
import ServerConnections from 'components/ServerConnections';
import alert from 'components/alert';
import confirm from 'components/confirm/confirm';
import { getDefaultBackgroundClass } from 'components/cardbuilder/cardBuilderUtils';

import { getSystemInfoQuery } from 'hooks/useSystemInfo';
import { toApi } from 'utils/jellyfin-apiclient/compat';
import { queryClient } from 'utils/query/queryClient';

import 'elements/emby-button/emby-button';
import 'elements/emby-itemscontainer/emby-itemscontainer';

import 'components/listview/listview.scss';
import 'styles/flexstyles.scss';
import './dashboard.scss';

function showPlaybackInfo(btn, session) {
    let title;
    const text = [];
    const displayPlayMethod = playMethodHelper.getDisplayPlayMethod(session);

    if (displayPlayMethod === 'Remux') {
        title = globalize.translate('Remuxing');
        text.push(globalize.translate('RemuxHelp1'));
        text.push('<br/>');
        text.push(globalize.translate('RemuxHelp2'));
    } else if (displayPlayMethod === 'DirectStream') {
        title = globalize.translate('DirectStreaming');
        text.push(globalize.translate('DirectStreamHelp1'));
        text.push('<br/>');
        text.push(globalize.translate('DirectStreamHelp2'));
    } else if (displayPlayMethod === 'DirectPlay') {
        title = globalize.translate('DirectPlaying');
        text.push(globalize.translate('DirectPlayHelp'));
    } else if (displayPlayMethod === 'Transcode') {
        title = globalize.translate('Transcoding');
        text.push(globalize.translate('MediaIsBeingConverted'));
        text.push(DashboardPage.getSessionNowPlayingStreamInfo(session));

        if (session.TranscodingInfo?.TranscodeReasons?.length) {
            text.push('<br/>');
            text.push(globalize.translate('LabelReasonForTranscoding'));
            session.TranscodingInfo.TranscodeReasons.forEach(function (transcodeReason) {
                text.push(globalize.translate(transcodeReason));
            });
        }
    }

    alert({
        text: text.join('<br/>'),
        title: title
    });
}

function showSendMessageForm(btn, session) {
    import('components/prompt/prompt').then(({ default: prompt }) => {
        prompt({
            title: globalize.translate('HeaderSendMessage'),
            label: globalize.translate('LabelMessageText'),
            confirmText: globalize.translate('ButtonSend')
        }).then(function (text) {
            if (text) {
                ServerConnections.getApiClient(session.ServerId).sendMessageCommand(session.Id, {
                    Text: text,
                    TimeoutMs: 5e3
                });
            }
        });
    });
}

function showOptionsMenu(btn, session) {
    import('components/actionSheet/actionSheet').then(({ default: actionsheet }) => {
        const menuItems = [];

        if (session.ServerId && session.DeviceId !== ServerConnections.deviceId()) {
            menuItems.push({
                name: globalize.translate('SendMessage'),
                id: 'sendmessage'
            });
        }

        if (session.TranscodingInfo?.TranscodeReasons?.length) {
            menuItems.push({
                name: globalize.translate('ViewPlaybackInfo'),
                id: 'transcodinginfo'
            });
        }

        return actionsheet.show({
            items: menuItems,
            positionTo: btn
        }).then(function (id) {
            switch (id) {
                case 'sendmessage':
                    showSendMessageForm(btn, session);
                    break;
                case 'transcodinginfo':
                    showPlaybackInfo(btn, session);
                    break;
            }
        });
    });
}

function onActiveDevicesClick(evt) {
    const btn = dom.parentWithClass(evt.target, 'sessionCardButton');

    if (btn) {
        const card = dom.parentWithClass(btn, 'card');

        if (card) {
            const sessionId = card.id;
            const session = (DashboardPage.sessionsList || []).filter(function (dashboardSession) {
                return 'session' + dashboardSession.Id === sessionId;
            })[0];

            if (session) {
                if (btn.classList.contains('btnCardOptions')) {
                    showOptionsMenu(btn, session);
                } else if (btn.classList.contains('btnSessionInfo')) {
                    showPlaybackInfo(btn, session);
                } else if (btn.classList.contains('btnSessionSendMessage')) {
                    showSendMessageForm(btn, session);
                } else if (btn.classList.contains('btnSessionStop')) {
                    ServerConnections.getApiClient(session.ServerId).sendPlayStateCommand(session.Id, 'Stop');
                } else if (btn.classList.contains('btnSessionPlayPause') && session.PlayState) {
                    ServerConnections.getApiClient(session.ServerId).sendPlayStateCommand(session.Id, 'PlayPause');
                }
            }
        }
    }
}

function filterSessions(sessions) {
    const list = [];
    const minActiveDate = new Date().getTime() - 9e5;

    for (let i = 0, length = sessions.length; i < length; i++) {
        const session = sessions[i];

        if (!session.NowPlayingItem && !session.UserId) {
            continue;
        }

        if (datetime.parseISO8601Date(session.LastActivityDate, true).getTime() >= minActiveDate) {
            list.push(session);
        }
    }

    return list;
}

function refreshActiveRecordings(view, apiClient) {
    apiClient.getLiveTvRecordings({
        UserId: Dashboard.getCurrentUserId(),
        IsInProgress: true,
        Fields: 'CanDelete,PrimaryImageAspectRatio',
        EnableTotalRecordCount: false,
        EnableImageTypes: 'Primary,Thumb,Backdrop'
    }).then(function (result) {
        const itemsContainer = view.querySelector('.activeRecordingItems');

        if (!result.Items.length) {
            view.querySelector('.activeRecordingsSection').classList.add('hide');
            itemsContainer.innerHTML = '';
            return;
        }

        view.querySelector('.activeRecordingsSection').classList.remove('hide');
        itemsContainer.innerHTML = cardBuilder.getCardsHtml({
            items: result.Items,
            shape: 'auto',
            defaultShape: 'backdrop',
            showTitle: true,
            showParentTitle: true,
            coverImage: true,
            cardLayout: false,
            centerText: true,
            preferThumb: 'auto',
            overlayText: false,
            overlayMoreButton: true,
            action: 'none',
            centerPlayButton: true
        });
        imageLoader.lazyChildren(itemsContainer);
    });
}

function reloadSystemInfo(view, apiClient) {
    view.querySelector('#buildVersion').innerText = __JF_BUILD_VERSION__;

    let webVersion = __PACKAGE_JSON_VERSION__;
    if (__COMMIT_SHA__) {
        webVersion += ` (${__COMMIT_SHA__})`;
    }
    view.querySelector('#webVersion').innerText = webVersion;

    queryClient
        .fetchQuery(getSystemInfoQuery(toApi(apiClient)))
        .then(systemInfo => {
            view.querySelector('#serverName').innerText = systemInfo.ServerName;
            view.querySelector('#versionNumber').innerText = systemInfo.Version;

            view.querySelector('#cachePath').innerText = systemInfo.CachePath;
            view.querySelector('#logPath').innerText = systemInfo.LogPath;
            view.querySelector('#transcodePath').innerText = systemInfo.TranscodingTempPath;
            view.querySelector('#metadataPath').innerText = systemInfo.InternalMetadataPath;
            view.querySelector('#webPath').innerText = systemInfo.WebPath;
        });
}

function renderInfo(view, sessions) {
    sessions = filterSessions(sessions);
    renderActiveConnections(view, sessions);
    loading.hide();
}

function pollForInfo(view, apiClient) {
    apiClient.getSessions({
        ActiveWithinSeconds: 960
    }).then(function (sessions) {
        renderInfo(view, sessions);
    });
    apiClient.getScheduledTasks().then(function (tasks) {
        renderRunningTasks(view, tasks);
    });
}

function renderActiveConnections(view, sessions) {
    let html = '';
    DashboardPage.sessionsList = sessions;
    const parentElement = view.querySelector('.activeDevices');
    const cardElem = parentElement.querySelector('.card');

    if (cardElem) {
        cardElem.classList.add('deadSession');
    }

    for (let i = 0, length = sessions.length; i < length; i++) {
        const session = sessions[i];
        const rowId = 'session' + session.Id;
        const elem = view.querySelector('#' + rowId);

        if (elem) {
            DashboardPage.updateSession(elem, session);
        } else {
            const nowPlayingItem = session.NowPlayingItem;
            const className = 'scalableCard card activeSession backdropCard backdropCard-scalable';
            const imgUrl = DashboardPage.getNowPlayingImageUrl(nowPlayingItem);

            html += '<div class="' + className + '" id="' + rowId + '">';
            html += '<div class="cardBox visualCardBox">';
            html += '<div class="cardScalable visualCardBox-cardScalable">';
            html += '<div class="cardPadder cardPadder-backdrop"></div>';
            html += `<div class="cardContent ${getDefaultBackgroundClass()}">`;

            if (imgUrl) {
                html += '<div class="sessionNowPlayingContent sessionNowPlayingContent-withbackground"';
                html += ' data-src="' + imgUrl + '" style="display:inline-block;background-image:url(\'' + imgUrl + "');\"></div>";
            } else {
                html += '<div class="sessionNowPlayingContent"></div>';
            }

            html += `<div class="sessionNowPlayingInnerContent ${imgUrl ? 'darkenContent' : ''}">`;
            html += '<div class="sessionAppInfo">';
            const clientImage = DashboardPage.getClientImage(session);

            if (clientImage) {
                html += clientImage;
            }

            html += '<div class="sessionAppName" style="display:inline-block; text-align:left;"  dir="ltr" >';
            html += '<div class="sessionDeviceName">' + escapeHtml(session.DeviceName) + '</div>';
            html += '<div class="sessionAppSecondaryText">' + escapeHtml(DashboardPage.getAppSecondaryText(session)) + '</div>';
            html += '</div>';
            html += '</div>';

            html += '<div class="sessionNowPlayingDetails">';
            const nowPlayingName = DashboardPage.getNowPlayingName(session);
            html += '<div class="sessionNowPlayingInfo" data-imgsrc="' + nowPlayingName.image + '">';
            html += '<span class="sessionNowPlayingName">' + nowPlayingName.html + '</span>';
            html += '</div>';
            html += '<div class="sessionNowPlayingTime">' + escapeHtml(DashboardPage.getSessionNowPlayingTime(session)) + '</div>';
            html += '</div>';

            let percent = 100 * session?.PlayState?.PositionTicks / nowPlayingItem?.RunTimeTicks;
            html += indicators.getProgressHtml(percent || 0, {
                containerClass: 'playbackProgress'
            });

            percent = session?.TranscodingInfo?.CompletionPercentage?.toFixed(1);
            html += indicators.getProgressHtml(percent || 0, {
                containerClass: 'transcodingProgress'
            });

            html += indicators.getProgressHtml(100, {
                containerClass: 'backgroundProgress'
            });

            html += '</div>';
            html += '</div>';
            html += '</div>';
            html += '<div class="sessionCardFooter cardFooter">';
            html += '<div class="sessionCardButtons flex align-items-center justify-content-center">';

            let btnCssClass = session.ServerId && session.NowPlayingItem && session.SupportsRemoteControl ? '' : ' hide';
            const playIcon = session.PlayState.IsPaused ? 'play_arrow' : 'pause';

            html += '<button is="paper-icon-button-light" class="sessionCardButton btnSessionPlayPause paper-icon-button-light ' + btnCssClass + '"><span class="material-icons ' + playIcon + '" aria-hidden="true"></span></button>';
            html += '<button is="paper-icon-button-light" class="sessionCardButton btnSessionStop paper-icon-button-light ' + btnCssClass + '"><span class="material-icons stop" aria-hidden="true"></span></button>';
            html += '<button is="paper-icon-button-light" class="sessionCardButton btnSessionInfo paper-icon-button-light ' + btnCssClass + '" title="' + globalize.translate('ViewPlaybackInfo') + '"><span class="material-icons info" aria-hidden="true"></span></button>';

            btnCssClass = session.ServerId && session.SupportedCommands.indexOf('DisplayMessage') !== -1 && session.DeviceId !== ServerConnections.deviceId() ? '' : ' hide';
            html += '<button is="paper-icon-button-light" class="sessionCardButton btnSessionSendMessage paper-icon-button-light ' + btnCssClass + '" title="' + globalize.translate('SendMessage') + '"><span class="material-icons message" aria-hidden="true"></span></button>';
            html += '</div>';

            html += '<div class="flex align-items-center justify-content-center">';
            const userImage = DashboardPage.getUserImage(session);
            html += userImage ? '<div class="activitylogUserPhoto" style="background-image:url(\'' + userImage + "');\"></div>" : '<div style="height:1.71em;"></div>';
            html += '<div class="sessionUserName">';
            html += DashboardPage.getUsersHtml(session);

            html += '</div>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
        }
    }

    parentElement.insertAdjacentHTML('beforeend', html);
    const deadSessionElem = parentElement.querySelector('.deadSession');

    if (deadSessionElem) {
        deadSessionElem.parentNode.removeChild(deadSessionElem);
    }
}

function renderRunningTasks(view, tasks) {
    let html = '';
    tasks = tasks.filter(function (task) {
        if (task.State != 'Idle') {
            return !task.IsHidden;
        }

        return false;
    });

    if (tasks.length) {
        view.querySelector('.runningTasksContainer').classList.remove('hide');
    } else {
        view.querySelector('.runningTasksContainer').classList.add('hide');
    }

    for (let i = 0, length = tasks.length; i < length; i++) {
        const task = tasks[i];
        html += '<p>';
        html += task.Name + '<br/>';

        if (task.State === 'Running') {
            const progress = (task.CurrentProgressPercentage || 0).toFixed(1);
            html += '<progress max="100" value="' + progress + '" title="' + progress + '%">';
            html += progress + '%';
            html += '</progress>';
            html += "<span style='color:#00a4dc;margin-left:5px;margin-right:5px;'>" + progress + '%</span>';
            html += '<button type="button" is="paper-icon-button-light" title="' + globalize.translate('ButtonStop') + '" data-task-id="' + task.Id + '" class="autoSize btnTaskCancel"><span class="material-icons cancel" aria-hidden="true"></span></button>';
        } else if (task.State === 'Cancelling') {
            html += '<span style="color:#cc0000;">' + globalize.translate('LabelStopping') + '</span>';
        }

        html += '</p>';
    }

    const runningTasks = view.querySelector('#divRunningTasks');

    runningTasks.innerHTML = html;
    runningTasks.querySelectorAll('.btnTaskCancel').forEach(function (btn) {
        btn.addEventListener('click', () => DashboardPage.stopTask(btn, btn.dataset.taskId));
    });
}

const DashboardPage = {
    startInterval: function (apiClient) {
        apiClient.sendMessage('SessionsStart', '0,1500');
        apiClient.sendMessage('ScheduledTasksInfoStart', '0,1000');
    },
    stopInterval: function (apiClient) {
        apiClient.sendMessage('SessionsStop');
        apiClient.sendMessage('ScheduledTasksInfoStop');
    },
    getSessionNowPlayingStreamInfo: function (session) {
        let html = '';
        let showTranscodingInfo = false;
        const displayPlayMethod = playMethodHelper.getDisplayPlayMethod(session);

        if (displayPlayMethod === 'DirectPlay') {
            html += globalize.translate('DirectPlaying');
        } else if (displayPlayMethod === 'Remux') {
            html += globalize.translate('Remuxing');
        } else if (displayPlayMethod === 'DirectStream') {
            html += globalize.translate('DirectStreaming');
        } else if (displayPlayMethod === 'Transcode') {
            if (session.TranscodingInfo?.Framerate) {
                html += `${globalize.translate('Framerate')}: ${session.TranscodingInfo.Framerate}fps`;
            }

            showTranscodingInfo = true;
        }

        if (showTranscodingInfo) {
            const line = [];

            if (session.TranscodingInfo) {
                if (session.TranscodingInfo.Bitrate) {
                    if (session.TranscodingInfo.Bitrate > 1e6) {
                        line.push((session.TranscodingInfo.Bitrate / 1e6).toFixed(1) + ' Mbps');
                    } else {
                        line.push(Math.floor(session.TranscodingInfo.Bitrate / 1e3) + ' Kbps');
                    }
                }

                if (session.TranscodingInfo.Container) {
                    line.push(session.TranscodingInfo.Container.toUpperCase());
                }

                if (session.TranscodingInfo.VideoCodec) {
                    line.push(session.TranscodingInfo.VideoCodec.toUpperCase());
                }

                if (session.TranscodingInfo.AudioCodec && session.TranscodingInfo.AudioCodec != session.TranscodingInfo.Container) {
                    line.push(session.TranscodingInfo.AudioCodec.toUpperCase());
                }
            }

            if (line.length) {
                html += '<br/><br/>' + line.join(' ');
            }
        }

        return html;
    },
    getSessionNowPlayingTime: function (session) {
        const nowPlayingItem = session.NowPlayingItem;
        let html = '';

        if (nowPlayingItem) {
            if (session.PlayState.PositionTicks) {
                html += datetime.getDisplayRunningTime(session.PlayState.PositionTicks);
            } else {
                html += '0:00';
            }

            html += ' / ';

            if (nowPlayingItem.RunTimeTicks) {
                html += datetime.getDisplayRunningTime(nowPlayingItem.RunTimeTicks);
            } else {
                html += '0:00';
            }
        }

        return html;
    },
    getAppSecondaryText: function (session) {
        return session.Client + ' ' + session.ApplicationVersion;
    },
    getNowPlayingName: function (session) {
        let imgUrl = '';
        const nowPlayingItem = session.NowPlayingItem;
        // FIXME: It seems that, sometimes, server sends date in the future, so date-fns displays messages like 'in less than a minute'. We should fix
        // how dates are returned by the server when the session is active and show something like 'Active now', instead of past/future sentences
        if (!nowPlayingItem) {
            return {
                html: globalize.translate('LastSeen', formatDistanceToNow(Date.parse(session.LastActivityDate), getLocaleWithSuffix())),
                image: imgUrl
            };
        }

        let topText = escapeHtml(itemHelper.getDisplayName(nowPlayingItem));
        let bottomText = '';

        if (nowPlayingItem.Artists?.length) {
            bottomText = topText;
            topText = escapeHtml(nowPlayingItem.Artists[0]);
        } else if (nowPlayingItem.SeriesName || nowPlayingItem.Album) {
            bottomText = topText;
            topText = escapeHtml(nowPlayingItem.SeriesName || nowPlayingItem.Album);
        } else if (nowPlayingItem.ProductionYear) {
            bottomText = nowPlayingItem.ProductionYear;
        }

        if (nowPlayingItem.ImageTags?.Logo) {
            imgUrl = ApiClient.getScaledImageUrl(nowPlayingItem.Id, {
                tag: nowPlayingItem.ImageTags.Logo,
                maxHeight: 24,
                maxWidth: 130,
                type: 'Logo'
            });
        } else if (nowPlayingItem.ParentLogoImageTag) {
            imgUrl = ApiClient.getScaledImageUrl(nowPlayingItem.ParentLogoItemId, {
                tag: nowPlayingItem.ParentLogoImageTag,
                maxHeight: 24,
                maxWidth: 130,
                type: 'Logo'
            });
        }

        if (imgUrl) {
            topText = '<img src="' + imgUrl + '" style="max-height:24px;max-width:130px;" />';
        }

        return {
            html: bottomText ? topText + '<br/>' + bottomText : topText,
            image: imgUrl
        };
    },
    getUsersHtml: function (session) {
        const html = [];

        if (session.UserId) {
            html.push(escapeHtml(session.UserName));
        }

        for (let i = 0, length = session.AdditionalUsers.length; i < length; i++) {
            html.push(escapeHtml(session.AdditionalUsers[i].UserName));
        }

        return html.join(', ');
    },
    getUserImage: function (session) {
        if (session.UserId && session.UserPrimaryImageTag) {
            return ApiClient.getUserImageUrl(session.UserId, {
                tag: session.UserPrimaryImageTag,
                type: 'Primary'
            });
        }

        return null;
    },
    updateSession: function (row, session) {
        row.classList.remove('deadSession');
        const nowPlayingItem = session.NowPlayingItem;

        if (nowPlayingItem) {
            row.classList.add('playingSession');
            row.querySelector('.btnSessionInfo').classList.remove('hide');
        } else {
            row.classList.remove('playingSession');
            row.querySelector('.btnSessionInfo').classList.add('hide');
        }

        if (session.ServerId && session.SupportedCommands.indexOf('DisplayMessage') !== -1) {
            row.querySelector('.btnSessionSendMessage').classList.remove('hide');
        } else {
            row.querySelector('.btnSessionSendMessage').classList.add('hide');
        }

        const btnSessionPlayPause = row.querySelector('.btnSessionPlayPause');

        if (session.ServerId && nowPlayingItem && session.SupportsRemoteControl) {
            btnSessionPlayPause.classList.remove('hide');
            row.querySelector('.btnSessionStop').classList.remove('hide');
        } else {
            btnSessionPlayPause.classList.add('hide');
            row.querySelector('.btnSessionStop').classList.add('hide');
        }

        const btnSessionPlayPauseIcon = btnSessionPlayPause.querySelector('.material-icons');
        btnSessionPlayPauseIcon.classList.remove('play_arrow', 'pause');
        btnSessionPlayPauseIcon.classList.add(session.PlayState?.IsPaused ? 'play_arrow' : 'pause');

        row.querySelector('.sessionNowPlayingTime').innerText = DashboardPage.getSessionNowPlayingTime(session);
        row.querySelector('.sessionUserName').innerHTML = DashboardPage.getUsersHtml(session);
        row.querySelector('.sessionAppSecondaryText').innerText = DashboardPage.getAppSecondaryText(session);
        const nowPlayingName = DashboardPage.getNowPlayingName(session);
        const nowPlayingInfoElem = row.querySelector('.sessionNowPlayingInfo');

        if (!(nowPlayingName.image && nowPlayingName.image == nowPlayingInfoElem.getAttribute('data-imgsrc'))) {
            nowPlayingInfoElem.innerHTML = nowPlayingName.html;
            nowPlayingInfoElem.setAttribute('data-imgsrc', nowPlayingName.image || '');
        }

        const playbackProgressElem = row.querySelector('.playbackProgress');
        const transcodingProgress = row.querySelector('.transcodingProgress');

        let percent = 100 * session?.PlayState?.PositionTicks / nowPlayingItem?.RunTimeTicks;
        playbackProgressElem.outerHTML = indicators.getProgressHtml(percent || 0, {
            containerClass: 'playbackProgress'
        });

        percent = session?.TranscodingInfo?.CompletionPercentage?.toFixed(1);
        transcodingProgress.outerHTML = indicators.getProgressHtml(percent || 0, {
            containerClass: 'transcodingProgress'
        });

        const imgUrl = DashboardPage.getNowPlayingImageUrl(nowPlayingItem) || '';
        const imgElem = row.querySelector('.sessionNowPlayingContent');

        if (imgUrl != imgElem.getAttribute('data-src')) {
            imgElem.style.backgroundImage = imgUrl ? "url('" + imgUrl + "')" : '';
            imgElem.setAttribute('data-src', imgUrl);

            if (imgUrl) {
                imgElem.classList.add('sessionNowPlayingContent-withbackground');
                row.querySelector('.sessionNowPlayingInnerContent').classList.add('darkenContent');
            } else {
                imgElem.classList.remove('sessionNowPlayingContent-withbackground');
                row.querySelector('.sessionNowPlayingInnerContent').classList.remove('darkenContent');
            }
        }
    },
    getClientImage: function (connection) {
        const iconUrl = imageHelper.getDeviceIcon(connection);
        return "<img src='" + iconUrl + "' />";
    },
    getNowPlayingImageUrl: function (item) {
        /* Screen width is multiplied by 0.2, as the there is currently no way to get the width of
            elements that aren't created yet. */
        if (item?.BackdropImageTags?.length) {
            return ApiClient.getScaledImageUrl(item.Id, {
                maxWidth: Math.round(dom.getScreenWidth() * 0.20),
                type: 'Backdrop',
                tag: item.BackdropImageTags[0]
            });
        }

        if (item?.ParentBackdropImageTags?.length) {
            return ApiClient.getScaledImageUrl(item.ParentBackdropItemId, {
                maxWidth: Math.round(dom.getScreenWidth() * 0.20),
                type: 'Backdrop',
                tag: item.ParentBackdropImageTags[0]
            });
        }

        if (item?.BackdropImageTag) {
            return ApiClient.getScaledImageUrl(item.BackdropItemId, {
                maxWidth: Math.round(dom.getScreenWidth() * 0.20),
                type: 'Backdrop',
                tag: item.BackdropImageTag
            });
        }

        const imageTags = item?.ImageTags || {};

        if (item && imageTags.Thumb) {
            return ApiClient.getScaledImageUrl(item.Id, {
                maxWidth: Math.round(dom.getScreenWidth() * 0.20),
                type: 'Thumb',
                tag: imageTags.Thumb
            });
        }

        if (item?.ParentThumbImageTag) {
            return ApiClient.getScaledImageUrl(item.ParentThumbItemId, {
                maxWidth: Math.round(dom.getScreenWidth() * 0.20),
                type: 'Thumb',
                tag: item.ParentThumbImageTag
            });
        }

        if (item?.ThumbImageTag) {
            return ApiClient.getScaledImageUrl(item.ThumbItemId, {
                maxWidth: Math.round(dom.getScreenWidth() * 0.20),
                type: 'Thumb',
                tag: item.ThumbImageTag
            });
        }

        if (item && imageTags.Primary) {
            return ApiClient.getScaledImageUrl(item.Id, {
                maxWidth: Math.round(dom.getScreenWidth() * 0.20),
                type: 'Primary',
                tag: imageTags.Primary
            });
        }

        if (item?.PrimaryImageTag) {
            return ApiClient.getScaledImageUrl(item.PrimaryImageItemId, {
                maxWidth: Math.round(dom.getScreenWidth() * 0.20),
                type: 'Primary',
                tag: item.PrimaryImageTag
            });
        }

        if (item?.AlbumPrimaryImageTag) {
            return ApiClient.getScaledImageUrl(item.AlbumId, {
                maxWidth: Math.round(dom.getScreenWidth() * 0.20),
                type: 'Primary',
                tag: item.AlbumPrimaryImageTag
            });
        }

        return null;
    },
    systemUpdateTaskKey: 'SystemUpdateTask',
    stopTask: function (btn, id) {
        const page = dom.parentWithClass(btn, 'page');
        ApiClient.stopScheduledTask(id).then(function () {
            pollForInfo(page, ApiClient);
        });
    },
    restart: function (event) {
        confirm({
            title: globalize.translate('Restart'),
            text: globalize.translate('MessageConfirmRestart'),
            confirmText: globalize.translate('Restart'),
            primary: 'delete'
        }).then(() => {
            const page = dom.parentWithClass(event.target, 'page');
            page.querySelector('#btnRestartServer').disabled = true;
            page.querySelector('#btnShutdown').disabled = true;
            ApiClient.restartServer();
        }).catch(() => {
            // Confirm dialog closed
        });
    },
    shutdown: function (event) {
        confirm({
            title: globalize.translate('ButtonShutdown'),
            text: globalize.translate('MessageConfirmShutdown'),
            confirmText: globalize.translate('ButtonShutdown'),
            primary: 'delete'
        }).then(() => {
            const page = dom.parentWithClass(event.target, 'page');
            page.querySelector('#btnRestartServer').disabled = true;
            page.querySelector('#btnShutdown').disabled = true;
            ApiClient.shutdownServer();
        }).catch(() => {
            // Confirm dialog closed
        });
    }
};

export default function (view) {
    function onRestartRequired(evt, apiClient) {
        console.debug('onRestartRequired not implemented', evt, apiClient);
    }

    function onServerShuttingDown(evt, apiClient) {
        console.debug('onServerShuttingDown not implemented', evt, apiClient);
    }

    function onServerRestarting(evt, apiClient) {
        console.debug('onServerRestarting not implemented', evt, apiClient);
    }

    function onPackageInstall(_, apiClient) {
        if (apiClient.serverId() === serverId) {
            pollForInfo(view, apiClient);
            reloadSystemInfo(view, apiClient);
        }
    }

    function onSessionsUpdate(evt, apiClient, info) {
        if (apiClient.serverId() === serverId) {
            renderInfo(view, info);
        }
    }

    function onScheduledTasksUpdate(evt, apiClient, info) {
        if (apiClient.serverId() === serverId) {
            renderRunningTasks(view, info);
        }
    }

    const serverId = ApiClient.serverId();
    view.querySelector('.activeDevices').addEventListener('click', onActiveDevicesClick);
    view.addEventListener('viewshow', function () {
        const page = this;
        const apiClient = ApiClient;

        if (apiClient) {
            loading.show();
            pollForInfo(page, apiClient);
            DashboardPage.startInterval(apiClient);
            Events.on(serverNotifications, 'RestartRequired', onRestartRequired);
            Events.on(serverNotifications, 'ServerShuttingDown', onServerShuttingDown);
            Events.on(serverNotifications, 'ServerRestarting', onServerRestarting);
            Events.on(serverNotifications, 'PackageInstalling', onPackageInstall);
            Events.on(serverNotifications, 'PackageInstallationCompleted', onPackageInstall);
            Events.on(serverNotifications, 'Sessions', onSessionsUpdate);
            Events.on(serverNotifications, 'ScheduledTasksInfo', onScheduledTasksUpdate);
            DashboardPage.lastAppUpdateCheck = null;
            reloadSystemInfo(page, ApiClient);

            if (!page.userActivityLog) {
                page.userActivityLog = new ActivityLog({
                    serverId: ApiClient.serverId(),
                    element: page.querySelector('.userActivityItems')
                });
            }

            if (!page.serverActivityLog) {
                page.serverActivityLog = new ActivityLog({
                    serverId: ApiClient.serverId(),
                    element: page.querySelector('.serverActivityItems')
                });
            }

            refreshActiveRecordings(view, apiClient);
            loading.hide();
        }

        taskButton({
            mode: 'on',
            taskKey: 'RefreshLibrary',
            button: page.querySelector('.btnRefresh')
        });

        page.querySelector('#btnRestartServer').addEventListener('click', DashboardPage.restart);
        page.querySelector('#btnShutdown').addEventListener('click', DashboardPage.shutdown);
    });

    view.addEventListener('viewbeforehide', function () {
        const apiClient = ApiClient;
        const page = this;

        Events.off(serverNotifications, 'RestartRequired', onRestartRequired);
        Events.off(serverNotifications, 'ServerShuttingDown', onServerShuttingDown);
        Events.off(serverNotifications, 'ServerRestarting', onServerRestarting);
        Events.off(serverNotifications, 'PackageInstalling', onPackageInstall);
        Events.off(serverNotifications, 'PackageInstallationCompleted', onPackageInstall);
        Events.off(serverNotifications, 'Sessions', onSessionsUpdate);
        Events.off(serverNotifications, 'ScheduledTasksInfo', onScheduledTasksUpdate);

        if (apiClient) {
            DashboardPage.stopInterval(apiClient);
        }

        taskButton({
            mode: 'off',
            taskKey: 'RefreshLibrary',
            button: page.querySelector('.btnRefresh')
        });

        page.querySelector('#btnRestartServer').removeEventListener('click', DashboardPage.restart);
        page.querySelector('#btnShutdown').removeEventListener('click', DashboardPage.shutdown);
    });
    view.addEventListener('viewdestroy', function () {
        const page = this;
        const userActivityLog = page.userActivityLog;

        if (userActivityLog) {
            userActivityLog.destroy();
        }

        const serverActivityLog = page.serverActivityLog;

        if (serverActivityLog) {
            serverActivityLog.destroy();
        }
    });
}

