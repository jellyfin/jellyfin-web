import globalize from 'lib/globalize';
import { ticksToTimeString } from './clipSaverTime';

/**
 * Build the inner HTML for the clip saver dialog.
 * @param {number} startTicks - Pre-filled start time in ticks.
 * @param {number} endTicks   - Pre-filled end time in ticks.
 * @returns {string} HTML string to assign to dlg.innerHTML.
 */
export function buildHtml(startTicks: number, endTicks: number): string {
    const timePattern = String.raw`\d+:\d{2}:\d{2}(\.\d{1,3})?`;
    let html = '';

    // Header
    html += '<div class="formDialogHeader">';
    html += '<button is="paper-icon-button-light" class="btnCancel autoSize">';
    html += '<span class="material-icons arrow_back" aria-hidden="true"></span>';
    html += '</button>';
    html += `<h3 class="formDialogHeaderTitle">${globalize.translate('ClipVideo')}</h3>`;
    html += '</div>';

    // Content
    html += '<div class="formDialogContent smoothScrollY">';
    html += '<div class="dialogContentInner">';

    // Time range inputs
    html += '<div class="clipTimeInputs">';

    html += '<div class="inputContainer">';
    html += `<label class="inputLabel" for="clipStartTime">${globalize.translate('ClipStartTime')}</label>`;
    html += '<div class="clipTimeRow">';
    html += '<button type="button" class="clipStepBtn btnStartMinus">−1s</button>';
    html += `<input type="text" id="clipStartTime" class="emby-input clipTimeInput" value="${ticksToTimeString(startTicks)}" pattern="${timePattern}" title="${globalize.translate('ClipTimeFormat')}" />`;
    html += '<button type="button" class="clipStepBtn btnStartPlus">+1s</button>';
    html += '</div>';
    html += '</div>';

    html += '<div class="inputContainer">';
    html += `<label class="inputLabel" for="clipEndTime">${globalize.translate('ClipEndTime')}</label>`;
    html += '<div class="clipTimeRow">';
    html += '<button type="button" class="clipStepBtn btnEndMinus">−1s</button>';
    html += `<input type="text" id="clipEndTime" class="emby-input clipTimeInput" value="${ticksToTimeString(endTicks)}" pattern="${timePattern}" title="${globalize.translate('ClipTimeFormat')}" />`;
    html += '<button type="button" class="clipStepBtn btnEndPlus">+1s</button>';
    html += '</div>';
    html += '</div>';

    html += '</div>'; // clipTimeInputs

    // Codec selector
    html += '<div class="clipCodecSelector">';
    html += `<label class="inputLabel">${globalize.translate('ClipCodec')}</label>`;
    html += '<div class="clipCodecRow">';
    html += '<button type="button" class="clipStepBtn clipCodecBtn" data-codec="h264">H.264</button>';
    html += '<button type="button" class="clipStepBtn clipCodecBtn" data-codec="h265">HEVC</button>';
    html += '<button type="button" class="clipStepBtn clipCodecBtn" data-codec="av1">AV1</button>';
    html += '</div>';
    html += '</div>';

    // Duration display
    html += `<div class="clipDuration">${globalize.translate('ClipDuration')}: <span class="clipDurationValue">--:--</span></div>`;

    // Validation message
    html += '<div class="clipValidation hide"></div>';

    // Progress section (hidden initially)
    html += '<div class="clipProgressSection hide">';
    html += `<div class="clipProgressLabel">${globalize.translate('ClipEncoding')}...</div>`;
    html += '<div class="clipProgressBar"><div class="clipProgressFill"></div></div>';
    html += '<div class="clipProgressFooter">';
    html += '<div class="clipProgressPercent">0%</div>';
    html += '<div class="clipProgressEta"></div>';
    html += '</div>';
    html += '</div>';

    // Buttons
    html += '<div class="formDialogFooter">';
    html += '<button is="emby-button" type="button" class="raised button-submit block btnStartClip">';
    html += `<span>${globalize.translate('ClipSave')}</span>`;
    html += '</button>';
    html += '<button is="emby-button" type="button" class="raised button-cancel block btnCancelClip hide">';
    html += `<span>${globalize.translate('ClipCancelEncoding')}</span>`;
    html += '</button>';
    html += '<a class="emby-button raised button-submit block btnDownloadClip hide" download>';
    html += '<span class="material-icons file_download" aria-hidden="true"></span>';
    html += `<span>${globalize.translate('ClipDownload')}</span>`;
    html += '</a>';
    html += '</div>';

    html += '</div>'; // dialogContentInner
    html += '</div>'; // formDialogContent

    return html;
}
