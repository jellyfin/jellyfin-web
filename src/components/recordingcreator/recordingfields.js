import globalize from '../../lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import Events from '../../utils/events.ts';
import serverNotifications from '../../scripts/serverNotifications';
import loading from '../loading/loading';
import dom from '../../utils/dom';
import recordingHelper from './recordinghelper';

import '../../elements/emby-button/emby-button';
import '../../elements/emby-button/paper-icon-button-light';
import './recordingfields.scss';
import '../../styles/flexstyles.scss';
import toast from '../toast/toast';
import template from './recordingfields.template.html';

function loadData(parent, program) {
    if (program.IsSeries) {
        parent.querySelector('.recordSeriesContainer').classList.remove('hide');
    } else {
        parent.querySelector('.recordSeriesContainer').classList.add('hide');
    }

    if (program.SeriesTimerId) {
        parent.querySelector('.btnManageSeriesRecording').classList.remove('hide');
        parent.querySelector('.seriesRecordingButton .recordingIcon').classList.add('recordingIcon-active');
        parent.querySelector('.seriesRecordingButton .buttonText').innerHTML = globalize.translate('CancelSeries');
    } else {
        parent.querySelector('.btnManageSeriesRecording').classList.add('hide');
        parent.querySelector('.seriesRecordingButton .recordingIcon').classList.remove('recordingIcon-active');
        parent.querySelector('.seriesRecordingButton .buttonText').innerHTML = globalize.translate('RecordSeries');
    }

    if (program.TimerId && program.Status !== 'Cancelled') {
        parent.querySelector('.btnManageRecording').classList.remove('hide');
        parent.querySelector('.singleRecordingButton .recordingIcon').classList.add('recordingIcon-active');
        if (program.Status === 'InProgress') {
            parent.querySelector('.singleRecordingButton .buttonText').innerHTML = globalize.translate('StopRecording');
        } else {
            parent.querySelector('.singleRecordingButton .buttonText').innerHTML = globalize.translate('DoNotRecord');
        }
    } else {
        parent.querySelector('.btnManageRecording').classList.add('hide');
        parent.querySelector('.singleRecordingButton .recordingIcon').classList.remove('recordingIcon-active');
        parent.querySelector('.singleRecordingButton .buttonText').innerHTML = globalize.translate('Record');
    }
}

function fetchData(instance) {
    const options = instance.options;
    const apiClient = ServerConnections.getApiClient(options.serverId);

    options.parent.querySelector('.recordingFields').classList.remove('hide');
    return apiClient.getLiveTvProgram(options.programId, apiClient.getCurrentUserId()).then(function (program) {
        instance.TimerId = program.TimerId;
        instance.Status = program.Status;
        instance.SeriesTimerId = program.SeriesTimerId;
        loadData(options.parent, program);
    });
}

function onTimerChangedExternally(_e, _apiClient, data) {
    const options = this.options;

    if ((data.Id && this.TimerId === data.Id)
        || (data.ProgramId && options && options.programId === data.ProgramId)
    ) {
        this.refresh();
    }
}

function onSeriesTimerChangedExternally(_e, _apiClient, data) {
    const options = this.options;

    if ((data.Id && this.SeriesTimerId === data.Id)
        || (data.ProgramId && options && options.programId === data.ProgramId)
    ) {
        this.refresh();
    }
}

class RecordingEditor {
    constructor(options) {
        this.options = options;
        this.embed();

        const timerChangedHandler = onTimerChangedExternally.bind(this);
        this.timerChangedHandler = timerChangedHandler;

        Events.on(serverNotifications, 'TimerCreated', timerChangedHandler);
        Events.on(serverNotifications, 'TimerCancelled', timerChangedHandler);

        const seriesTimerChangedHandler = onSeriesTimerChangedExternally.bind(this);
        this.seriesTimerChangedHandler = seriesTimerChangedHandler;

        Events.on(serverNotifications, 'SeriesTimerCreated', seriesTimerChangedHandler);
        Events.on(serverNotifications, 'SeriesTimerCancelled', seriesTimerChangedHandler);
    }

