import 'jquery';
import loading from '../../../components/loading/loading';
import globalize from '../../../scripts/globalize';
import serverNotifications from '../../../scripts/serverNotifications';
import { formatDistance, formatDistanceToNow } from 'date-fns';
import { getLocale, getLocaleWithSuffix } from '../../../utils/dateFnsLocale.ts';
import Events from '../../../utils/events.ts';

import '../../../components/listview/listview.scss';
import '../../../elements/emby-button/emby-button';

function reloadList(page) {
    ApiClient.getScheduledTasks({
        isHidden: false
    }).then(function(tasks) {
        populateList(page, tasks);
        loading.hide();
    });
}

function populateList(page, tasks) {
    tasks = tasks.sort(function(a, b) {
        a = a.Category + ' ' + a.Name;
        b = b.Category + ' ' + b.Name;
        if (a > b) {
            return 1;
        } else if (a < b) {
            return -1;
        } else {
            return 0;
        }
    });

    let currentCategory;
    let html = '';
    for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        if (task.Category != currentCategory) {
            currentCategory = task.Category;
            if (currentCategory) {
                html += '</div>';
                html += '</div>';
            }
            html += '<div class="verticalSection verticalSection-extrabottompadding">';
            html += '<div class="sectionTitleContainer" style="margin-bottom:1em;">';
            html += '<h2 class="sectionTitle">';
            html += currentCategory;
            html += '</h2>';
            if (i === 0) {
                html += '<a is="emby-linkbutton" class="raised button-alt headerHelpButton" target="_blank" href="https://jellyfin.org/docs/general/server/tasks">' + globalize.translate('Help') + '</a>';
            }
            html += '</div>';
            html += '<div class="paperList">';
        }
        html += '<div class="listItem listItem-border scheduledTaskPaperIconItem" data-status="' + task.State + '">';
        html += "<a is='emby-linkbutton' style='margin:0;padding:0;' class='clearLink listItemIconContainer' href='/dashboard/tasks/edit?id=" + task.Id + "'>";
        html += '<span class="material-icons listItemIcon schedule" aria-hidden="true"></span>';
        html += '</a>';
        html += '<div class="listItemBody two-line">';
        const textAlignStyle = globalize.getIsRTL() ? 'right' : 'left';
        html += "<a class='clearLink' style='margin:0;padding:0;display:block;text-align:" + textAlignStyle + ";' is='emby-linkbutton' href='/dashboard/tasks/edit?id=" + task.Id + "'>";
        html += "<h3 class='listItemBodyText'>" + task.Name + '</h3>';
        html += "<div class='secondary listItemBodyText' id='taskProgress" + task.Id + "'>" + getTaskProgressHtml(task) + '</div>';
        html += '</a>';
        html += '</div>';
        if (task.State === 'Running') {
            html += '<button type="button" is="paper-icon-button-light" id="btnTask' + task.Id + '" class="btnStopTask" data-taskid="' + task.Id + '" title="' + globalize.translate('ButtonStop') + '"><span class="material-icons stop" aria-hidden="true"></span></button>';
        } else if (task.State === 'Idle') {
            html += '<button type="button" is="paper-icon-button-light" id="btnTask' + task.Id + '" class="btnStartTask" data-taskid="' + task.Id + '" title="' + globalize.translate('ButtonStart') + '"><span class="material-icons play_arrow" aria-hidden="true"></span></button>';
        }
        html += '</div>';
    }
    if (tasks.length) {
        html += '</div>';
        html += '</div>';
    }
    page.querySelector('.divScheduledTasks').innerHTML = html;
}

