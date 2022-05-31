import React, { FunctionComponent } from 'react';
import globalize from '../../../scripts/globalize';

const createCheckBoxElement = ({ labelClassName, type, className, id, datafilter, title }: { labelClassName?: string, type?: string, className?: string, id?: string, datafilter?: string, title?: string }) => ({
    __html: `<label class="${labelClassName}">
        <input
            is="emby-checkbox"
            type="${type}"
            class="${className}"
            ${id}
            ${datafilter}
        />
        <span>${title}</span>
    </label>`
});

type IProps = {
    labelClassName?: string;
    type?: string;
    className?: string;
    id?: string;
    datafilter?: string;
    title?: string
}

const CheckBoxElement: FunctionComponent<IProps> = ({ labelClassName, type, className, id, datafilter, title }: IProps) => {
    return (
        <div
            className='sectioncheckbox'
            dangerouslySetInnerHTML={createCheckBoxElement({
                labelClassName: labelClassName ? labelClassName : '',
                type: type,
                className: className,
                id: id ? `id='${id}'` : '',
                datafilter: datafilter ? `data-filter='${datafilter}'` : '',
                title: globalize.translate(title)
            })}
        />
    );
};

export default CheckBoxElement;
