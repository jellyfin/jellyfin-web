import React, { type FC, useCallback, useEffect, useMemo, useRef } from 'react';

import globalize from '../scripts/globalize';

interface CreateInputElementParams {
    type?: string
    id?: string
    label?: string
    initialValue?: string
    options?: string
}

const createInputElement = ({ type, id, label, initialValue, options }: CreateInputElementParams) => ({
    __html: `<input
        is="emby-input"
        type="${type}"
        id="${id}"
        label="${label}"
        value="${initialValue}"
        ${options}
    />`
});

type InputElementProps = {
    containerClassName?: string
    onChange?: (value: string) => void
} & CreateInputElementParams;

const InputElement: FC<InputElementProps> = ({
    containerClassName,
    initialValue,
    onChange = () => { /* no-op */ },
    type,
    id,
    label,
    options = ''
}) => {
    const container = useRef<HTMLDivElement>(null);

    // NOTE: We need to memoize the input html because any re-render will break the webcomponent
    const inputHtml = useMemo(() => (
        createInputElement({
            type,
            id,
            label: globalize.translate(label),
            initialValue,
            options
        })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ), []);

    const onInput = useCallback((e: Event) => {
        onChange((e.target as HTMLInputElement).value);
    }, [ onChange ]);

    useEffect(() => {
        const inputElement = container?.current?.querySelector<HTMLInputElement>('input');
        inputElement?.addEventListener('input', onInput);

        return () => {
            inputElement?.removeEventListener('input', onInput);
        };
    }, [ container, onInput ]);

    return (
        <div
            ref={container}
            className={containerClassName}
            dangerouslySetInnerHTML={inputHtml}
        />
    );
};

export default InputElement;
