import dialogHelper from '../dialogHelper/dialogHelper';
import layoutManager from '../layoutManager';
import globalize from '../../lib/globalize';
import toast from '../toast/toast';
import { copy } from '../../scripts/clipboard';

import '../../elements/emby-button/emby-button';
import '../../elements/emby-button/paper-icon-button-light';
import '../../elements/emby-input/emby-input';
import '../formdialog.scss';
import './shareLinkDialog.scss';
import 'material-design-icons-iconfont';

import { ShareLinkError, createShareLink } from './ShareLinksApi';
import { DURATION_PRESETS, formatExpiration } from './shareLinkDurations';

function setError(dlg, message) {
    const errorElement = dlg.querySelector('.shareLinkError');
    errorElement.textContent = message || '';
    errorElement.classList.toggle('hide', !message);
}

function updateExpirationSummary(dlg) {
    const summary = dlg.querySelector('.shareLinkExpiresSummary');
    const selected = dlg.querySelector('.btnPreset.raised');

    if (!selected) {
        summary.classList.add('hide');
        return;
    }

    const durationSeconds = parseInt(selected.dataset.duration, 10);
    summary.textContent = globalize.translate('ShareLinkExpiresOn', formatExpiration(durationSeconds));
    summary.classList.remove('hide');
}

/**
 * Switches the dialog between "choose a duration" and "here is your link".
 *
 * @param {HTMLElement} dlg - The dialog element.
 * @param {boolean} showResult - Whether the link is ready.
 */
function setResultVisible(dlg, showResult) {
    dlg.querySelector('.shareLinkSetup').classList.toggle('hide', showResult);
    dlg.querySelector('.shareLinkResult').classList.toggle('hide', !showResult);
}

function selectPreset(dlg, button) {
    dlg.querySelectorAll('.btnPreset').forEach(btn => {
        const isSelected = btn === button;
        btn.classList.toggle('raised', isSelected);
        btn.classList.toggle('button-flat', !isSelected);
        btn.setAttribute('aria-pressed', String(isSelected));
    });

    setError(dlg, null);
    updateExpirationSummary(dlg);
}

function copyShareUrl(dlg) {
    const urlInput = dlg.querySelector('#txtShareLinkUrl');
    if (!urlInput.value) {
        return;
    }

    copy(urlInput.value).then(() => {
        toast(globalize.translate('ShareLinkCopied'));
    }).catch(() => {
        /* The URL stays visible and selected so it can still be copied by hand. */
        urlInput.select();
    });
}

function getEditorHtml() {
    let html = '';

    html += '<div class="formDialogHeader">';
    html += `<button is="paper-icon-button-light" class="btnCancel autoSize" tabindex="-1" title="${globalize.translate('ButtonBack')}"><span class="material-icons arrow_back" aria-hidden="true"></span></button>`;
    html += `<h3 class="formDialogHeaderTitle">${globalize.translate('ShareLink')}</h3>`;
    html += '</div>';

    html += '<div class="formDialogContent smoothScrollY">';
    html += '<div class="dialogContentInner shareLinkBody">';
    html += '<form class="shareLinkForm">';

    // Step one: pick how long the link lives.
    html += '<div class="shareLinkSetup">';
    html += `<p class="shareLinkSummary">${globalize.translate('ShareLinkDescription')}</p>`;

    html += '<div class="fldShareLinkDuration">';
    html += `<span class="shareLinkDurationLabel">${globalize.translate('LabelShareLinkDuration')}</span>`;
    html += '<div class="shareLinkPresets" role="group">';
    for (const preset of DURATION_PRESETS) {
        const cls = preset.isDefault ? 'btnPreset raised' : 'btnPreset button-flat';
        html += `<button type="button" is="emby-button" class="${cls}" data-duration="${preset.durationSeconds}" aria-pressed="${preset.isDefault}">${globalize.translate(preset.labelKey)}</button>`;
    }
    html += '</div>';
    html += '</div>';

    html += '<p class="shareLinkExpiresSummary hide"></p>';
    html += '</div>';

    // Step two: the link itself.
    html += '<div class="shareLinkResult hide">';
    html += '<div class="shareLinkUrlRow">';
    html += `<input is="emby-input" id="txtShareLinkUrl" type="text" readonly="readonly" label="${globalize.translate('LabelShareLinkUrl')}" />`;
    html += `<button type="button" is="emby-button" class="btnCopyUrl raised" title="${globalize.translate('Copy')}">${globalize.translate('Copy')}</button>`;
    html += '</div>';
    html += '<p class="shareLinkExpiresSummary shareLinkResultExpiry"></p>';
    html += '</div>';

    html += '<div class="shareLinkError fieldDescription hide" role="alert"></div>';

    html += '<div class="formDialogFooter shareLinkFooter">';
    html += `<button is="emby-button" type="submit" class="raised btnSubmit button-submit">${globalize.translate('ButtonCreateShareLink')}</button>`;
    html += `<button is="emby-button" type="button" class="raised btnDone hide">${globalize.translate('ButtonClose')}</button>`;
    html += '</div>';

    html += '</form>';
    html += '</div>';
    html += '</div>';

    return html;
}

