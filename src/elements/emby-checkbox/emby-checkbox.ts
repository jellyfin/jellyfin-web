import browser from '../../scripts/browser';
import dom from '../../scripts/dom';
import './emby-checkbox.scss';
import 'webcomponents.js/webcomponents-lite';

const EmbyCheckboxPrototype = Object.create(HTMLInputElement.prototype);

function onKeyDown(e) {
    // Don't submit form on enter
    // Real (non-emulator) Tizen does nothing on Space
    if (e.keyCode === 13 || (e.keyCode === 32 && browser.tizen)) {
        e.preventDefault();

        this.checked = !this.checked;

        this.dispatchEvent(new CustomEvent('change', {
            bubbles: true
        }));

        return false;
    }
}

const enableRefreshHack = browser.tizen || browser.orsay || browser.operaTv || browser.web0s;

function forceRefresh(loading) {
    const elem = this.parentNode;

    elem.style.webkitAnimationName = 'repaintChrome';
    elem.style.webkitAnimationDelay = (loading === true ? '500ms' : '');
    elem.style.webkitAnimationDuration = '10ms';
    elem.style.webkitAnimationIterationCount = '1';

    setTimeout(function () {
        elem.style.webkitAnimationName = '';
    }, (loading === true ? 520 : 20));
}

EmbyCheckboxPrototype.attachedCallback = function () {
    if (this.getAttribute('data-embycheckbox') === 'true') {
        return;
    }

    this.setAttribute('data-embycheckbox', 'true');

    this.classList.add('emby-checkbox');

    const labelElement = this.parentNode;
    labelElement.classList.add('emby-checkbox-label');

    const labelTextElement = labelElement.querySelector('span');

    let outlineClass = 'checkboxOutline';

    const customClass = this.getAttribute('data-outlineclass');
    if (customClass) {
        outlineClass += ' ' + customClass;
    }

    const checkedIcon = this.getAttribute('data-checkedicon') || 'check';
    const uncheckedIcon = this.getAttribute('data-uncheckedicon') || '';
    const checkHtml = '<span class="material-icons checkboxIcon checkboxIcon-checked ' + checkedIcon + '" aria-hidden="true"></span>';
    const uncheckedHtml = '<span class="material-icons checkboxIcon checkboxIcon-unchecked ' + uncheckedIcon + '" aria-hidden="true"></span>';
    labelElement.insertAdjacentHTML('beforeend', '<span class="' + outlineClass + '">' + checkHtml + uncheckedHtml + '</span>');

    labelTextElement.classList.add('checkboxLabel');

    this.addEventListener('keydown', onKeyDown);

    if (enableRefreshHack) {
        forceRefresh.call(this, true);
        dom.addEventListener(this, 'click', forceRefresh, {
            passive: true
        });
        dom.addEventListener(this, 'blur', forceRefresh, {
            passive: true
        });
        dom.addEventListener(this, 'focus', forceRefresh, {
            passive: true
        });
        dom.addEventListener(this, 'change', forceRefresh, {
            passive: true
        });
    }
};

EmbyCheckboxPrototype.detachedCallback = function () {
    this.removeEventListener('keydown', onKeyDown);

    dom.removeEventListener(this, 'click', forceRefresh, {
        passive: true
    });
    dom.removeEventListener(this, 'blur', forceRefresh, {
        passive: true
    });
    dom.removeEventListener(this, 'focus', forceRefresh, {
        passive: true
    });
    dom.removeEventListener(this, 'change', forceRefresh, {
        passive: true
    });
};

document.registerElement('emby-checkbox', {
    prototype: EmbyCheckboxPrototype,
    extends: 'input'
});

