import layoutManager from '../../components/layoutManager';
import browser from '../../scripts/browser';
import actionsheet from '../../components/actionSheet/actionSheet';
import './emby-select.scss';
import 'webcomponents.js/webcomponents-lite';

const EmbySelectPrototype = Object.create(HTMLSelectElement.prototype);

function enableNativeMenu() {
    // WebView 2 creates dropdown that doesn't work with controller.
    if (browser.edgeUwp || browser.xboxOne) {
        return false;
    }

    // Doesn't seem to work at all
    if (browser.tizen || browser.orsay || browser.web0s) {
        return false;
    }

    // Take advantage of the native input methods
    if (browser.tv) {
        return true;
    }

    return !layoutManager.tv;
}

function triggerChange(select) {
    const evt = new Event('change', { bubbles: false, cancelable: true });
    select.dispatchEvent(evt);
}

function setValue(select, value) {
    select.value = value;
}

function showActionSheet(select) {
    const labelElem = getLabel(select);
    const title = labelElem ? (labelElem.textContent || labelElem.innerText) : null;

    actionsheet.show({
        items: select.options,
        positionTo: select,
        title: title

    }).then(function (value) {
        setValue(select, value);
        triggerChange(select);
    });
}

function getLabel(select) {
    let elem = select.previousSibling;
    while (elem && elem.tagName !== 'LABEL') {
        elem = elem.previousSibling;
    }
    return elem;
}

function onFocus() {
    const label = getLabel(this);
    if (label) {
        label.classList.add('selectLabelFocused');
    }
}

function onBlur() {
    const label = getLabel(this);
    if (label) {
        label.classList.remove('selectLabelFocused');
    }
}

function onMouseDown(e) {
    // e.button=0 for primary (left) mouse button click
    if (!e.button && !enableNativeMenu()) {
        e.preventDefault();
        showActionSheet(this);
    }
}

function onKeyDown(e) {
    // Xbox controller for UWP WebView2 uses keycode 195 to select.
    if ((e.keyCode === 13 || e.keyCode === 195) && !enableNativeMenu()) {
        e.preventDefault();
        showActionSheet(this);
    }
}

let inputId = 0;

EmbySelectPrototype.createdCallback = function () {
    if (!this.id) {
        this.id = 'embyselect' + inputId;
        inputId++;
    }

    this.classList.add('emby-select-withcolor');

    if (layoutManager.tv) {
        this.classList.add('emby-select-focusscale');
    }

    this.addEventListener('mousedown', onMouseDown);
    this.addEventListener('keydown', onKeyDown);

    this.addEventListener('focus', onFocus);
    this.addEventListener('blur', onBlur);
};

EmbySelectPrototype.attachedCallback = function () {
    if (this.classList.contains('emby-select')) {
        return;
    }

    this.classList.add('emby-select');

    const label = this.ownerDocument.createElement('label');
    label.innerText = this.dataset.label || '';
    label.classList.add('selectLabel');
    label.htmlFor = this.id;
    this.parentNode?.insertBefore(label, this);

    if (this.classList.contains('emby-select-withcolor')) {
        this.parentNode?.insertAdjacentHTML('beforeend', '<div class="selectArrowContainer"><div style="visibility:hidden;display:none;">0</div><span class="selectArrow material-icons keyboard_arrow_down" aria-hidden="true"></span></div>');
    }
};

EmbySelectPrototype.setLabel = function (text) {
    const label = this.parentNode?.querySelector('label');

    label.innerText = text;
};

document.registerElement('emby-select', {
    prototype: EmbySelectPrototype,
    extends: 'select'
});

