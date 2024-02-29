import React from 'react';
import classNames from 'classnames';

import browser from '../../scripts/browser';

interface CheckboxProps {
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

const Checkbox: React.FC<CheckboxProps> = ({ label, outlineClassName, labelClassName, className, ...inputProps }) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        const input = inputRef.current;
        if (!input) return; // should never happen

        input.addEventListener('keydown', onKeyDown);

        return () => {
            input.removeEventListener('keydown', onKeyDown);
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
