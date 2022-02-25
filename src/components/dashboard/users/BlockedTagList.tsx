import React, { FunctionComponent } from 'react';

const createButtonElement = (tag?: string) => ({
    __html: `<button
        type='button'
        is='paper-icon-button-light'
        class='blockedTag btnDeleteTag listItemButton'
        data-tag='${tag}'
    >
        <span class='material-icons delete' aria-hidden='true' />
    </button>`
});

type IProps = {
    tag?: string;
}

const BlockedTagList: FunctionComponent<IProps> = ({tag}: IProps) => {
    return (
        <div className='paperList'>
            <div className='listItem'>
                <div className='listItemBody'>
                    <h3 className='listItemBodyText'>
                        {tag}
                    </h3>
                </div>
                <div
                    dangerouslySetInnerHTML={createButtonElement(tag)}
                />
            </div>

        </div>
    );
};

export default BlockedTagList;
