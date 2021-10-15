import React, { FunctionComponent } from 'react';

type IProps = {
    className?: string;
    Name?: string;
    Id?: string;
    AppName?: string;
    checkedAttribute?: string;
}

const createCheckBoxElement = ({className, Name, Id, AppName, checkedAttribute}) => ({
    __html: `<label>
        <input
            type="checkbox"
            is="emby-checkbox"
            class="${className}"
            data-id="${Id}" ${checkedAttribute}
        />
        <span>${Name} ${AppName}</span>
    </label>`
});

const CheckBoxListItem: FunctionComponent<IProps> = ({className, Name, Id, AppName, checkedAttribute}: IProps) => {
    return (
        <div
            dangerouslySetInnerHTML={createCheckBoxElement({
                className: className,
                Name: Name,
                Id: Id,
                AppName: AppName ? `- ${AppName}` : '',
                checkedAttribute: checkedAttribute
            })}
        />
    );
};

export default CheckBoxListItem;

