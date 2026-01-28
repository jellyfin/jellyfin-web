import React, { type FC } from 'react';
import classNames from 'classnames';
import { Box } from 'ui-primitives';

interface CaptionMediaInfoProps {
    className?: string;
}

const CaptionMediaInfo: FC<CaptionMediaInfoProps> = ({ className }) => {
    const cssClass = classNames('mediaInfoItem', 'closedCaptionMediaInfoText', className);

    return (
        <Box className={cssClass}>
            <span className="material-icons" aria-hidden="true">
                closed_caption
            </span>
        </Box>
    );
};

export default CaptionMediaInfo;
