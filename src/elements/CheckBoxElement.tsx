import escapeHTML from 'escape-html';
import React, { type FC } from 'react';

import globalize from 'lib/globalize';

const createCheckBoxElement = ({
    labelClassName,
    className,
    id,
    dataFilter,
    dataItemType,
    dataId,
    checkedAttribute,
    renderContent
}: {
    labelClassName?: string;
    type?: string;
    className?: string;
    id?: string;
    dataFilter?: string;
    dataItemType?: string;
    dataId?: string;
    checkedAttribute?: string;
    renderContent?: string;
}) => ({
    __html: `<label ${labelClassName}>
        <input
            is="emby-checkbox"
            type="checkbox"
            class="${className}"
            ${id}
            ${dataFilter}
            ${dataItemType}
            ${dataId}
            ${checkedAttribute}
        />
        ${renderContent}
    </label>`
});

interface CheckBoxElementProps {
    labelClassName?: string;
    className?: string;
    elementId?: string;
    dataFilter?: string;
    itemType?: string;
    itemId?: string | null;
    itemAppName?: string | null;
    itemCheckedAttribute?: string;
    itemName?: string | null;
    title?: string;
}

const CheckBoxElement: FC<CheckBoxElementProps> = ({
    labelClassName,
    className,
    elementId,
    dataFilter,
    itemType,
    itemId,
    itemAppName,
    itemCheckedAttribute,
    itemName,
    title
}) => {
    const appName = itemAppName ? `- ${itemAppName}` : '';
    const renderContent = itemName
        ? `<span>${escapeHTML(itemName || '')} ${appName}</span>`
        : `<span>${globalize.translate(title)}</span>`;

    return (
        <div
            className="sectioncheckbox"
            dangerouslySetInnerHTML={createCheckBoxElement({
                labelClassName: labelClassName ? `class='${labelClassName}'` : '',
                className: className,
                id: elementId ? `id='${elementId}'` : '',
                dataFilter: dataFilter ? `data-filter='${dataFilter}'` : '',
                dataItemType: itemType ? `data-itemtype='${itemType}'` : '',
                dataId: itemId ? `data-id='${itemId}'` : '',
                checkedAttribute: itemCheckedAttribute || '',
                renderContent: renderContent
            })}
        />
    );
};

export default CheckBoxElement;
