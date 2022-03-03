import React, { FunctionComponent } from 'react';
import globalize from '../../../scripts/globalize';

const createCheckBoxElement = ({ labelClassName, type, className, title }: { labelClassName?: string, type?: string, className?: string, title?: string }) => ({
    __html: `<label class="${labelClassName}">
        <input
            is="emby-checkbox"
            type="${type}"
            class="${className}"
        />
        <span>${title}</span>
    </label>`
});

type IProps = {
    labelClassName?: string;
    type?: string;
    className?: string;
    title?: string
}

const CheckBoxElement: FunctionComponent<IProps> = ({ labelClassName, type, className, title }: IProps) => {
    return (
        <div
            className='sectioncheckbox'
            dangerouslySetInnerHTML={createCheckBoxElement({
                labelClassName: labelClassName ? labelClassName : '',
                type: type,
                className: className,
                title: globalize.translate(title)
            })}
        />
    );
};

export default CheckBoxElement;
