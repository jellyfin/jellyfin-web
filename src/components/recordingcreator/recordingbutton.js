define(['globalize', 'connectionManager', 'require', 'loading', 'apphost', 'dom', 'recordingHelper', 'events', 'paper-icon-button-light', 'emby-button', 'css!./recordingfields'], function (globalize, connectionManager, require, loading, appHost, dom, recordingHelper, events) {
    'use strict';

    function onRecordingButtonClick(e) {

        var item = this.item;

        if (item) {

            var serverId = item.ServerId;
            var programId = item.Id;
            var timerId = item.TimerId;
            var timerStatus = item.Status;
            var seriesTimerId = item.SeriesTimerId;

            var instance = this;

            recordingHelper.toggleRecording(serverId, programId, timerId, timerStatus, seriesTimerId).then(function () {
                instance.refresh(serverId, programId);
            });
        }
    }

    function setButtonIcon(button, icon) {
        var inner = button.querySelector('i');
        inner.classList.remove('fiber_smart_record');
        inner.classList.remove('fiber_manual_record');
        inner.classList.add(icon);
    }

    function RecordingButton(options) {
        this.options = options;

        var button = options.button;

        setButtonIcon(button, 'fiber_manual_record');

        if (options.item) {
            this.refreshItem(options.item);
        } else if (options.itemId && options.serverId) {
            this.refresh(options.itemId, options.serverId);
        }

        var clickFn = onRecordingButtonClick.bind(this);
        this.clickFn = clickFn;

        dom.addEventListener(button, 'click', clickFn, {
            passive: true
        });
    }

    function getIndicatorIcon(item) {

        var status;

        if (item.Type === 'SeriesTimer') {
            return 'fiber_smart_record';
        } else if (item.TimerId || item.SeriesTimerId) {

            status = item.Status || 'Cancelled';
        } else if (item.Type === 'Timer') {

            status = item.Status;
        } else {
            return 'fiber_manual_record';
        }

        if (item.SeriesTimerId) {

            if (status !== 'Cancelled') {
                return 'fiber_smart_record';
            }
        }

        return 'fiber_manual_record';
    }

    RecordingButton.prototype.refresh = function (serverId, itemId) {

        var apiClient = connectionManager.getApiClient(serverId);
        var self = this;
        apiClient.getItem(apiClient.getCurrentUserId(), itemId).then(function (item) {
            self.refreshItem(item);
        });
    };

    RecordingButton.prototype.refreshItem = function (item) {

        var options = this.options;
        var button = options.button;
        this.item = item;
        setButtonIcon(button, getIndicatorIcon(item));

        if (item.TimerId && (item.Status || 'Cancelled') !== 'Cancelled') {
            button.classList.add('recordingIcon-active');
        } else {
            button.classList.remove('recordingIcon-active');
        }
    };

    RecordingButton.prototype.destroy = function () {

        var options = this.options;

        if (options) {
            var button = options.button;

            var clickFn = this.clickFn;

            if (clickFn) {
                dom.removeEventListener(button, 'click', clickFn, {
                    passive: true
                });
            }
        }

        this.options = null;
        this.item = null;
    };

    return RecordingButton;
});
