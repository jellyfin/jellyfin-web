import { type FC } from 'react';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
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
                <Link
                    className={classNames(textAction.cssClass, className)}
                    href={textAction.url}
                    title={textAction.title}
                    color='inherit'
                >
                    {textAction.title}
                </Link>
            );
        } else {
            return text;
        }
    };

    return (
        <Box className={classNames('mediaInfoItem', cssClass, type, className)}>
            {renderText()}
        </Box>
    );
};

export default MediaInfoItem;
