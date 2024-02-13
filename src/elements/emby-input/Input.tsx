import classNames from 'classnames';
import React, { type DetailedHTMLProps, type InputHTMLAttributes, type FC, useState, useCallback } from 'react';

import './emby-input.scss';

interface InputProps extends DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
    id: string,
    label?: string
}

const Input: FC<InputProps> = ({
    id,
    label,
    className,
    onBlur,
    onFocus,
    ...props
}) => {
    const [ isFocused, setIsFocused ] = useState(false);

    const onBlurInternal = useCallback(e => {
        setIsFocused(false);
        onBlur?.(e);
    }, [ onBlur ]);

    const onFocusInternal = useCallback(e => {
        setIsFocused(true);
        onFocus?.(e);
    }, [ onFocus ]);

    return (
        <>
            <label
                htmlFor={id}
                className={classNames(
                    'inputLabel',
                    {
                        inputLabelUnfocused: !isFocused,
                        inputLabelFocused: isFocused
                    }
                )}
            >
                {label}
            </label>
            <input
                id={id}
                className={classNames(
                    'emby-input',
                    className
                )}
                onBlur={onBlurInternal}
                onFocus={onFocusInternal}
                {...props}
            />
        </>
    );
};

export default Input;
