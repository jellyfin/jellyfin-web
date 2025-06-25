/**
 * Module for controlling user parental control from.
 * @module components/accessSchedule/accessSchedule
 */

import dialogHelper from '../dialogHelper/dialogHelper';
import datetime from '../../scripts/datetime';
import globalize from '../../lib/globalize';
import '../../elements/emby-select/emby-select';
import '../../elements/emby-button/paper-icon-button-light';
import '../formdialog.scss';
import template from './accessSchedule.template.html';

function getDisplayTime(hours: number) {
    let minutes = 0;
    const pct = hours % 1;

    if (pct) {
        minutes = parseInt(60 * pct, 10);
    }

    return datetime.getDisplayTime(new Date(2000, 1, 1, hours, minutes, 0, 0));
}

function populateHours(context: HTMLElement) {
    let html = '';

    for (let i = 0; i < 24; i += 0.5) {
        html += `<option value="${i}">${getDisplayTime(i)}</option>`;
    }

    html += `<option value="24">${getDisplayTime(0)}</option>`;
    context.querySelector('#selectStart')!.innerHTML = html;
    context.querySelector('#selectEnd')!.innerHTML = html;
}

function loadSchedule(context: HTMLElement, { DayOfWeek, StartHour, EndHour }) {
    context.querySelector<HTMLSelectElement>('#selectDay')!.value = DayOfWeek || 'Sunday';
    context.querySelector<HTMLSelectElement>('#selectStart')!.value = StartHour || 0;
    context.querySelector<HTMLSelectElement>('#selectEnd')!.value = EndHour || 0;
}

function submitSchedule(context: HTMLElement, options) {
    const updatedSchedule = {
        DayOfWeek: context.querySelector<HTMLSelectElement>('#selectDay')!.value,
        StartHour: context.querySelector<HTMLSelectElement>('#selectStart')!.value,
        EndHour: context.querySelector<HTMLSelectElement>('#selectEnd')!.value
    };

    if (parseFloat(updatedSchedule.StartHour) >= parseFloat(updatedSchedule.EndHour)) {
        alert(globalize.translate('ErrorStartHourGreaterThanEnd'));
        return;
    }

    context.submitted = true;
    options.schedule = Object.assign(options.schedule, updatedSchedule);
    dialogHelper.close(context);
}
import type { AccessSchedule } from "@jellyfin/sdk/lib/generated-client/models/access-schedule";

export function show(options): Promise<AccessSchedule> {
    return new Promise((resolve, reject) => {
        const dlg = dialogHelper.createDialog({
            removeOnClose: true,
            size: 'small'
        });
        dlg.classList.add('formDialog');
        let html = '';
        html += globalize.translateHtml(template);
        dlg.innerHTML = html;
        populateHours(dlg);
        loadSchedule(dlg, options.schedule);
        dialogHelper.open(dlg);
        dlg.addEventListener('close', () => {
            if (dlg.submitted) {
                resolve(options.schedule);
            } else {
                reject();
            }
        });
        dlg.querySelector<HTMLButtonElement>('.btnCancel')!.addEventListener('click', () => {
            dialogHelper.close(dlg);
        });
        dlg.querySelector<HTMLFormElement>('form')!.addEventListener('submit', event => {
            submitSchedule(dlg, options);
            event.preventDefault();
            return false;
        });
    });
}

export default {
    show
};
