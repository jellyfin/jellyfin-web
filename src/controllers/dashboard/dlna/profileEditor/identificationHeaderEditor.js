import dialogHelper from 'dialogHelper';
import layoutManager from 'layoutManager';
import globalize from 'globalize';
import 'paper-icon-button-light';
import 'emby-input';
import 'emby-select';
import 'formDialogStyle';

function centerFocus(elem, horiz, on) {
    import('scrollHelper').then(({default: scrollHelper}) => {
        const fn = on ? 'on' : 'off';
        scrollHelper.centerFocus[fn](elem, horiz);
    });
}

export function show(header) {
    return new Promise(function (resolve, reject) {
        import('text!./identificationHeaderEditor.template.html').then(({default: template}) => {
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
            let submitted = false;

            html += globalize.translateHtml(template, 'core');

            dlg.innerHTML = html;

            dlg.querySelector('#txtIdentificationHeaderName', dlg).value = header.Name || '';
            dlg.querySelector('#txtIdentificationHeaderValue', dlg).value = header.Value || '';
            dlg.querySelector('#selectMatchType', dlg).value = header.Match || 'Equals';

            if (layoutManager.tv) {
                centerFocus(dlg.querySelector('.formDialogContent'), false, true);
            }

            dialogHelper.open(dlg);

            dlg.addEventListener('close', function () {
                if (layoutManager.tv) {
                    centerFocus(dlg.querySelector('.formDialogContent'), false, false);
                }

                if (submitted) {
                    resolve(header);
                } else {
                    reject();
                }
            });

            dlg.querySelector('.btnCancel').addEventListener('click', function (e) {
                dialogHelper.close(dlg);
            });

            dlg.querySelector('form').addEventListener('submit', function (e) {
                submitted = true;

                header.Name = dlg.querySelector('#txtIdentificationHeaderName', dlg).value;
                header.Value = dlg.querySelector('#txtIdentificationHeaderValue', dlg).value;
                header.Match = dlg.querySelector('#selectMatchType', dlg).value;

                dialogHelper.close(dlg);

                e.preventDefault();
                return false;
            });
        });
    });
}

export default {
    show: show
};

