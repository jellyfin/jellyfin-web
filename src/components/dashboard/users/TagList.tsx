import { FunctionComponent, useCallback } from 'react';
import IconButtonElement from '../../../elements/IconButtonElement';

type IProps = {
    tag?: string,
    tagType?: string;
    removeTagCallback?: (tag: string) => void;
};

const TagList: FunctionComponent<IProps> = ({ tag, tagType, removeTagCallback }: IProps) => {
    const onClick = useCallback(() => {
        tag !== undefined && removeTagCallback !== undefined && removeTagCallback(tag);
    }, [tag, removeTagCallback]);
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
                    className={`${tagType} btnDeleteTag listItemButton`}
                    title='Delete'
                    icon='delete'
                    dataTag={tag}
                    onClick={onClick}
                />
            </div>
        </div>
    );
};

export default TagList;
