import globalize from '../lib/globalize';
import { ServerConnections } from '../lib/jellyfin-apiclient';
import serverNotifications from '../scripts/serverNotifications';
import Events from '../utils/events';

export interface TaskButtonOptions {
    taskKey: string;
    button: HTMLButtonElement;
    panel?: HTMLElement;
    progressElem?: HTMLProgressElement | any;
    lastResultElem?: HTMLElement | any;
    mode?: 'on' | 'off';
}

function taskbutton(options: TaskButtonOptions): void {
    const button = options.button;
    const serverId = (window as any).ApiClient?.serverId?.();
    if (!serverId) return;
    let pollInterval: any;

    function pollTasks() {
        ServerConnections.getApiClient(serverId)?.getScheduledTasks({ IsEnabled: true }).then(updateTasks);
    }

    function updateTasks(tasks: any[]) {
        const task = tasks.find(t => t.Key === options.taskKey);
        if (options.panel) options.panel.classList.toggle('hide', !task);
        if (!task) return;

        button.disabled = task.State !== 'Idle';
        button.setAttribute('data-taskid', task.Id);

        if (options.progressElem) {
            options.progressElem.value = (task.CurrentProgressPercentage || 0).toFixed(1);
            options.progressElem.classList.toggle('hide', task.State !== 'Running');
        }

        if (options.lastResultElem) {
            const lastResult = task.LastExecutionResult ? task.LastExecutionResult.Status : '';
            let html = lastResult;
            if (lastResult === 'Failed')
                html = `<span style="color:#FF0000;">(${globalize.translate('LabelFailed')})</span>`;
            else if (lastResult === 'Cancelled')
                html = `<span style="color:#0026FF;">(${globalize.translate('LabelCancelled')})</span>`;
            else if (lastResult === 'Aborted')
                html = `<span style="color:#FF0000;">${globalize.translate('LabelAbortedByServerShutdown')}</span>`;
            options.lastResultElem.innerHTML = html;
        }
    }

    function onButtonClick() {
        const id = button.getAttribute('data-taskid');
        if (id) ServerConnections.getApiClient(serverId)?.startScheduledTask(id).then(pollTasks);
    }

    function onScheduledTasksUpdate(_e: any, apiClient: any, info: any[]) {
        if (apiClient.serverId() === serverId) updateTasks(info);
    }

    function startInterval() {
        const apiClient = ServerConnections.getApiClient(serverId);
        if (!apiClient) return;
        if (pollInterval) clearInterval(pollInterval);
        apiClient.sendMessage('ScheduledTasksInfoStart', '1000,1000');
        pollInterval = setInterval(() => {
            if (!apiClient.isMessageChannelOpen()) pollTasks();
        }, 5000);
    }

    function stopInterval() {
        ServerConnections.getApiClient(serverId)?.sendMessage('ScheduledTasksInfoStop', '');
        if (pollInterval) clearInterval(pollInterval);
    }

    if (options.mode === 'off') {
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
