import classNames from 'classnames';
import React, {
    type DetailedHTMLProps,
    forwardRef,
    type InputHTMLAttributes,
    useCallback,
    useState
} from 'react';

import './emby-input.scss';
import { deprecate } from '../../utils/deprecation';

interface InputProps
    extends DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
    id: string;
    label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ id, label, className, onBlur, onFocus, ...props }, ref) => {
        deprecate('emby-input/Input', 'ui-primitives/Input', 'src/elements/emby-input/Input.tsx');

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
                    {...props}
                />
            </>
        );
    }
);

Input.displayName = 'Input';

export default Input;