function getTaskProgressHtml(task) {
    let html = '';
    if (task.State === 'Idle') {
        if (task.LastExecutionResult) {
            const endtime = Date.parse(task.LastExecutionResult.EndTimeUtc);
            const starttime = Date.parse(task.LastExecutionResult.StartTimeUtc);
            html += globalize.translate('LabelScheduledTaskLastRan', formatDistanceToNow(endtime, getLocaleWithSuffix()),
                formatDistance(starttime, endtime, { locale: getLocale() }));
            if (task.LastExecutionResult.Status === 'Failed') {
                html += " <span style='color:#FF0000;'>(" + globalize.translate('LabelFailed') + ')</span>';
            } else if (task.LastExecutionResult.Status === 'Cancelled') {
                html += " <span style='color:#0026FF;'>(" + globalize.translate('LabelCancelled') + ')</span>';
            } else if (task.LastExecutionResult.Status === 'Aborted') {
                html += " <span style='color:#FF0000;'>" + globalize.translate('LabelAbortedByServerShutdown') + '</span>';
            }
        }
    } else if (task.State === 'Running') {
        const progress = (task.CurrentProgressPercentage || 0).toFixed(1);
        html += '<div style="display:flex;align-items:center;">';
        html += '<div class="taskProgressOuter" title="' + progress + '%" style="flex-grow:1;">';
        html += '<div class="taskProgressInner" style="width:' + progress + '%;">';
        html += '</div>';
        html += '</div>';
        html += "<span style='color:#00a4dc;margin-left:5px;'>" + progress + '%</span>';
        html += '</div>';
    } else {
        html += "<span style='color:#FF0000;'>" + globalize.translate('LabelStopping') + '</span>';
    }
    return html;
}

function setTaskButtonIcon(button, icon) {
    const inner = button.querySelector('.material-icons');
    inner.classList.remove('stop', 'play_arrow');
    inner.classList.add(icon);
}

function updateTaskButton(elem, state) {
    if (state === 'Running') {
        elem.classList.remove('btnStartTask');
        elem.classList.add('btnStopTask');
        setTaskButtonIcon(elem, 'stop');
        elem.title = globalize.translate('ButtonStop');
    } else if (state === 'Idle') {
        elem.classList.add('btnStartTask');
        elem.classList.remove('btnStopTask');
        setTaskButtonIcon(elem, 'play_arrow');
        elem.title = globalize.translate('ButtonStart');
    }
    $(elem).parents('.listItem')[0].setAttribute('data-status', state);
}

export default function(view) {
    function updateTasks(tasks) {
        for (const task of tasks) {
            view.querySelector('#taskProgress' + task.Id).innerHTML = getTaskProgressHtml(task);
            updateTaskButton(view.querySelector('#btnTask' + task.Id), task.State);
        }
    }

    function onPollIntervalFired() {
        if (!ApiClient.isMessageChannelOpen()) {
            reloadList(view);
        }
    }

    function onScheduledTasksUpdate(e, apiClient, info) {
        if (apiClient.serverId() === serverId) {
            updateTasks(info);
        }
    }

    function startInterval() {
        ApiClient.sendMessage('ScheduledTasksInfoStart', '1000,1000');
        pollInterval && clearInterval(pollInterval);
        pollInterval = setInterval(onPollIntervalFired, 1e4);
    }

    function stopInterval() {
        ApiClient.sendMessage('ScheduledTasksInfoStop');
        pollInterval && clearInterval(pollInterval);
    }

    let pollInterval;
    const serverId = ApiClient.serverId();

    $('.divScheduledTasks', view).on('click', '.btnStartTask', function() {
        const button = this;
        const id = button.getAttribute('data-taskid');
        ApiClient.startScheduledTask(id).then(function() {
            updateTaskButton(button, 'Running');
            reloadList(view);
        });
    });

    $('.divScheduledTasks', view).on('click', '.btnStopTask', function() {
        const button = this;
        const id = button.getAttribute('data-taskid');
        ApiClient.stopScheduledTask(id).then(function() {
            updateTaskButton(button, '');
            reloadList(view);
        });
    });

    view.addEventListener('viewbeforehide', function() {
        Events.off(serverNotifications, 'ScheduledTasksInfo', onScheduledTasksUpdate);
        stopInterval();
    });

    view.addEventListener('viewshow', function() {
        loading.show();
        startInterval();
        reloadList(view);
        Events.on(serverNotifications, 'ScheduledTasksInfo', onScheduledTasksUpdate);
    });
}

