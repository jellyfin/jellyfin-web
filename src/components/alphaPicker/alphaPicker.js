/**
 * Module alphaPicker.
 * @module components/alphaPicker/alphaPicker
 */

import focusManager from '../focusManager';
import layoutManager from '../layoutManager';
import dom from '../../utils/dom';
import globalize from '../../lib/globalize';
import './style.scss';
import '../../elements/emby-button/paper-icon-button-light';
import 'material-design-icons-iconfont';

const selectedButtonClass = 'alphaPickerButton-selected';

function focus() {
    const scope = this;
    const selected = scope.querySelector(`.${selectedButtonClass}`);

    if (selected) {
        focusManager.focus(selected);
    } else {
        focusManager.autoFocus(scope, true);
    }
}

function getAlphaPickerButtonClassName(vertical) {
    let alphaPickerButtonClassName = 'alphaPickerButton';

    if (layoutManager.tv) {
        alphaPickerButtonClassName += ' alphaPickerButton-tv';
    }

    if (vertical) {
        alphaPickerButtonClassName += ' alphaPickerButton-vertical';
    }

    return alphaPickerButtonClassName;
}

function getLetterButton(l, vertical) {
    return `<button data-value="${l}" class="${getAlphaPickerButtonClassName(vertical)}">${l}</button>`;
}

function mapLetters(letters, vertical) {
    return letters.map(l => {
        return getLetterButton(l, vertical);
    });
}

function render(element, options) {
    element.classList.add('alphaPicker');

    if (layoutManager.tv) {
        element.classList.add('alphaPicker-tv');
    }

    const vertical = element.classList.contains('alphaPicker-vertical');

    if (!vertical) {
        element.classList.add('focuscontainer-x');
    }

    let html = '';
    let letters;

    const alphaPickerButtonClassName = getAlphaPickerButtonClassName(vertical);

    let rowClassName = 'alphaPickerRow';

    if (vertical) {
        rowClassName += ' alphaPickerRow-vertical';
    }

    html += `<div class="${rowClassName}">`;
    if (options.mode === 'keyboard') {
        html += `<button data-value=" " is="paper-icon-button-light" class="${alphaPickerButtonClassName}" aria-label="${globalize.translate('ButtonSpace')}"><span class="material-icons alphaPickerButtonIcon space_bar" aria-hidden="true"></span></button>`;
    } else {
        letters = ['#'];
        html += mapLetters(letters, vertical).join('');
    }

    letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    html += mapLetters(letters, vertical).join('');

    if (options.mode === 'keyboard') {
        html += `<button data-value="backspace" is="paper-icon-button-light" class="${alphaPickerButtonClassName}" aria-label="${globalize.translate('ButtonBackspace')}"><span class="material-icons alphaPickerButtonIcon backspace" aria-hidden="true"></span></button>`;
        html += '</div>';

        letters = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        html += `<div class="${rowClassName}">`;
        html += '<br/>';
        html += mapLetters(letters, vertical).join('');
        html += '</div>';
    } else {
        html += '</div>';
    }

    element.innerHTML = html;

    element.classList.add('focusable');
    element.focus = focus;
}

