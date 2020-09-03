import globalize from 'globalize';
import serverNotifications from 'serverNotifications';
import loading from 'loading';
import dom from 'dom';
import recordingHelper from 'recordingHelper';
import events from 'events';
import 'paper-icon-button-light';
import 'emby-button';
import 'css!./recordingfields';
import 'flexStyles';

/*eslint prefer-const: "error"*/

function loadData(parent, program, apiClient) {
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
    const apiClient = window.connectionManager.getApiClient(options.serverId);

    options.parent.querySelector('.recordingFields').classList.remove('hide');
    return apiClient.getLiveTvProgram(options.programId, apiClient.getCurrentUserId()).then(function (program) {
        instance.TimerId = program.TimerId;
        instance.Status = program.Status;
        instance.SeriesTimerId = program.SeriesTimerId;
        loadData(options.parent, program, apiClient);
    });
}

function onTimerChangedExternally(e, apiClient, data) {
    const options = this.options;
    let refresh = false;

    if (data.Id) {
        if (this.TimerId === data.Id) {
            refresh = true;
        }
    }
    if (data.ProgramId && options) {
        if (options.programId === data.ProgramId) {
            refresh = true;
        }
    }

    if (refresh) {
        this.refresh();
    }
}

function onSeriesTimerChangedExternally(e, apiClient, data) {
    const options = this.options;
    let refresh = false;

    if (data.Id) {
        if (this.SeriesTimerId === data.Id) {
            refresh = true;
        }
    }
    if (data.ProgramId && options) {
        if (options.programId === data.ProgramId) {
            refresh = true;
        }
    }

    if (refresh) {
        this.refresh();
    }
}

class RecordingEditor {
    constructor(options) {
        this.options = options;
        this.embed();

        const timerChangedHandler = onTimerChangedExternally.bind(this);
        this.timerChangedHandler = timerChangedHandler;

        events.on(serverNotifications, 'TimerCreated', timerChangedHandler);
        events.on(serverNotifications, 'TimerCancelled', timerChangedHandler);

        const seriesTimerChangedHandler = onSeriesTimerChangedExternally.bind(this);
        this.seriesTimerChangedHandler = seriesTimerChangedHandler;

        events.on(serverNotifications, 'SeriesTimerCreated', seriesTimerChangedHandler);
        events.on(serverNotifications, 'SeriesTimerCancelled', seriesTimerChangedHandler);
    }

    embed() {
        const self = this;
        return new Promise(function (resolve, reject) {
            import('text!./recordingfields.template.html').then(({default: template}) => {
                const options = self.options;
                const context = options.parent;
                context.innerHTML = globalize.translateHtml(template, 'core');

                context.querySelector('.singleRecordingButton').addEventListener('click', onRecordChange.bind(self));
                context.querySelector('.seriesRecordingButton').addEventListener('click', onRecordSeriesChange.bind(self));
                context.querySelector('.btnManageRecording').addEventListener('click', onManageRecordingClick.bind(self));
                context.querySelector('.btnManageSeriesRecording').addEventListener('click', onManageSeriesRecordingClick.bind(self));

                fetchData(self).then(resolve);
            });
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

        events.off(serverNotifications, 'TimerCreated', timerChangedHandler);
        events.off(serverNotifications, 'TimerCancelled', timerChangedHandler);

        const seriesTimerChangedHandler = this.seriesTimerChangedHandler;
        this.seriesTimerChangedHandler = null;

        events.off(serverNotifications, 'SeriesTimerCreated', seriesTimerChangedHandler);
        events.off(serverNotifications, 'SeriesTimerCancelled', seriesTimerChangedHandler);
    }
}

function onManageRecordingClick(e) {
    const options = this.options;
    if (!this.TimerId || this.Status === 'Cancelled') {
        return;
    }

    const self = this;
    import('recordingEditor').then(({default: recordingEditor}) => {
        recordingEditor.show(self.TimerId, options.serverId, {
            enableCancel: false
        }).then(function () {
            self.changed = true;
        });
    });
}

function onManageSeriesRecordingClick(e) {
    const options = this.options;

    if (!this.SeriesTimerId) {
        return;
    }

    const self = this;

    import('seriesRecordingEditor').then(({default: seriesRecordingEditor}) => {
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
    const apiClient = window.connectionManager.getApiClient(options.serverId);

    const button = dom.parentWithTag(e.target, 'BUTTON');
    const isChecked = !button.querySelector('.material-icons').classList.contains('recordingIcon-active');

    const hasEnabledTimer = this.TimerId && this.Status !== 'Cancelled';

    if (isChecked) {
        if (!hasEnabledTimer) {
            loading.show();
            recordingHelper.createRecording(apiClient, options.programId, false).then(function () {
                events.trigger(self, 'recordingchanged');
                fetchData(self);
                loading.hide();
            });
        }
    } else {
        if (hasEnabledTimer) {
            loading.show();
            recordingHelper.cancelTimer(apiClient, this.TimerId, true).then(function () {
                events.trigger(self, 'recordingchanged');
                fetchData(self);
                loading.hide();
            });
        }
    }
}

function sendToast(msg) {
    import('toast').then(({default: toast}) => {
        toast(msg);
    });
}

function onRecordSeriesChange(e) {
    this.changed = true;

    const self = this;
    const options = this.options;
    const apiClient = window.connectionManager.getApiClient(options.serverId);

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
    } else {
        if (this.SeriesTimerId) {
            apiClient.cancelLiveTvSeriesTimer(this.SeriesTimerId).then(function () {
                sendToast(globalize.translate('RecordingCancelled'));
                fetchData(self);
            });
        }
    }
}

export default RecordingEditor;
