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
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ id, label, className, onBlur, onFocus, type, ...props }, ref) => {
        const [isFocused, setIsFocused] = useState(false);
        const [passwordVisible, setPasswordVisible] = useState(false);

        const onBlurInternal = useCallback(
            (e: React.FocusEvent<HTMLInputElement>) => {
                setIsFocused(false);
                onBlur?.(e);
            },
            [onBlur]
        );

        const onFocusInternal = useCallback(
            (e: React.FocusEvent<HTMLInputElement>) => {
                setIsFocused(true);
                onFocus?.(e);
            },
            [onFocus]
        );

        if (type === 'password') {
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
                    <div className='emby-password-input-wrapper'>
                        <input
                            ref={ref}
                            id={id}
                            className={classNames('emby-input', className)}
                            onBlur={onBlurInternal}
                            onFocus={onFocusInternal}
                            type={passwordVisible ? 'text' : 'password'}
                            {...props}
                        />
                        <button
                            type='button'
                            className='emby-input-iconbutton paper-icon-button-light'
                            onClick={() => setPasswordVisible(prev => !prev)}
                            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                        >
                            <span className='material-icons' aria-hidden='true'>
                                {passwordVisible ? 'visibility' : 'visibility_off'}
                            </span>
                        </button>
                    </div>
                </>
            );
        }

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
                    type={type}
                    {...props}
                />
            </>
        );
    }
);

Input.displayName = 'Input';

export default Input;
