import React, { type FC } from 'react';
import IconButtonElement from '../../../elements/IconButtonElement';

interface BlockedTagListProps {
    tag?: string;
}

const BlockedTagList: FC<BlockedTagListProps> = ({ tag }) => {
    return (
        <div className='paperList'>
            <div className='listItem'>
                <div className='listItemBody'>
                    <h3 className='listItemBodyText'>
                        {tag}
                    </h3>
                </div>
                <IconButtonElement
                    is='paper-icon-button-light'
                    className='blockedTag btnDeleteTag listItemButton'
                    title='Delete'
                    icon='delete'
                    dataTag={tag}
                />
            </div>
        </div>
    );
};

export default BlockedTagList;
