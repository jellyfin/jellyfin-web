import PrimaryMediaInfo from 'components/mediainfo/PrimaryMediaInfo';
import * as React from 'react';
import { ItemDto } from 'types/base/models/item-dto';

interface MyProps {
    item: ItemDto;
    options?: {
        year?: boolean;
        runtime?: boolean;
        officialRating?: boolean;
        starRating?: boolean;
        criticRating?: boolean;
        endsAt?: boolean;
        originalAirDate?: boolean;
        subtitles?: boolean;
    };
}

function getDefaultOptions(options: MyProps['options']): MyProps['options'] {
    return {
        criticRating: options?.criticRating ?? true,
        endsAt: options?.endsAt ?? true,
        officialRating: options?.officialRating ?? true,
        runtime: options?.runtime ?? true,
        starRating: options?.starRating ?? true,
        year: options?.year ?? true,
        originalAirDate: options?.originalAirDate ?? true,
        subtitles: options?.subtitles ?? true
    };
}

export const MiscInfo: React.FC<MyProps> = ({ item, options: sentOptions }) => {
    const options = getDefaultOptions(sentOptions);
    return (
        <PrimaryMediaInfo
            className='secondary listItemMediaInfo'
            infoclass='mediaInfoText'
            item={item}
            showYearInfo={options?.year}
            showCriticRatingInfo={options?.criticRating}
            showEndsAtInfo={options?.endsAt}
            showRuntimeInfo={options?.runtime}
            showOfficialRatingInfo={options?.officialRating}
            showOriginalAirDateInfo={options?.originalAirDate}
            showStarRatingInfo={options?.starRating}
            showCaptionIndicatorInfo={options?.subtitles}
        />
    );
};

