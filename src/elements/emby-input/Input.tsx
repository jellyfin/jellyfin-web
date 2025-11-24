import classNames from 'classnames';
import React, {
    type DetailedHTMLProps,
    type InputHTMLAttributes,
    useState,
    useCallback,
    forwardRef
} from 'react';

import './emby-input.scss';

interface InputProps
    extends DetailedHTMLProps<
        InputHTMLAttributes<HTMLInputElement>,
        HTMLInputElement
    > {
    id: string;
    label?: string;
    invalid?: boolean;
    invalidMessage?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ id, label, className, onBlur, onFocus, invalid, invalidMessage, ...props }, ref) => {
        const [isFocused, setIsFocused] = useState(false);

        const onBlurInternal = useCallback(
            (e: React.FocusEvent<HTMLInputElement, Element>) => {
                setIsFocused(false);
                onBlur?.(e);
            },
            [onBlur]
        );

        const onFocusInternal = useCallback(
            (e: React.FocusEvent<HTMLInputElement, Element>) => {
                setIsFocused(true);
                onFocus?.(e);
            },
            [onFocus]
        );

        return (
            <>
                <label
                    htmlFor={id}
                    className={classNames('inputLabel', {
                        inputLabelUnfocused: !isFocused,
                        inputLabelFocused: isFocused
                    })}
                >
                    {label}
                </label>
                <input
                    ref={ref}
                    id={id}
                    className={classNames('emby-input', className)}
                    onBlur={onBlurInternal}
                    onFocus={onFocusInternal}
                    aria-invalid={invalid}
                    {...invalid && invalidMessage ? { 'aria-describedby': `${id}-error` } : {}}
                    {...props}
                />
                {invalid && invalidMessage && (
                    <span id={`${id}-error`} role='alert' aria-live='polite'>
                        {invalidMessage}
                    </span>
                )}
            </>
        );
    }
);

Input.displayName = 'Input';

export default Input;
