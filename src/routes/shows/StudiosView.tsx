import React, { FC, useCallback } from 'react';
import ViewItemsContainer from '../../components/common/ViewItemsContainer';
import { LibraryViewProps } from '../../types/interface';

const StudiosView: FC<LibraryViewProps> = ({ topParentId }) => {
    const getBasekey = useCallback(() => {
        return 'studios';
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
            getBasekey={getBasekey}
            isBtnFilterEnabled={false}
            isBtnSelectViewEnabled={false}
            isBtnSortEnabled={false}
            isAlphaPickerEnabled={false}
            getItemTypes={getItemTypes}
            getNoItemsMessage={getNoItemsMessage}
        />
    );
};

export default StudiosView;
