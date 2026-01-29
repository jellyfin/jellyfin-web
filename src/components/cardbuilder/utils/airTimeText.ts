import globalize from '../../../lib/globalize';
import datetime from '../../../scripts/datetime';

/**
 * Returns air time text for item based on given times.
 */
export function getAirTimeText(
    item: any,
    showAirDateTime: boolean,
    showAirEndTime: boolean
): string {
    let html = '';

    if (showAirDateTime && item.StartDate) {
        html += '<div class="cardText cardText-secondary">';
        html += '<span class="cardText-ontime">';
        html += globalize.translate('On');
        html +=
            ' ' +
            datetime.toLocaleString(item.StartDate).toLowerCase() +
            ' ' +
            datetime.getDisplayTime(item.StartDate);
        html += '</span>';
        html += '</div>';
    }

    if (showAirEndTime && item.EndDate) {
        if (html) html += '<br/>';
        html += '<div class="cardText cardText-secondary">';
        html += '<span class="cardText-ontime">';
        html += globalize.translate('Off');
        html +=
            ' ' +
            datetime.toLocaleString(item.EndDate).toLowerCase() +
            ' ' +
            datetime.getDisplayTime(item.EndDate);
        html += '</span>';
        html += '</div>';
    }

    return html;
}
