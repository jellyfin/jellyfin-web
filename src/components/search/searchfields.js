import layoutManager from 'layoutManager';
import globalize from 'globalize';
import events from 'events';
import browser from 'browser';
import AlphaPicker from 'alphaPicker';
import 'emby-input';
import 'flexStyles';
import 'material-icons';
import 'css!./searchfields';

/* eslint-disable indent */

    function onSearchTimeout() {
        const instance = this;
        let value = instance.nextSearchValue;

        value = (value || '').trim();
        events.trigger(instance, 'search', [value]);
    }

    function triggerSearch(instance, value) {
        if (instance.searchTimeout) {
            clearTimeout(instance.searchTimeout);
        }

        instance.nextSearchValue = value;
        instance.searchTimeout = setTimeout(onSearchTimeout.bind(instance), 400);
    }

    function onAlphaValueClicked(e) {
        const value = e.detail.value;
        const searchFieldsInstance = this;

        const txtSearch = searchFieldsInstance.options.element.querySelector('.searchfields-txtSearch');

        if (value === 'backspace') {
            const val = txtSearch.value;
            txtSearch.value = val.length ? val.substring(0, val.length - 1) : '';
        } else {
            txtSearch.value += value;
        }

        txtSearch.dispatchEvent(new CustomEvent('input', {
            bubbles: true
        }));
    }

    function initAlphaPicker(alphaPickerElement, instance) {
        instance.alphaPicker = new AlphaPicker({
            element: alphaPickerElement,
            mode: 'keyboard'
        });

        alphaPickerElement.addEventListener('alphavalueclicked', onAlphaValueClicked.bind(instance));
    }

    function onSearchInput(e) {
        const value = e.target.value;
        const searchFieldsInstance = this;
        triggerSearch(searchFieldsInstance, value);
    }

    function embed(elem, instance, options) {
        import('text!./searchfields.template.html').then(({default: template}) => {
            let html = globalize.translateHtml(template, 'core');

            if (browser.tizen || browser.orsay) {
                html = html.replace('<input ', '<input readonly ');
            }

            elem.innerHTML = html;

            elem.classList.add('searchFields');

            const txtSearch = elem.querySelector('.searchfields-txtSearch');

            if (layoutManager.tv) {
                const alphaPickerElement = elem.querySelector('.alphaPicker');

                elem.querySelector('.alphaPicker').classList.remove('hide');
                initAlphaPicker(alphaPickerElement, instance);
            }

            txtSearch.addEventListener('input', onSearchInput.bind(instance));

            instance.focus();
        });
    }

class SearchFields {
    constructor(options) {
        this.options = options;
        embed(options.element, this, options);
    }
    focus() {
        this.options.element.querySelector('.searchfields-txtSearch').focus();
    }
    destroy() {
        const options = this.options;
        if (options) {
            options.element.classList.remove('searchFields');
        }
        this.options = null;

        const alphaPicker = this.alphaPicker;
        if (alphaPicker) {
            alphaPicker.destroy();
        }
        this.alphaPicker = null;

        const searchTimeout = this.searchTimeout;
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        this.searchTimeout = null;
        this.nextSearchValue = null;
    }
}

export default SearchFields;

/* eslint-enable indent */
