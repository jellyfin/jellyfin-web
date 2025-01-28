import loading from 'components/loading/loading';
import datetime from 'scripts/datetime';
import dom from 'scripts/dom';
import globalize from 'lib/globalize';
import 'elements/emby-input/emby-input';
import 'elements/emby-button/emby-button';
import 'elements/emby-select/emby-select';
import confirm from 'components/confirm/confirm';
import { getParameterByName } from 'utils/url.ts';

function fillTimeOfDay(select) {
    const options = [];

    for (let i = 0; i < 86400000; i += 900000) {
        options.push({
            name: ScheduledTaskPage.getDisplayTime(i * 10000),
            value: i * 10000
        });
    }

    select.innerHTML = options.map(function (o) {
        return '<option value="' + o.value + '">' + o.name + '</option>';
    }).join('');
}

const ScheduledTaskPage = {
    refreshScheduledTask: function (view) {
        loading.show();
        const id = getParameterByName('id');
        ApiClient.getScheduledTask(id).then(function (task) {
            ScheduledTaskPage.loadScheduledTask(view, task);
        });
    },
    loadScheduledTask: function (view, task) {
        view.querySelector('.taskName').innerHTML = task.Name;
        view.querySelector('#pTaskDescription').innerHTML = task.Description;

        import('components/listview/listview.scss').then(() => {
            ScheduledTaskPage.loadTaskTriggers(view, task);
        });

        loading.hide();
    },
    loadTaskTriggers: function (context, task) {
        let html = '';
        html += '<div class="paperList">';

        for (let i = 0, length = task.Triggers.length; i < length; i++) {
            const trigger = task.Triggers[i];

            html += '<div class="listItem listItem-border">';
            html += '<span class="material-icons listItemIcon schedule" aria-hidden="true"></span>';
            if (trigger.MaxRuntimeTicks) {
                html += '<div class="listItemBody two-line">';
            } else {
                html += '<div class="listItemBody">';
            }
            html += "<div class='listItemBodyText'>" + ScheduledTaskPage.getTriggerFriendlyName(trigger) + '</div>';
            if (trigger.MaxRuntimeTicks) {
                html += '<div class="listItemBodyText secondary">';
                const hours = trigger.MaxRuntimeTicks / 36e9;
                if (hours == 1) {
                    html += globalize.translate('ValueTimeLimitSingleHour');
                } else {
                    html += globalize.translate('ValueTimeLimitMultiHour', hours);
                }
                html += '</div>';
            }

            html += '</div>';
            html += '<button class="btnDeleteTrigger" data-index="' + i + '" type="button" is="paper-icon-button-light" title="' + globalize.translate('Delete') + '"><span class="material-icons delete" aria-hidden="true"></span></button>';
            html += '</div>';
        }

        html += '</div>';
        context.querySelector('.taskTriggers').innerHTML = html;
    },
    // TODO: Replace this mess with date-fns and remove datetime completely
    getTriggerFriendlyName: function (trigger) {
        if (trigger.Type == 'DailyTrigger') {
            return globalize.translate('DailyAt', ScheduledTaskPage.getDisplayTime(trigger.TimeOfDayTicks));
        }

        if (trigger.Type == 'WeeklyTrigger') {
            // TODO: The day of week isn't localised as well
            return globalize.translate('WeeklyAt', trigger.DayOfWeek, ScheduledTaskPage.getDisplayTime(trigger.TimeOfDayTicks));
        }

        if (trigger.Type == 'SystemEventTrigger' && trigger.SystemEvent == 'WakeFromSleep') {
            return globalize.translate('OnWakeFromSleep');
        }

        if (trigger.Type == 'IntervalTrigger') {
            const hours = trigger.IntervalTicks / 36e9;

            if (hours == 0.25) {
                return globalize.translate('EveryXMinutes', '15');
            }
            if (hours == 0.5) {
                return globalize.translate('EveryXMinutes', '30');
            }
            if (hours == 0.75) {
                return globalize.translate('EveryXMinutes', '45');
            }
            if (hours == 1) {
                return globalize.translate('EveryHour');
            }

            return globalize.translate('EveryXHours', hours);
        }

        if (trigger.Type == 'StartupTrigger') {
            return globalize.translate('OnApplicationStartup');
        }

        return trigger.Type;
    },
    getDisplayTime: function (ticks) {
        const ms = ticks / 1e4;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        now.setTime(now.getTime() + ms);
        return datetime.getDisplayTime(now);
    },
    showAddTriggerPopup: function (view) {
        view.querySelector('#selectTriggerType').value = 'DailyTrigger';
        view.querySelector('#selectTriggerType').dispatchEvent(new CustomEvent('change', {}));
        view.querySelector('#popupAddTrigger').classList.remove('hide');
    },
    confirmDeleteTrigger: function (view, index) {
        confirm(globalize.translate('MessageDeleteTaskTrigger'), globalize.translate('HeaderDeleteTaskTrigger')).then(function () {
            ScheduledTaskPage.deleteTrigger(view, index);
        });
    },
    deleteTrigger: function (view, index) {
        loading.show();
        const id = getParameterByName('id');
        ApiClient.getScheduledTask(id).then(function (task) {
            task.Triggers.splice(index, 1);
            ApiClient.updateScheduledTaskTriggers(task.Id, task.Triggers).then(function () {
                ScheduledTaskPage.refreshScheduledTask(view);
            });
        });
    },
    refreshTriggerFields: function (page, triggerType) {
        if (triggerType == 'DailyTrigger') {
            page.querySelector('#fldTimeOfDay').classList.remove('hide');
            page.querySelector('#fldDayOfWeek').classList.add('hide');
            page.querySelector('#fldSelectSystemEvent').classList.add('hide');
            page.querySelector('#fldSelectInterval').classList.add('hide');
            page.querySelector('#selectTimeOfDay').setAttribute('required', 'required');
        } else if (triggerType == 'WeeklyTrigger') {
            page.querySelector('#fldTimeOfDay').classList.remove('hide');
            page.querySelector('#fldDayOfWeek').classList.remove('hide');
            page.querySelector('#fldSelectSystemEvent').classList.add('hide');
            page.querySelector('#fldSelectInterval').classList.add('hide');
            page.querySelector('#selectTimeOfDay').setAttribute('required', 'required');
        } else if (triggerType == 'SystemEventTrigger') {
            page.querySelector('#fldTimeOfDay').classList.add('hide');
            page.querySelector('#fldDayOfWeek').classList.add('hide');
            page.querySelector('#fldSelectSystemEvent').classList.remove('hide');
            page.querySelector('#fldSelectInterval').classList.add('hide');
            page.querySelector('#selectTimeOfDay').removeAttribute('required');
        } else if (triggerType == 'IntervalTrigger') {
            page.querySelector('#fldTimeOfDay').classList.add('hide');
            page.querySelector('#fldDayOfWeek').classList.add('hide');
            page.querySelector('#fldSelectSystemEvent').classList.add('hide');
            page.querySelector('#fldSelectInterval').classList.remove('hide');
            page.querySelector('#selectTimeOfDay').removeAttribute('required');
        } else if (triggerType == 'StartupTrigger') {
            page.querySelector('#fldTimeOfDay').classList.add('hide');
            page.querySelector('#fldDayOfWeek').classList.add('hide');
            page.querySelector('#fldSelectSystemEvent').classList.add('hide');
            page.querySelector('#fldSelectInterval').classList.add('hide');
            page.querySelector('#selectTimeOfDay').removeAttribute('required');
        }
    },
    getTriggerToAdd: function (page) {
        const trigger = {
            Type: page.querySelector('#selectTriggerType').value
        };

        if (trigger.Type == 'DailyTrigger') {
            trigger.TimeOfDayTicks = page.querySelector('#selectTimeOfDay').value;
        } else if (trigger.Type == 'WeeklyTrigger') {
            trigger.DayOfWeek = page.querySelector('#selectDayOfWeek').value;
            trigger.TimeOfDayTicks = page.querySelector('#selectTimeOfDay').value;
        } else if (trigger.Type == 'SystemEventTrigger') {
            trigger.SystemEvent = page.querySelector('#selectSystemEvent').value;
        } else if (trigger.Type == 'IntervalTrigger') {
            trigger.IntervalTicks = page.querySelector('#selectInterval').value;
        }

        let timeLimit = page.querySelector('#txtTimeLimit').value || '0';
        timeLimit = parseFloat(timeLimit) * 3600000;

        trigger.MaxRuntimeTicks = timeLimit * 1e4 || null;

        return trigger;
    }
};
export default function (view) {
    function onSubmit(e) {
        loading.show();
        const id = getParameterByName('id');
        ApiClient.getScheduledTask(id).then(function (task) {
            task.Triggers.push(ScheduledTaskPage.getTriggerToAdd(view));
            ApiClient.updateScheduledTaskTriggers(task.Id, task.Triggers).then(function () {
                document.querySelector('#popupAddTrigger').classList.add('hide');
                ScheduledTaskPage.refreshScheduledTask(view);
            });
        });
        e.preventDefault();
    }

    view.querySelector('.addTriggerForm').addEventListener('submit', onSubmit);
    fillTimeOfDay(view.querySelector('#selectTimeOfDay'));
    view.querySelector('#popupAddTrigger').parentNode.trigger(new Event('create'));
    view.querySelector('.selectTriggerType').addEventListener('change', function () {
        ScheduledTaskPage.refreshTriggerFields(view, this.value);
    });
    view.querySelector('.btnAddTrigger').addEventListener('click', function () {
        ScheduledTaskPage.showAddTriggerPopup(view);
    });
    view.addEventListener('click', function (e) {
        const btnDeleteTrigger = dom.parentWithClass(e.target, 'btnDeleteTrigger');

        if (btnDeleteTrigger) {
            ScheduledTaskPage.confirmDeleteTrigger(view, parseInt(btnDeleteTrigger.getAttribute('data-index'), 10));
        }
    });
    view.addEventListener('viewshow', function () {
        ScheduledTaskPage.refreshScheduledTask(view);
    });
}

