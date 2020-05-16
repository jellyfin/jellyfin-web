define(['dialogHelper', 'connectionManager', 'dom', 'loading', 'scrollHelper', 'layoutManager', 'globalize', 'require', 'emby-button', 'emby-select', 'formDialogStyle', 'css!./style'], function (dialogHelper, connectionManager, dom, loading, scrollHelper, layoutManager, globalize, require) {
    'use strict';

    var currentItemId;
    var currentServerId;
    var currentFile;
    var hasChanges = false;

    function onFileReaderError(evt) {

        loading.hide();

        var error = evt.target.error;
        if (error.code !== error.ABORT_ERR) {
            require(['toast'], function (toast) {
                toast(globalize.translate('MessageFileReadError'));
            });
        }
    }

    function isValidSubtitleFile(file) {
        return file && ['.sub', '.srt', '.vtt', '.ass', '.ssa']
            .some(function(ext) {
                return file.name.endsWith(ext);
            });
    }

    function setFiles(page, files) {

        var file = files[0];

        if (!isValidSubtitleFile(file)) {
            page.querySelector('#subtitleOutput').innerHTML = '';
            page.querySelector('#fldUpload').classList.add('hide');
            page.querySelector('#labelDropSubtitle').classList.remove('hide');
            currentFile = null;
            return;
        }

        currentFile = file;

        var reader = new FileReader();

        reader.onerror = onFileReaderError;
        reader.onloadstart = function () {
            page.querySelector('#fldUpload').classList.add('hide');
        };
        reader.onabort = function () {
            loading.hide();
            console.debug('File read cancelled');
        };

        // Closure to capture the file information.
        reader.onload = (function (theFile) {
            return function () {

                // Render thumbnail.
                var html = '<a><i class="material-icons" style="transform: translateY(25%);">subtitles</i><span>' + escape(theFile.name) + '</span><a/>';

                page.querySelector('#subtitleOutput').innerHTML = html;
                page.querySelector('#fldUpload').classList.remove('hide');
                page.querySelector('#labelDropSubtitle').classList.add('hide');

            };
        })(file);

        // Read in the subtitle file as a data URL.
        reader.readAsDataURL(file);
    }

    function onSubmit(e) {

        var file = currentFile;

        if (!isValidSubtitleFile(file)) {
            require(['toast'], function (toast) {
                toast(globalize.translate('MessageSubtitleFileTypeAllowed'));
            });
            e.preventDefault();
            return;
        }

        loading.show();

        var dlg = dom.parentWithClass(this, 'dialog');
        var language = dlg.querySelector('#selectLanguage').value;
        var isForced = dlg.querySelector('#chkIsForced').checked;

        connectionManager.getApiClient(currentServerId).uploadItemSubtitle(currentItemId, language, isForced, file).then(function () {

            dlg.querySelector('#uploadSubtitle').value = '';
            loading.hide();
            hasChanges = true;
            dialogHelper.close(dlg);
        });

        e.preventDefault();
    }

    function initEditor(page) {

        page.querySelector('.uploadSubtitleForm').addEventListener('submit', onSubmit);

        page.querySelector('#uploadSubtitle').addEventListener('change', function () {
            setFiles(page, this.files);
        });

        page.querySelector('.btnBrowse').addEventListener('click', function () {
            page.querySelector('#uploadSubtitle').click();
        });
    }

    function showEditor(options, resolve, reject) {

        options = options || {};

        require(['text!./subtitleuploader.template.html'], function (template) {

            currentItemId = options.itemId;
            currentServerId = options.serverId;

            var dialogOptions = {
                removeOnClose: true,
                scrollY: false
            };

            if (layoutManager.tv) {
                dialogOptions.size = 'fullscreen';
            } else {
                dialogOptions.size = 'small';
            }

            var dlg = dialogHelper.createDialog(dialogOptions);

            dlg.classList.add('formDialog');
            dlg.classList.add('subtitleUploaderDialog');

            dlg.innerHTML = globalize.translateDocument(template, 'core');

            if (layoutManager.tv) {
                scrollHelper.centerFocus.on(dlg, false);
            }

            // Has to be assigned a z-index after the call to .open()
            dlg.addEventListener('close', function () {

                if (layoutManager.tv) {
                    scrollHelper.centerFocus.off(dlg, false);
                }

                loading.hide();
                resolve(hasChanges);
            });

            dialogHelper.open(dlg);

            initEditor(dlg);

            var selectLanguage = dlg.querySelector('#selectLanguage');

            if (options.languages) {

                selectLanguage.innerHTML = options.languages.list || null;
                selectLanguage.value = options.languages.value || null;
            }

            dlg.querySelector('.btnCancel').addEventListener('click', function () {

                dialogHelper.close(dlg);
            });
        });
    }

    return {
        show: function (options) {

            return new Promise(function (resolve, reject) {

                hasChanges = false;

                showEditor(options, resolve, reject);
            });
        }
    };
});
