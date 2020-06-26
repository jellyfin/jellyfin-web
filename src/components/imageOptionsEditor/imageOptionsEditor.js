/* eslint-disable indent */

/**
 * Module for image Options Editor.
 * @module components/imageOptionsEditor/imageOptionsEditor
 */

import globalize from 'globalize';
import dom from 'dom';
import dialogHelper from 'dialogHelper';
import 'emby-checkbox';
import 'emby-select';
import 'emby-input';

    function getDefaultImageConfig(itemType, type) {
        return {
            Type: type,
            MinWidth: 0,
            Limit: 'Primary' === type ? 1 : 0
        };
    }

    function findImageOptions(imageOptions, type) {
        return imageOptions.filter(i => {
            return i.Type == type;
        })[0];
    }

    function getImageConfig(options, availableOptions, imageType, itemType) {
        return findImageOptions(options.ImageOptions || [], imageType) || findImageOptions(availableOptions.DefaultImageOptions || [], imageType) || getDefaultImageConfig(itemType, imageType);
    }

    function setVisibilityOfBackdrops(elem, visible) {
        if (visible) {
            elem.classList.remove('hide');
            elem.querySelector('input').setAttribute('required', 'required');
        } else {
            elem.classList.add('hide');
            elem.querySelector('input').setAttribute('required', '');
            elem.querySelector('input').removeAttribute('required');
        }
    }

    function loadValues(context, itemType, options, availableOptions) {
        const supportedImageTypes = availableOptions.SupportedImageTypes || [];
        setVisibilityOfBackdrops(context.querySelector('.backdropFields'), supportedImageTypes.includes('Backdrop'));
        setVisibilityOfBackdrops(context.querySelector('.screenshotFields'), supportedImageTypes.includes('Screenshot'));
        Array.prototype.forEach.call(context.querySelectorAll('.imageType'), i => {
            const imageType = i.getAttribute('data-imagetype');
            const container = dom.parentWithTag(i, 'LABEL');

            if (!supportedImageTypes.includes(imageType)) {
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
        const backdropConfig = getImageConfig(options, availableOptions, 'Backdrop', itemType);
        context.querySelector('#txtMaxBackdrops').value = backdropConfig.Limit;
        context.querySelector('#txtMinBackdropDownloadWidth').value = backdropConfig.MinWidth;
        const screenshotConfig = getImageConfig(options, availableOptions, 'Screenshot', itemType);
        context.querySelector('#txtMaxScreenshots').value = screenshotConfig.Limit;
        context.querySelector('#txtMinScreenshotDownloadWidth').value = screenshotConfig.MinWidth;
    }

    function saveValues(context, options) {
        options.ImageOptions = Array.prototype.map.call(context.querySelectorAll('.imageType:not(.hide)'), c => {
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

export class showEditor {
    constructor(itemType, options, availableOptions) {
        return import('text!./components/imageOptionsEditor/imageOptionsEditor.template.html').then(({default: template}) => {
            return new Promise((resolve) => {
                const dlg = dialogHelper.createDialog({
                    size: 'small',
                    removeOnClose: true,
                    scrollY: false
                });
                dlg.classList.add('formDialog');
                dlg.innerHTML = globalize.translateDocument(template);
                dlg.addEventListener('close', () => {
                    saveValues(dlg, options);
                });
                loadValues(dlg, itemType, options, availableOptions);
                dialogHelper.open(dlg).then(resolve, resolve);
                dlg.querySelector('.btnCancel').addEventListener('click', () => {
                    dialogHelper.close(dlg);
                });
            });
        });
    }
}

/* eslint-enable indent */
export default showEditor;