    embed() {
        const self = this;
        return new Promise(function (resolve) {
            const options = self.options;
            const context = options.parent;
            context.innerHTML = globalize.translateHtml(template, 'core');

            context.querySelector('.singleRecordingButton').addEventListener('click', onRecordChange.bind(self));
            context.querySelector('.seriesRecordingButton').addEventListener('click', onRecordSeriesChange.bind(self));
            context.querySelector('.btnManageRecording').addEventListener('click', onManageRecordingClick.bind(self));
            context.querySelector('.btnManageSeriesRecording').addEventListener('click', onManageSeriesRecordingClick.bind(self));

            fetchData(self).then(resolve);
        });
    }

    hasChanged() {
        return this.changed;
    }

    refresh() {
        fetchData(this);
    }

    destroy() {
        const timerChangedHandler = this.timerChangedHandler;
        this.timerChangedHandler = null;

        Events.off(serverNotifications, 'TimerCreated', timerChangedHandler);
        Events.off(serverNotifications, 'TimerCancelled', timerChangedHandler);

        const seriesTimerChangedHandler = this.seriesTimerChangedHandler;
        this.seriesTimerChangedHandler = null;

        Events.off(serverNotifications, 'SeriesTimerCreated', seriesTimerChangedHandler);
        Events.off(serverNotifications, 'SeriesTimerCancelled', seriesTimerChangedHandler);
    }
}

function onManageRecordingClick() {
    const options = this.options;
    if (!this.TimerId || this.Status === 'Cancelled') {
        return;
    }

    const self = this;
    import('./recordingeditor').then(({ default: recordingEditor }) => {
        recordingEditor.show(self.TimerId, options.serverId, {
            enableCancel: false
        }).then(function () {
            self.changed = true;
        });
    });
}

function onManageSeriesRecordingClick() {
    const options = this.options;

    if (!this.SeriesTimerId) {
        return;
    }

    const self = this;

    import('./seriesrecordingeditor').then(({ default: seriesRecordingEditor }) => {
        seriesRecordingEditor.show(self.SeriesTimerId, options.serverId, {

            enableCancel: false

        }).then(function () {
            self.changed = true;
        });
    });
}

function onRecordChange(e) {
    this.changed = true;

    const self = this;
    const options = this.options;
    const apiClient = ServerConnections.getApiClient(options.serverId);

    const button = dom.parentWithTag(e.target, 'BUTTON');
    const isChecked = !button.querySelector('.material-icons').classList.contains('recordingIcon-active');

    const hasEnabledTimer = this.TimerId && this.Status !== 'Cancelled';

    if (isChecked) {
        if (!hasEnabledTimer) {
            loading.show();
            recordingHelper.createRecording(apiClient, options.programId, false).then(function () {
                Events.trigger(self, 'recordingchanged');
                fetchData(self);
                loading.hide();
            });
        }
    } else if (hasEnabledTimer) {
        loading.show();
        recordingHelper.cancelTimer(apiClient, this.TimerId, true).then(function () {
            Events.trigger(self, 'recordingchanged');
            fetchData(self);
            loading.hide();
        });
    }
}

function onRecordSeriesChange(e) {
    this.changed = true;

    const self = this;
    const options = this.options;
    const apiClient = ServerConnections.getApiClient(options.serverId);

    const button = dom.parentWithTag(e.target, 'BUTTON');
    const isChecked = !button.querySelector('.material-icons').classList.contains('recordingIcon-active');

    if (isChecked) {
        options.parent.querySelector('.recordSeriesContainer').classList.remove('hide');
        if (!this.SeriesTimerId) {
            const promise = this.TimerId ?
                recordingHelper.changeRecordingToSeries(apiClient, this.TimerId, options.programId) :
                recordingHelper.createRecording(apiClient, options.programId, true);
            promise.then(function () {
                fetchData(self);
            });
        }
    } else if (this.SeriesTimerId) {
        apiClient.cancelLiveTvSeriesTimer(this.SeriesTimerId).then(function () {
            toast(globalize.translate('RecordingCancelled'));
            fetchData(self);
        });
    }
}

export default RecordingEditor;
