
/**
 * Module for image Options Editor.
 * @module components/imageOptionsEditor/imageOptionsEditor
 */

import globalize from '../../lib/globalize';
import dom from '../../utils/dom';
import dialogHelper from '../dialogHelper/dialogHelper';
import '../../elements/emby-checkbox/emby-checkbox';
import '../../elements/emby-select/emby-select';
import '../../elements/emby-input/emby-input';
import template from './imageOptionsEditor.template.html';

function getDefaultImageConfig(type) {
    return {
        Type: type,
        MinWidth: 0,
        Limit: type === 'Primary' ? 1 : 0
    };
}

function findImageOptions(imageOptions, type) {
    return imageOptions.filter(i => {
        return i.Type == type;
    })[0];
}

function getImageConfig(options, availableOptions, imageType) {
    return findImageOptions(options.ImageOptions || [], imageType) || findImageOptions(availableOptions.DefaultImageOptions || [], imageType) || getDefaultImageConfig(imageType);
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

function loadValues(context, options, availableOptions) {
    const supportedImageTypes = availableOptions.SupportedImageTypes || [];
    setVisibilityOfBackdrops(context.querySelector('.backdropFields'), supportedImageTypes.includes('Backdrop'));
    Array.prototype.forEach.call(context.querySelectorAll('.imageType'), i => {
        const imageType = i.getAttribute('data-imagetype');
        const container = dom.parentWithTag(i, 'LABEL');

        if (!supportedImageTypes.includes(imageType)) {
            container.classList.add('hide');
        } else {
            container.classList.remove('hide');
        }

        if (getImageConfig(options, availableOptions, imageType).Limit) {
            i.checked = true;
        } else {
            i.checked = false;
        }
    });
    const backdropConfig = getImageConfig(options, availableOptions, 'Backdrop');
    context.querySelector('#txtMaxBackdrops').value = backdropConfig.Limit;
    context.querySelector('#txtMinBackdropDownloadWidth').value = backdropConfig.MinWidth;
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
}

class ImageOptionsEditor {
    show(options, availableOptions) {
        const dlg = dialogHelper.createDialog({
            size: 'small',
            removeOnClose: true,
            scrollY: false
        });
        dlg.classList.add('formDialog');
        dlg.innerHTML = globalize.translateHtml(template);
        dlg.addEventListener('close', function () {
            saveValues(dlg, options);
        });
        loadValues(dlg, options, availableOptions);
        dialogHelper.open(dlg).then(() => {
            return;
        }).catch(() => {
            return;
        });
        dlg.querySelector('.btnCancel').addEventListener('click', function () {
            dialogHelper.close(dlg);
        });
    }
}

export default ImageOptionsEditor;
