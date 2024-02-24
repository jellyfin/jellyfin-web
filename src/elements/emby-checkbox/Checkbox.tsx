import React from 'react';
import classNames from 'classnames';

import browser from '../../scripts/browser';

interface Props {
    label: React.ReactNode;
    outlineClassName?: string;
    labelClassName?: string;
    // input props
    checked?: boolean;
    className?: string;
    id?: string;
    name?: string;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    defaultChecked?: boolean;
}

const CheckBox: React.FC<Props> = ({ label, outlineClassName, labelClassName, className, ...inputProps }) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        const input = inputRef.current;
        if (!input) return; // should never happen

        input.addEventListener('keydown', onKeyDown);

        const passive = { passive: true } as EventListenerOptions;
        if (enableRefreshHack) {
            input.addEventListener('click', forceRefresh, passive);
            input.addEventListener('blur', forceRefresh, passive);
            input.addEventListener('focus', forceRefresh, passive);
            input.addEventListener('change', forceRefresh, passive);
        }

        return () => {
            input.removeEventListener('keydown', onKeyDown);
            if (enableRefreshHack) {
                input.removeEventListener('click', forceRefresh, passive);
                input.removeEventListener('blur', forceRefresh, passive);
                input.removeEventListener('focus', forceRefresh, passive);
                input.removeEventListener('change', forceRefresh, passive);
            }
        };
    }, []);

    return (
        <label className={classNames('emby-checkbox-label', labelClassName)}>
            <input ref={inputRef} className={classNames('emby-checkbox', className)} type='checkbox' {...inputProps } />
            <span className='checkboxLabel'>{label}</span>
            <span className={classNames('checkboxOutline', outlineClassName)}>
                <span className='material-icons checkboxIcon checkboxIcon-checked check' aria-hidden='true'></span>
                <span className='material-icons checkboxIcon checkboxIcon-unchecked' aria-hidden='true'></span>
            </span>
        </label>
    );
};

const enableRefreshHack = browser.tizen || browser.orsay || browser.operaTv || browser.web0s;

function onKeyDown(this: HTMLInputElement, e: KeyboardEvent) {
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

function forceRefresh(this: HTMLInputElement, loading: unknown) {
    const elem = this.parentNode as HTMLSpanElement;

    elem.style.webkitAnimationName = 'repaintChrome';
    elem.style.webkitAnimationDelay = (loading === true ? '500ms' : '');
    elem.style.webkitAnimationDuration = '10ms';
    elem.style.webkitAnimationIterationCount = '1';

    setTimeout(function () {
        elem.style.webkitAnimationName = '';
    }, (loading === true ? 520 : 20));
}

export default CheckBox;
