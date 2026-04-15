
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { OutboundWebSocketMessageType } from '@jellyfin/sdk/lib/websocket';

import 'elements/emby-button/emby-button';

function taskbutton(options) {
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

    function onScheduledTasksUpdate({ Data }) {
        const apiClient = ServerConnections.getApiClient(serverId);
        if (apiClient.serverId() === serverId) {
            updateTasks(Data ?? []);
        }
    }

    let unsubscribe;
    const button = options.button;
    const serverId = ApiClient.serverId();

    function subscribe() {
        const apiClient = ServerConnections.getApiClient(serverId);
        return apiClient.subscribe([OutboundWebSocketMessageType.ScheduledTasksInfo], onScheduledTasksUpdate);
    }

    function startSubscription() {
        if (unsubscribe) {
            unsubscribe();
        }
        unsubscribe = subscribe();
    }

    function stopSubscription() {
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
        }
    }

    if (options.panel) {
        options.panel.classList.add('hide');
    }

    if (options.mode == 'off') {
        button.removeEventListener('click', onButtonClick);
        stopSubscription();
    } else {
        button.addEventListener('click', onButtonClick);
        pollTasks();
        startSubscription();
    }
}

export default taskbutton;
