import React, { FunctionComponent } from 'react';

type IProps = {
    className?: string;
    Name?: string;
    Id?: string;
}

const createCheckBoxElement = ({className, Name, Id}) => ({
    __html: `<label>
        <input
            type="checkbox"
            is="emby-checkbox"
            class="${className}"
            data-id="${Id}"
        />
        <span>${Name}</span>
    </label>`
});

const CheckBoxListItem: FunctionComponent<IProps> = ({className, Name, Id}: IProps) => {
    return (
        <div
            dangerouslySetInnerHTML={createCheckBoxElement({
                className: className,
                Name: Name,
                Id: Id
            })}
        />
    );
};

export default CheckBoxListItem;

