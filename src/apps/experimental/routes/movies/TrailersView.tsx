
import React, { FC, useCallback } from 'react';

import ViewItemsContainer from '../../../../components/common/ViewItemsContainer';
import { LibraryViewProps } from '../../../../types/interface';

const TrailersView: FC<LibraryViewProps> = ({ topParentId }) => {
    const getBasekey = useCallback(() => {
        return 'trailers';
    }, []);

    const getItemTypes = useCallback(() => {
        return ['Trailer'];
    }, []);

    const getNoItemsMessage = useCallback(() => {
        return 'MessageNoTrailersFound';
    }, []);

    return (
        <ViewItemsContainer
            topParentId={topParentId}
            getBasekey={getBasekey}
            getItemTypes={getItemTypes}
            getNoItemsMessage={getNoItemsMessage}
        />
    );
};

export default TrailersView;
