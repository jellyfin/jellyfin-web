/**
 * Returns air time text for item based on given times.
 * @param {object} item - Item used to generate the air time text.
 * @param {boolean} showAirDateTime - ISO8601 date for start of show.
 * @param {boolean} showAirEndTime - ISO8601 date for end of show.
 * @returns {string} The air time text for item based on given dates.
 */
export function getAirTimeText(item, showAirDateTime, showAirEndTime) {
    let html = '';

    if (showAirDateTime && item.StartDate) {
        html += '<div class="cardText cardText-secondary">';
        html += '<span class="cardText-ontime">';
        html += globalize.translate('On');
        html += ' ' + datetime.toLocaleString(item.StartDate).toLowerCase() + ' ' + datetime.getDisplayTime(item.StartDate);
        html += '</span>';
        html += '</div>';
    }

    if (showAirEndTime && item.EndDate) {
        if (html) {
            html += '<br/>';
        }
        html += '<div class="cardText cardText-secondary">';
        html += '<span class="cardText-ontime">';
        html += globalize.translate('Off');
        html += ' ' + datetime.toLocaleString(item.EndDate).toLowerCase() + ' ' + datetime.getDisplayTime(item.EndDate);
        html += '</span>';
        html += '</div>';
    }

    return html;
}
