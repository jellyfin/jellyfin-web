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

export function show(containerProfile) {
    return new Promise(function (resolve, reject) {
        import('text!./containerProfileEditor.template.html').then(({default: template}) => {
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

            dlg.querySelector('#selectContainerProfileType', dlg).value = containerProfile.Type || 'Video';
            dlg.querySelector('#txtContainerProfileContainer', dlg).value = containerProfile.Container || '';

            if (layoutManager.tv) {
                centerFocus(dlg.querySelector('.formDialogContent'), false, true);
            }

            dialogHelper.open(dlg);

            dlg.addEventListener('close', function () {
                if (layoutManager.tv) {
                    centerFocus(dlg.querySelector('.formDialogContent'), false, false);
                }

                if (submitted) {
                    resolve(containerProfile);
                } else {
                    reject();
                }
            });

            dlg.querySelector('.btnCancel').addEventListener('click', function (e) {
                dialogHelper.close(dlg);
            });

            dlg.querySelector('form').addEventListener('submit', function (e) {
                submitted = true;

                containerProfile.Type = dlg.querySelector('#selectContainerProfileType', dlg).value;
                containerProfile.Container = dlg.querySelector('#txtContainerProfileContainer', dlg).value;

                dialogHelper.close(dlg);

                e.preventDefault();
                return false;
            });

            dlg.querySelector('#selectContainerProfileType').dispatchEvent(new CustomEvent('change', {
                bubbles: true
            }));
        });
    });
}

export default {
    show: show
};

