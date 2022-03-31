import escapeHtml from 'escape-html';
import React, { FunctionComponent } from 'react';

type IProps = {
    className?: string;
    Name?: string;
    Id?: string;
    ItemType?: string;
    AppName?: string;
    checkedAttribute?: string;
}

const createCheckBoxElement = ({className, Name, dataAttributes, AppName, checkedAttribute}: {className?: string, Name?: string, dataAttributes?: string, AppName?: string, checkedAttribute?: string}) => ({
    __html: `<label>
        <input
            type="checkbox"
            is="emby-checkbox"
            class="${className}"
            ${dataAttributes} ${checkedAttribute}
        />
        <span>${escapeHtml(Name || '')} ${AppName}</span>
    </label>`
});

const CheckBoxListItem: FunctionComponent<IProps> = ({className, Name, Id, ItemType, AppName, checkedAttribute}: IProps) => {
    return (
        <div
            className='sectioncheckbox'
            dangerouslySetInnerHTML={createCheckBoxElement({
                className: className,
                Name: Name,
                dataAttributes: ItemType ? `data-itemtype='${ItemType}'` : `data-id='${Id}'`,
                AppName: AppName ? `- ${AppName}` : '',
                checkedAttribute: checkedAttribute
            })}
        />
    );
};

export default CheckBoxListItem;

