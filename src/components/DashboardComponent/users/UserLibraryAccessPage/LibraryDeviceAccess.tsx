import React, { FunctionComponent } from 'react';

type IProps = {
    user: any;
    Name: string;
    Id: string;
    AppName: string
}

const createCheckBoxElement = ({Name, Id, AppName, checkedAttribute}) => ({
    __html: `<label>
        <input
            type="checkbox"
            is="emby-checkbox"
            class="chkDevice"
            data-id="${Id}" ${checkedAttribute}
        />
        <span>${Name} - ${AppName}</span>
    </label>`
});

const LibraryDeviceAccess: FunctionComponent<IProps> = ({user, Name, Id, AppName}: IProps) => {
    const isChecked = user.Policy.EnableAllDevices || user.Policy.EnabledDevices.indexOf(Id) != -1;
    const checkedAttribute = isChecked ? ' checked="checked"' : '';
    return (
        <div
            dangerouslySetInnerHTML={createCheckBoxElement({
                Name: Name,
                Id: Id,
                AppName: AppName,
                checkedAttribute: checkedAttribute
            })}
        />
    );
};

export default LibraryDeviceAccess;

