import React, { type FC } from 'react';
import globalize from '../scripts/globalize';

interface IconButtonElementProps {
    is?: string;
    id?: string;
    title?: string;
    className?: string;
    icon?: string,
    dataIndex?: string | number;
    dataTag?: string | number;
    dataProfileid?: string | number;
}

const createIconButtonElement = ({ is, id, className, title, icon, dataIndex, dataTag, dataProfileid }: IconButtonElementProps) => ({
    __html: `<button
        is="${is}"
        type="button"
        ${id}
        class="${className}"
        ${title}
        ${dataIndex}
        ${dataTag}
        ${dataProfileid}
    >
        <span class="material-icons ${icon}" aria-hidden="true"></span>
    </button>`
});

const IconButtonElement: FC<IconButtonElementProps> = ({ is, id, className, title, icon, dataIndex, dataTag, dataProfileid }) => {
    return (
        <div
            dangerouslySetInnerHTML={createIconButtonElement({
                is: is,
                id: id ? `id="${id}"` : '',
                className: className,
                title: title ? `title="${globalize.translate(title)}"` : '',
                icon: icon,
                dataIndex: dataIndex ? `data-index="${dataIndex}"` : '',
                dataTag: dataTag ? `data-tag="${dataTag}"` : '',
                dataProfileid: dataProfileid ? `data-profileid="${dataProfileid}"` : ''
            })}
        />
    );
};

export default IconButtonElement;
