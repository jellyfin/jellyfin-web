import React, { type FC } from 'react';
import { Box } from 'ui-primitives/Box';
import classNames from 'classnames';
import type { MiscInfo } from 'types/mediaInfoItem';

interface MediaInfoItemProps {
    className?: string;
    miscInfo: MiscInfo ;

}

const MediaInfoItem: FC<MediaInfoItemProps> = ({ className, miscInfo }) => {
    const { text, textAction, cssClass, type } = miscInfo;

    // eslint-disable-next-line sonarjs/function-return-type
    const renderText = () => {
        if (textAction) {
            return (
                <a
                    className={classNames(textAction.cssClass, className)}
                    href={textAction.url}
                    title={textAction.title}
                >
                    {textAction.title}
                </a>
            );
        }

        return text;
    };

    return (
        <Box className={classNames('mediaInfoItem', cssClass, type, className)}>
            {renderText()}
        </Box>
    );
};

export default MediaInfoItem;
