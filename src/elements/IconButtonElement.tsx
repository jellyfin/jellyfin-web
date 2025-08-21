import React, { FunctionComponent } from 'react';

import globalize from 'lib/globalize';

type IProps = {
    is?: string;
    id?: string;
    title?: string;
    className?: string;
    icon?: string,
    dataIndex?: string | number;
    dataTag?: string | number;
    dataProfileid?: string | number;
    onClick?: () => void;
};

const createIconButtonElement = ({ is, id, className, title, icon, dataIndex, dataTag, dataProfileid }: IProps) => ({
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

const IconButtonElement: FunctionComponent<IProps> = ({ is, id, className, title, icon, dataIndex, dataTag, dataProfileid, onClick }: IProps) => {
    const button = createIconButtonElement({
        is: is,
        id: id ? `id="${id}"` : '',
        className: className,
        title: title ? `title="${globalize.translate(title)}"` : '',
        icon: icon,
        dataIndex: (dataIndex || dataIndex === 0) ? `data-index="${dataIndex}"` : '',
        dataTag: dataTag ? `data-tag="${dataTag}"` : '',
        dataProfileid: dataProfileid ? `data-profileid="${dataProfileid}"` : ''
    });

    if (onClick !== undefined) {
        return (
            <button
                style={{ all: 'unset' }}
                dangerouslySetInnerHTML={button}
                onClick={onClick}
            />
        );
    }

    return (
        <div
            dangerouslySetInnerHTML={button}
        />
    );
};

export default IconButtonElement;
