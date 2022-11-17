import React, { FC } from 'react';
import IconButton from '../../../elements/emby-button/IconButton';

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
                <IconButton
                    type='button'
                    className='blockedTag btnDeleteTag listItemButton'
                    title='Delete'
                    icon='delete'
                    data-tag={tag}
                />
            </div>
        </div>
    );
};

export default BlockedTagList;
