define(['globalize', 'dom', 'dialogHelper', 'emby-checkbox', 'emby-select', 'emby-input'], function (globalize, dom, dialogHelper) {
    'use strict';

    /**
     * @param itemType
     * @param type
     */
    function getDefaultImageConfig (itemType, type) {
        return {
            Type: type,
            MinWidth: 0,
            Limit: type === 'Primary' ? 1 : 0
        };
    }

    /**
     * @param imageOptions
     * @param type
     */
    function findImageOptions (imageOptions, type) {
        return imageOptions.filter(function (i) {
            return i.Type == type;
        })[0];
    }

    /**
     * @param options
     * @param availableOptions
     * @param imageType
     * @param itemType
     */
    function getImageConfig (options, availableOptions, imageType, itemType) {
        return findImageOptions(options.ImageOptions || [], imageType) || findImageOptions(availableOptions.DefaultImageOptions || [], imageType) || getDefaultImageConfig(itemType, imageType);
    }

    /**
     * @param elem
     * @param visible
     */
    function setVisibilityOfBackdrops (elem, visible) {
        if (visible) {
            elem.classList.remove('hide');
            elem.querySelector('input').setAttribute('required', 'required');
        } else {
            elem.classList.add('hide');
            elem.querySelector('input').setAttribute('required', '');
            elem.querySelector('input').removeAttribute('required');
        }
    }

    /**
     * @param context
     * @param itemType
     * @param options
     * @param availableOptions
     */
    function loadValues (context, itemType, options, availableOptions) {
        var supportedImageTypes = availableOptions.SupportedImageTypes || [];
        setVisibilityOfBackdrops(context.querySelector('.backdropFields'), supportedImageTypes.indexOf('Backdrop') != -1);
        setVisibilityOfBackdrops(context.querySelector('.screenshotFields'), supportedImageTypes.indexOf('Screenshot') != -1);
        Array.prototype.forEach.call(context.querySelectorAll('.imageType'), function (i) {
            var imageType = i.getAttribute('data-imagetype');
            var container = dom.parentWithTag(i, 'LABEL');

            if (supportedImageTypes.indexOf(imageType) == -1) {
                container.classList.add('hide');
            } else {
                container.classList.remove('hide');
            }

            if (getImageConfig(options, availableOptions, imageType, itemType).Limit) {
                i.checked = true;
            } else {
                i.checked = false;
            }
        });
        var backdropConfig = getImageConfig(options, availableOptions, 'Backdrop', itemType);
        context.querySelector('#txtMaxBackdrops').value = backdropConfig.Limit;
        context.querySelector('#txtMinBackdropDownloadWidth').value = backdropConfig.MinWidth;
        var screenshotConfig = getImageConfig(options, availableOptions, 'Screenshot', itemType);
        context.querySelector('#txtMaxScreenshots').value = screenshotConfig.Limit;
        context.querySelector('#txtMinScreenshotDownloadWidth').value = screenshotConfig.MinWidth;
    }

    /**
     * @param context
     * @param options
     */
    function saveValues (context, options) {
        options.ImageOptions = Array.prototype.map.call(context.querySelectorAll('.imageType:not(.hide)'), function (c) {
            return {
                Type: c.getAttribute('data-imagetype'),
                Limit: c.checked ? 1 : 0,
                MinWidth: 0
            };
        });
        options.ImageOptions.push({
            Type: 'Backdrop',
            Limit: context.querySelector('#txtMaxBackdrops').value,
            MinWidth: context.querySelector('#txtMinBackdropDownloadWidth').value
        });
        options.ImageOptions.push({
            Type: 'Screenshot',
            Limit: context.querySelector('#txtMaxScreenshots').value,
            MinWidth: context.querySelector('#txtMinScreenshotDownloadWidth').value
        });
    }

    /**
     *
     */
    function editor () {
        this.show = function (itemType, options, availableOptions) {
            return new Promise(function (resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', 'components/imageoptionseditor/imageoptionseditor.template.html', true);

                xhr.onload = function (e) {
                    var template = this.response;
                    var dlg = dialogHelper.createDialog({
                        size: 'medium-tall',
                        removeOnClose: true,
                        scrollY: false
                    });
                    dlg.classList.add('formDialog');
                    dlg.innerHTML = globalize.translateDocument(template);
                    dlg.addEventListener('close', function () {
                        saveValues(dlg, options);
                    });
                    loadValues(dlg, itemType, options, availableOptions);
                    dialogHelper.open(dlg).then(resolve, resolve);
                    dlg.querySelector('.btnCancel').addEventListener('click', function () {
                        dialogHelper.close(dlg);
                    });
                };

                xhr.send();
            });
        };
    }

    return editor;
});
