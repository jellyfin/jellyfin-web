import React from 'react';
import classNames from 'classnames';

import browser from '../../scripts/browser';

type CheckboxProps = {
    label: React.ReactNode;
    outlineClassName?: string;
    labelClassName?: string;
} & JSX.IntrinsicElements['input'];

const Checkbox: React.FC<CheckboxProps> = ({ label, outlineClassName, labelClassName, className, onKeyDown, ...inputProps }) => {
    const wrappedKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
        if (onKeyDown) {
            onKeyDown(event);
            if (event.defaultPrevented) {
                return;
            }
        }

        // Don't submit form on enter
        // Real (non-emulator) Tizen does nothing on Space
        if (event.keyCode === 13 || (event.keyCode === 32 && browser.tizen)) {
            event.preventDefault();

            event.currentTarget.checked = !event.currentTarget.checked;
            event.currentTarget.dispatchEvent(new CustomEvent('change', {
                bubbles: true
            }));

            return false;
        }
    }, [onKeyDown]);
    return (
        <label className={classNames('emby-checkbox-label', labelClassName)}>
            <input onKeyDown={wrappedKeyDown} className={classNames('emby-checkbox', className)} type='checkbox' {...inputProps } />
            <span className='checkboxLabel'>{label}</span>
            <span className={classNames('checkboxOutline', outlineClassName)}>
                <span className='material-icons checkboxIcon checkboxIcon-checked check' aria-hidden='true'></span>
                <span className='material-icons checkboxIcon checkboxIcon-unchecked' aria-hidden='true'></span>
            </span>
        </label>
    );
};

export default Checkbox;
