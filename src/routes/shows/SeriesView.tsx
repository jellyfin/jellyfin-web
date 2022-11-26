import React, { FC, useCallback } from 'react';
import ViewItemsContainer from '../../components/common/ViewItemsContainer';
import { LibraryViewProps } from '../../types/interface';

const SeriesView: FC<LibraryViewProps> = ({ topParentId }) => {
    const getBasekey = useCallback(() => {
        return 'series';
    }, []);

    const getItemTypes = useCallback(() => {
        return ['Series'];
    }, []);

    const getNoItemsMessage = useCallback(() => {
        return 'MessageNoItemsAvailable';
    }, []);

    return (
        <ViewItemsContainer
            topParentId={topParentId}
            isBtnShuffleEnabled={true}
            getBasekey={getBasekey}
            getItemTypes={getItemTypes}
            getNoItemsMessage={getNoItemsMessage}
        />
    );
};

export default SeriesView;
