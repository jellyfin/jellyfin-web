
import globalize from '@/lib/globalize';
import { ServerConnections } from '@/lib/jellyfin-apiclient';
import serverNotifications from '@/scripts/serverNotifications';
import Events from '@/utils/events.ts';

import '@/elements/emby-button/emby-button';

function taskbutton(options) {
    function pollTasks() {
        ServerConnections.getApiClient(serverId).getScheduledTasks({
            IsEnabled: true
        }).then(updateTasks);
    }

    function updateTasks(tasks) {
        const task = tasks.filter(function (t) {
            return t.Key == options.taskKey;
        })[0];

        if (options.panel) {
            if (task) {
                options.panel.classList.remove('hide');
            } else {
                options.panel.classList.add('hide');
            }
        }

        if (!task) {
            return;
        }

        if (task.State == 'Idle') {
            button.removeAttribute('disabled');
        } else {
            button.setAttribute('disabled', 'disabled');
        }

        button.setAttribute('data-taskid', task.Id);
        const progress = (task.CurrentProgressPercentage || 0).toFixed(1);

        if (options.progressElem) {
            options.progressElem.value = progress;

            if (task.State == 'Running') {
                options.progressElem.classList.remove('hide');
            } else {
                options.progressElem.classList.add('hide');
            }
        }

        if (options.lastResultElem) {
            const lastResult = task.LastExecutionResult ? task.LastExecutionResult.Status : '';

            if (lastResult == 'Failed') {
                options.lastResultElem.html('<span style="color:#FF0000;">(' + globalize.translate('LabelFailed') + ')</span>');
            } else if (lastResult == 'Cancelled') {
                options.lastResultElem.html('<span style="color:#0026FF;">(' + globalize.translate('LabelCancelled') + ')</span>');
            } else if (lastResult == 'Aborted') {
                options.lastResultElem.html('<span style="color:#FF0000;">' + globalize.translate('LabelAbortedByServerShutdown') + '</span>');
            } else {
                options.lastResultElem.html(lastResult);
            }
        }
    }

    function onScheduledTaskMessageConfirmed(id) {
        ServerConnections.getApiClient(serverId).startScheduledTask(id).then(pollTasks);
    }

    function onButtonClick() {
        onScheduledTaskMessageConfirmed(this.getAttribute('data-taskid'));
    }

    function onScheduledTasksUpdate(e, apiClient, info) {
        if (apiClient.serverId() === serverId) {
            updateTasks(info);
        }
    }

    let pollInterval;
    const button = options.button;
    const serverId = ApiClient.serverId();

    function onPollIntervalFired() {
        if (!ServerConnections.getApiClient(serverId).isMessageChannelOpen()) {
            pollTasks();
        }
    }

    function startInterval() {
        const apiClient = ServerConnections.getApiClient(serverId);

        if (pollInterval) {
            clearInterval(pollInterval);
        }
        apiClient.sendMessage('ScheduledTasksInfoStart', '1000,1000');
        pollInterval = setInterval(onPollIntervalFired, 5000);
    }

    function stopInterval() {
        ServerConnections.getApiClient(serverId).sendMessage('ScheduledTasksInfoStop');

        if (pollInterval) {
            clearInterval(pollInterval);
        }
    }

    if (options.panel) {
        options.panel.classList.add('hide');
    }

    if (options.mode == 'off') {
        button.removeEventListener('click', onButtonClick);
        Events.off(serverNotifications, 'ScheduledTasksInfo', onScheduledTasksUpdate);
        stopInterval();
    } else {
        button.addEventListener('click', onButtonClick);
        pollTasks();
        startInterval();
        Events.on(serverNotifications, 'ScheduledTasksInfo', onScheduledTasksUpdate);
    }
}

export default taskbutton;
