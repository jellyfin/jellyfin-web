
import React, { FunctionComponent, useCallback } from 'react';

import globalize from '../../scripts/globalize';
import ViewItemsContainer from '../components/ViewItemsContainer';

type IProps = {
    topParentId: string | null;
}

const TrailersView: FunctionComponent<IProps> = ({ topParentId }: IProps) => {
    const getBasekey = useCallback(() => {
        return 'trailers';
    }, []);

    const getFilterMode = useCallback(() => {
        return 'movies';
    }, []);

    const getItemTypes = useCallback(() => {
        return 'Trailer';
    }, []);

    const getNoItemsMessage = useCallback(() => {
        return 'MessageNoTrailersFound';
    }, []);

    const getSortMenuOptions = useCallback(() => {
        return [{
            name: globalize.translate('Name'),
            id: 'SortName'
        }, {
            name: globalize.translate('OptionImdbRating'),
            id: 'CommunityRating,SortName'
        }, {
            name: globalize.translate('OptionDateAdded'),
            id: 'DateCreated,SortName'
        }, {
            name: globalize.translate('OptionDatePlayed'),
            id: 'DatePlayed,SortName'
        }, {
            name: globalize.translate('OptionParentalRating'),
            id: 'OfficialRating,SortName'
        }, {
            name: globalize.translate('OptionPlayCount'),
            id: 'PlayCount,SortName'
        }, {
            name: globalize.translate('OptionReleaseDate'),
            id: 'PremiereDate,SortName'
        }];
    }, []);

    return (
        <ViewItemsContainer
            topParentId={topParentId}
            getBasekey={getBasekey}
            getFilterMode={getFilterMode}
            getItemTypes={getItemTypes}
            getSortMenuOptions={getSortMenuOptions}
            getNoItemsMessage={getNoItemsMessage}
        />
    );
};

export default TrailersView;