class ShareLinkDialog {
    /**
     * @param {object} options - Dialog options.
     * @param {string} options.itemId - Id of the item being shared.
     * @param {string} [options.serverId] - Server the item belongs to.
     */
    constructor(options) {
        this.options = options;
    }

    /**
     * Creates the link, then swaps the dialog over to the result.
     *
     * @param {Event} e - The submit event.
     * @param {HTMLElement} dlg - The dialog element.
     * @returns {void}
     */
    onSubmit(e, dlg) {
        e.preventDefault();

        const selectedPreset = dlg.querySelector('.btnPreset.raised');

        if (!selectedPreset) {
            setError(dlg, globalize.translate('MessageSelectShareLinkDuration'));
            return;
        }

        const body = { DurationSeconds: parseInt(selectedPreset.dataset.duration, 10) };

        setError(dlg, null);

        const submitButton = dlg.querySelector('.btnSubmit');
        submitButton.disabled = true;

        createShareLink(this.options.itemId, body, this.options.serverId).then(dto => {
            submitButton.disabled = false;

            if (!dto || !dto.url) {
                setError(dlg, globalize.translate('MessageShareLinkCreateFailed'));
                return;
            }

            dlg.querySelector('#txtShareLinkUrl').value = dto.url;

            // Carry the chosen duration into the result so the link's lifetime stays visible after creation.
            const selected = dlg.querySelector('.btnPreset.raised');
            const durationSeconds = selected ? parseInt(selected.dataset.duration, 10) : null;
            const resultExpiry = dlg.querySelector('.shareLinkResultExpiry');
            if (durationSeconds) {
                resultExpiry.textContent = globalize.translate('ShareLinkExpiresOn', formatExpiration(durationSeconds));
                resultExpiry.classList.remove('hide');
            } else {
                resultExpiry.classList.add('hide');
            }

            setResultVisible(dlg, true);
            dlg.querySelector('.btnSubmit').classList.add('hide');
            dlg.querySelector('.btnDone').classList.remove('hide');

            copy(dto.url).then(() => {
                toast(globalize.translate('ShareLinkCopied'));
            }).catch(() => {
                /* The URL stays visible in the dialog for manual copying. */
            });
        }).catch(error => {
            submitButton.disabled = false;

            let message = globalize.translate('MessageShareLinkCreateFailed');
            if (error instanceof ShareLinkError) {
                if (error.shareLinkErrorCode) {
                    message += ` (${error.shareLinkErrorCode})`;
                } else if (error.message) {
                    message += ` ${error.message}`;
                }
            }

            setError(dlg, message);
        });
    }

    show() {
        const dialogOptions = {
            removeOnClose: true,
            scrollY: false
        };

        if (layoutManager.tv) {
            dialogOptions.size = 'fullscreen';
        } else {
            dialogOptions.size = 'small';
        }

        const dlg = dialogHelper.createDialog(dialogOptions);

        dlg.classList.add('formDialog');
        dlg.classList.add('shareLinkDialog');
        dlg.innerHTML = getEditorHtml();

        dlg.querySelector('.btnCancel').addEventListener('click', () => dialogHelper.close(dlg));
        dlg.querySelector('.btnDone').addEventListener('click', () => dialogHelper.close(dlg));

        dlg.querySelector('.shareLinkForm').addEventListener('submit', e => this.onSubmit(e, dlg));

        dlg.querySelectorAll('.btnPreset').forEach(btn => {
            btn.addEventListener('click', () => selectPreset(dlg, btn));
        });

        dlg.querySelector('.btnCopyUrl').addEventListener('click', () => copyShareUrl(dlg));

        updateExpirationSummary(dlg);

        return new Promise(resolve => {
            dlg.addEventListener('close', resolve);
            dialogHelper.open(dlg);
        });
    }
}

export default ShareLinkDialog;
