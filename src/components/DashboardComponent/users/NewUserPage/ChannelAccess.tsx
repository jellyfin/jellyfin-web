import React, { FunctionComponent } from 'react';

type IProps = {
    Name: string;
    Id: string;
}

const createCheckBoxElement = ({Name, Id}) => ({
    __html: `<label>
    <input
    type="checkbox"
    is="emby-checkbox"
    class="chkChannel"
    data-id="${Id}"
    />
    <span>${Name}</span>
    </label>`
});

const ChannelAccess: FunctionComponent<IProps> = ({Name, Id}: IProps) => {
    return (
        <div
            dangerouslySetInnerHTML={createCheckBoxElement({
                Name: Name,
                Id: Id
            })}
        />
    );
};

export default ChannelAccess;

