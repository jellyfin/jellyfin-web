import classNames from 'classnames';
import React, { type FC } from 'react';
import type { MiscInfo } from 'types/mediaInfoItem';
import { Box } from 'ui-primitives';

interface MediaInfoItemProps {
    className?: string;
    miscInfo: MiscInfo;
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
        <Box className={classNames('mediaInfoItem', cssClass, type, className)}>{renderText()}</Box>
    );
};

export default MediaInfoItem;
