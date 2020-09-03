import dom from 'dom';
import dialogHelper from 'dialogHelper';
import loading from 'loading';
import layoutManager from 'layoutManager';
import globalize from 'globalize';
import 'emby-input';
import 'emby-checkbox';
import 'paper-icon-button-light';
import 'emby-select';
import 'material-icons';
import 'css!./../formdialog';
import 'emby-button';

/*eslint prefer-const: "error"*/

function getEditorHtml() {
    let html = '';

    html += '<div class="formDialogContent smoothScrollY" style="padding-top:2em;">';
    html += '<div class="dialogContentInner dialog-content-centered">';
    html += '<form style="margin:auto;">';

    html += '<div class="fldSelectPlaylist selectContainer">';
    html += '<select is="emby-select" id="selectMetadataRefreshMode" label="' + globalize.translate('LabelRefreshMode') + '">';
    html += '<option value="scan">' + globalize.translate('ScanForNewAndUpdatedFiles') + '</option>';
    html += '<option value="missing">' + globalize.translate('SearchForMissingMetadata') + '</option>';
    html += '<option value="all" selected>' + globalize.translate('ReplaceAllMetadata') + '</option>';
    html += '</select>';
    html += '</div>';

    html += '<label class="checkboxContainer hide fldReplaceExistingImages">';
    html += '<input type="checkbox" is="emby-checkbox" class="chkReplaceImages" />';
    html += '<span>' + globalize.translate('ReplaceExistingImages') + '</span>';
    html += '</label>';

    html += '<div class="fieldDescription">';
    html += globalize.translate('RefreshDialogHelp');
    html += '</div>';

    html += '<input type="hidden" class="fldSelectedItemIds" />';

    html += '<br />';
    html += '<div class="formDialogFooter">';
    html += '<button is="emby-button" type="submit" class="raised btnSubmit block formDialogFooterItem button-submit">' + globalize.translate('Refresh') + '</button>';
    html += '</div>';

    html += '</form>';
    html += '</div>';
    html += '</div>';

    return html;
}

function centerFocus(elem, horiz, on) {
    import('scrollHelper').then(({default: scrollHelper}) => {
        const fn = on ? 'on' : 'off';
        scrollHelper.centerFocus[fn](elem, horiz);
    });
}

function onSubmit(e) {
    loading.show();

    const instance = this;
    const dlg = dom.parentWithClass(e.target, 'dialog');
    const options = instance.options;

    const apiClient = window.connectionManager.getApiClient(options.serverId);

    const replaceAllMetadata = dlg.querySelector('#selectMetadataRefreshMode').value === 'all';

    const mode = dlg.querySelector('#selectMetadataRefreshMode').value === 'scan' ? 'Default' : 'FullRefresh';
    const replaceAllImages = mode === 'FullRefresh' && dlg.querySelector('.chkReplaceImages').checked;

    options.itemIds.forEach(function (itemId) {
        apiClient.refreshItem(itemId, {

            Recursive: true,
            ImageRefreshMode: mode,
            MetadataRefreshMode: mode,
            ReplaceAllImages: replaceAllImages,
            ReplaceAllMetadata: replaceAllMetadata
        });
    });

    dialogHelper.close(dlg);

    import('toast').then(({default: toast}) => {
        toast(globalize.translate('RefreshQueued'));
    });

    loading.hide();

    e.preventDefault();
    return false;
}

class RefreshDialog {
    constructor(options) {
        this.options = options;
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

        let html = '';
        const title = globalize.translate('RefreshMetadata');

        html += '<div class="formDialogHeader">';
        html += '<button is="paper-icon-button-light" class="btnCancel autoSize" tabindex="-1"><span class="material-icons arrow_back"></span></button>';
        html += '<h3 class="formDialogHeaderTitle">';
        html += title;
        html += '</h3>';

        html += '</div>';

        html += getEditorHtml();

        dlg.innerHTML = html;

        dlg.querySelector('form').addEventListener('submit', onSubmit.bind(this));

        dlg.querySelector('#selectMetadataRefreshMode').addEventListener('change', function () {
            if (this.value === 'scan') {
                dlg.querySelector('.fldReplaceExistingImages').classList.add('hide');
            } else {
                dlg.querySelector('.fldReplaceExistingImages').classList.remove('hide');
            }
        });

        if (this.options.mode) {
            dlg.querySelector('#selectMetadataRefreshMode').value = this.options.mode;
        }

        dlg.querySelector('#selectMetadataRefreshMode').dispatchEvent(new CustomEvent('change'));

        dlg.querySelector('.btnCancel').addEventListener('click', function () {
            dialogHelper.close(dlg);
        });

        if (layoutManager.tv) {
            centerFocus(dlg.querySelector('.formDialogContent'), false, true);
        }

        return new Promise(function (resolve, reject) {
            if (layoutManager.tv) {
                centerFocus(dlg.querySelector('.formDialogContent'), false, false);
            }

            dlg.addEventListener('close', resolve);
            dialogHelper.open(dlg);
        });
    }
}

export default RefreshDialog;
