import React, { FC, useCallback } from 'react';
import GenresItemsContainer from '../../components/common/GenresItemsContainer';
import { LibraryViewProps } from '../../types/interface';

const GenresView: FC<LibraryViewProps> = ({ topParentId }) => {
    const getItemTypes = useCallback(() => {
        return ['Series'];
    }, []);

    return (
        <GenresItemsContainer
            topParentId={topParentId}
            getItemTypes={getItemTypes}
        />
    );
};

export default GenresView;
