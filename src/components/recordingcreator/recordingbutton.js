import dom from '../../scripts/dom';
import recordingHelper from './recordinghelper';
import '../../elements/emby-button/paper-icon-button-light';
import '../../elements/emby-button/emby-button';
import './recordingfields.scss';
import ServerConnections from '../ServerConnections';

function onRecordingButtonClick() {
    const item = this.item;

    if (item) {
        const serverId = item.ServerId;
        const programId = item.Id;
        const timerId = item.TimerId;
        const timerStatus = item.Status;
        const seriesTimerId = item.SeriesTimerId;

        const instance = this;

        recordingHelper.toggleRecording(serverId, programId, timerId, timerStatus, seriesTimerId).then(function () {
            instance.refresh(serverId, programId);
        });
    }
}

function setButtonIcon(button, icon) {
    const inner = button.querySelector('.material-icons');
    inner.classList.remove('fiber_smart_record');
    inner.classList.remove('fiber_manual_record');
    inner.classList.add(icon);
}

class RecordingButton {
    constructor(options) {
        this.options = options;

        const button = options.button;

        setButtonIcon(button, 'fiber_manual_record');

        if (options.item) {
            this.refreshItem(options.item);
        } else if (options.itemId && options.serverId) {
            this.refresh(options.itemId, options.serverId);
        }

        const clickFn = onRecordingButtonClick.bind(this);
        this.clickFn = clickFn;

        dom.addEventListener(button, 'click', clickFn, {
            passive: true
        });
    }

    refresh(serverId, itemId) {
        const apiClient = ServerConnections.getApiClient(serverId);
        const self = this;
        apiClient.getItem(apiClient.getCurrentUserId(), itemId).then(function (item) {
            self.refreshItem(item);
        });
    }

    refreshItem(item) {
        const options = this.options;
        const button = options.button;
        this.item = item;
        setButtonIcon(button, getIndicatorIcon(item));

        if (item.TimerId && (item.Status || 'Cancelled') !== 'Cancelled') {
            button.classList.add('recordingIcon-active');
        } else {
            button.classList.remove('recordingIcon-active');
        }
    }

    destroy() {
        const options = this.options;

        if (options) {
            const button = options.button;

            const clickFn = this.clickFn;

            if (clickFn) {
                dom.removeEventListener(button, 'click', clickFn, {
                    passive: true
                });
            }
        }

        this.options = null;
        this.item = null;
    }
}

function getIndicatorIcon(item) {
    let status;

    if (item.Type === 'SeriesTimer') {
        return 'fiber_smart_record';
    } else if (item.TimerId || item.SeriesTimerId) {
        status = item.Status || 'Cancelled';
    } else if (item.Type === 'Timer') {
        status = item.Status;
    } else {
        return 'fiber_manual_record';
    }

    if (item.SeriesTimerId && status !== 'Cancelled') {
        return 'fiber_smart_record';
    }

    return 'fiber_manual_record';
}

export default RecordingButton;
