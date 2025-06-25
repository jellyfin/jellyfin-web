import { type FC } from 'react';
import classNames from 'classnames';
import Box from '@mui/material/Box';

interface CriticRatingMediaInfoProps {
    className?: string;
    criticRating: number;
}

const CriticRatingMediaInfo: FC<CriticRatingMediaInfoProps> = ({
    className,
    criticRating
}) => {
    const cssClass = classNames(
        'mediaInfoCriticRating',
        'mediaInfoItem',
        criticRating >= 60 ?
            'mediaInfoCriticRatingFresh' :
            'mediaInfoCriticRatingRotten',
        className
    );
    return <Box className={cssClass}>{criticRating}</Box>;
};

export default CriticRatingMediaInfo;
