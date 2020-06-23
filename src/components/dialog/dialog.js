define(['dialogHelper', 'dom', 'layoutManager', 'scrollHelper', 'globalize', 'require', 'material-icons', 'emby-button', 'paper-icon-button-light', 'emby-input', 'formDialogStyle', 'flexStyles'], function (dialogHelper, dom, layoutManager, scrollHelper, globalize, require) {
    'use strict';

    function showDialog(options, template) {

        var dialogOptions = {
            removeOnClose: true,
            scrollY: false
        };

        var enableTvLayout = layoutManager.tv;

        if (enableTvLayout) {
            dialogOptions.size = 'fullscreen';
        }

        var dlg = dialogHelper.createDialog(dialogOptions);

        dlg.classList.add('formDialog');

        dlg.innerHTML = globalize.translateHtml(template, 'core');

        dlg.classList.add('align-items-center');
        dlg.classList.add('justify-content-center');
        var formDialogContent = dlg.querySelector('.formDialogContent');
        formDialogContent.classList.add('no-grow');

        if (enableTvLayout) {
            formDialogContent.style['max-width'] = '50%';
            formDialogContent.style['max-height'] = '60%';
            scrollHelper.centerFocus.on(formDialogContent, false);
        } else {
            formDialogContent.style.maxWidth = (Math.min((options.buttons.length * 150) + 200, dom.getWindowSize().innerWidth - 50)) + 'px';
            dlg.classList.add('dialog-fullscreen-lowres');
        }

        //dlg.querySelector('.btnCancel').addEventListener('click', function (e) {
        //    dialogHelper.close(dlg);
        //});

        if (options.title) {
            dlg.querySelector('.formDialogHeaderTitle').innerHTML = options.title || '';
        } else {
            dlg.querySelector('.formDialogHeaderTitle').classList.add('hide');
        }

        var displayText = options.html || options.text || '';
        dlg.querySelector('.text').innerHTML = displayText;

        if (!displayText) {
            dlg.querySelector('.dialogContentInner').classList.add('hide');
        }

        var html = '';
        var hasDescriptions = false;

        for (const [index, button] of options.buttons.entries()) {
            var autoFocus = index === 0 ? ' autofocus' : '';

            var buttonClass = 'btnOption raised formDialogFooterItem formDialogFooterItem-autosize';

            if (button.type) {
                buttonClass += ' button-' + button.type;
            }

            if (button.description) {
                hasDescriptions = true;
            }

            if (hasDescriptions) {
                buttonClass += ' formDialogFooterItem-vertical formDialogFooterItem-nomarginbottom';
            }

            html += '<button is="emby-button" type="button" class="' + buttonClass + '" data-id="' + button.id + '"' + autoFocus + '>' + button.name + '</button>';

            if (button.description) {
                html += '<div class="formDialogFooterItem formDialogFooterItem-autosize fieldDescription" style="margin-top:.25em!important;margin-bottom:1.25em!important;">' + button.description + '</div>';
            }
        }

        dlg.querySelector('.formDialogFooter').innerHTML = html;

        if (hasDescriptions) {
            dlg.querySelector('.formDialogFooter').classList.add('formDialogFooter-vertical');
        }

        var dialogResult;
        function onButtonClick() {
            dialogResult = this.getAttribute('data-id');
            dialogHelper.close(dlg);
        }

        for (const button of dlg.querySelectorAll('.btnOption')) {
            button.addEventListener('click', onButtonClick);
        }

        return dialogHelper.open(dlg).then(function () {

            if (enableTvLayout) {
                scrollHelper.centerFocus.off(dlg.querySelector('.formDialogContent'), false);
            }

            if (dialogResult) {
                return dialogResult;
            } else {
                return Promise.reject();
            }
        });
    }

    return function (text, title) {

        var options;
        if (typeof text === 'string') {
            options = {
                title: title,
                text: text
            };
        } else {
            options = text;
        }

        return new Promise(function (resolve, reject) {
            require(['text!./dialog.template.html'], function (template) {
                showDialog(options, template).then(resolve, reject);
            });
        });
    };
});