export class AlphaPicker {
    constructor(options) {
        const self = this;

        this.options = options;

        const element = options.element;
        const itemsContainer = options.itemsContainer;
        const itemClass = options.itemClass;

        let itemFocusValue;
        let itemFocusTimeout;

        function onItemFocusTimeout() {
            itemFocusTimeout = null;
            self.value(itemFocusValue);
        }

        let alphaFocusedElement;
        let alphaFocusTimeout;

        function onAlphaFocusTimeout() {
            alphaFocusTimeout = null;

            if (document.activeElement === alphaFocusedElement) {
                const value = alphaFocusedElement.getAttribute('data-value');
                self.value(value, true);
            }
        }

        function onAlphaPickerInKeyboardModeClick(e) {
            const alphaPickerButton = dom.parentWithClass(e.target, 'alphaPickerButton');

            if (alphaPickerButton) {
                const value = alphaPickerButton.getAttribute('data-value');

                element.dispatchEvent(new CustomEvent('alphavalueclicked', {
                    cancelable: false,
                    detail: {
                        value
                    }
                }));
            }
        }

        function onAlphaPickerClick(e) {
            const alphaPickerButton = dom.parentWithClass(e.target, 'alphaPickerButton');

            if (alphaPickerButton) {
                const value = alphaPickerButton.getAttribute('data-value');
                if ((this._currentValue || '').toUpperCase() === value.toUpperCase()) {
                    this.value(null, true);
                } else {
                    this.value(value, true);
                }
            }
        }

        function onAlphaPickerFocusIn(e) {
            if (alphaFocusTimeout) {
                clearTimeout(alphaFocusTimeout);
                alphaFocusTimeout = null;
            }

            const alphaPickerButton = dom.parentWithClass(e.target, 'alphaPickerButton');

            if (alphaPickerButton) {
                alphaFocusedElement = alphaPickerButton;
                alphaFocusTimeout = setTimeout(onAlphaFocusTimeout, 600);
            }
        }

        function onItemsFocusIn(e) {
            const item = dom.parentWithClass(e.target, itemClass);

            if (item) {
                const prefix = item.getAttribute('data-prefix');
                if (prefix?.length) {
                    itemFocusValue = prefix[0];
                    if (itemFocusTimeout) {
                        clearTimeout(itemFocusTimeout);
                    }
                    itemFocusTimeout = setTimeout(onItemFocusTimeout, 100);
                }
            }
        }

        this.enabled = function (enabled) {
            if (enabled) {
                if (itemsContainer) {
                    itemsContainer.addEventListener('focus', onItemsFocusIn, true);
                }

                if (options.mode === 'keyboard') {
                    element.addEventListener('click', onAlphaPickerInKeyboardModeClick);
                }

                if (options.valueChangeEvent !== 'click') {
                    element.addEventListener('focus', onAlphaPickerFocusIn, true);
                } else {
                    element.addEventListener('click', onAlphaPickerClick.bind(this));
                }
            } else {
                if (itemsContainer) {
                    itemsContainer.removeEventListener('focus', onItemsFocusIn, true);
                }

                element.removeEventListener('click', onAlphaPickerInKeyboardModeClick);
                element.removeEventListener('focus', onAlphaPickerFocusIn, true);
                element.removeEventListener('click', onAlphaPickerClick.bind(this));
            }
        };

        render(element, options);

        this.enabled(true);
        this.visible(true);
    }

    value(value, applyValue) {
        const element = this.options.element;

        if (value !== undefined) {
            this._handleSelectedButtonState(element, value);
        }

        if (applyValue) {
            this._dispatchValueChangeEvent(element, value);
        }

        return this._currentValue;
    }

    _handleSelectedButtonState(element, value) {
        if (value == null) {
            this._currentValue = value;
            this._clearSelection(element);
            return;
        }

        const normalizedValue = value.toUpperCase();
        this._currentValue = normalizedValue;

        if (this.options.mode === 'keyboard') {
            return;
        }

        const currentSelected = element.querySelector(`.${selectedButtonClass}`);
        const targetButton = this._findButtonByValue(element, normalizedValue);

        this._updateButtonSelection(currentSelected, targetButton);
    }

    _findButtonByValue(element, value) {
        try {
            return element.querySelector(`.alphaPickerButton[data-value='${value}']`);
        } catch (err) {
            console.error('error in querySelector:', err);
            return null;
        }
    }

    _updateButtonSelection(currentSelected, targetButton) {
        if (targetButton && targetButton !== currentSelected) {
            targetButton.classList.add(selectedButtonClass);
        }

        if (currentSelected && currentSelected !== targetButton) {
            currentSelected.classList.remove(selectedButtonClass);
        }
    }

    _clearSelection(element) {
        const selected = element.querySelector(`.${selectedButtonClass}`);
        if (selected) {
            selected.classList.remove(selectedButtonClass);
        }
    }

    _dispatchValueChangeEvent(element, value) {
        element.dispatchEvent(new CustomEvent('alphavaluechanged', {
            cancelable: false,
            detail: { value }
        }));
    }

    on(name, fn) {
        const element = this.options.element;
        element.addEventListener(name, fn);
    }

    off(name, fn) {
        const element = this.options.element;
        element.removeEventListener(name, fn);
    }

    updateControls(query) {
        if (query.NameLessThan) {
            this.value('#');
        } else {
            this.value(query.NameStartsWith);
        }

        this.visible(query.SortBy.indexOf('SortName') !== -1);
    }

    visible(visible) {
        const element = this.options.element;
        element.style.visibility = visible ? 'visible' : 'hidden';
    }

    values() {
        const element = this.options.element;
        const elems = element.querySelectorAll('.alphaPickerButton');
        const values = [];
        for (let i = 0, length = elems.length; i < length; i++) {
            values.push(elems[i].getAttribute('data-value'));
        }

        return values;
    }

    focus() {
        const element = this.options.element;
        focusManager.autoFocus(element, true);
    }

    destroy() {
        const element = this.options.element;
        this.enabled(false);
        element.classList.remove('focuscontainer-x');
        this.options = null;
    }
}

export default AlphaPicker;
