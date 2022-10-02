import React, { FC, useCallback } from 'react';

import globalize from '../../scripts/globalize';
import ViewItemsContainer from '../components/ViewItemsContainer';

interface FavoritesViewI {
    topParentId: string | null;
}

const FavoritesView: FC<FavoritesViewI> = ({ topParentId }) => {
    const getBasekey = useCallback(() => {
        return 'favorites';
    }, []);

    const getFilterMode = useCallback(() => {
        return 'movies';
    }, []);

    const getItemTypes = useCallback(() => {
        return 'Movie';
    }, []);

    const getNoItemsMessage = useCallback(() => {
        return 'MessageNoFavoritesAvailable';
    }, []);

    const getSortMenuOptions = useCallback(() => {
        return [{
            name: globalize.translate('Name'),
            id: 'SortName,ProductionYear'
        }, {
            name: globalize.translate('OptionRandom'),
            id: 'Random'
        }, {
            name: globalize.translate('OptionImdbRating'),
            id: 'CommunityRating,SortName,ProductionYear'
        }, {
            name: globalize.translate('OptionCriticRating'),
            id: 'CriticRating,SortName,ProductionYear'
        }, {
            name: globalize.translate('OptionDateAdded'),
            id: 'DateCreated,SortName,ProductionYear'
        }, {
            name: globalize.translate('OptionDatePlayed'),
            id: 'DatePlayed,SortName,ProductionYear'
        }, {
            name: globalize.translate('OptionParentalRating'),
            id: 'OfficialRating,SortName,ProductionYear'
        }, {
            name: globalize.translate('OptionPlayCount'),
            id: 'PlayCount,SortName,ProductionYear'
        }, {
            name: globalize.translate('OptionReleaseDate'),
            id: 'PremiereDate,SortName,ProductionYear'
        }, {
            name: globalize.translate('Runtime'),
            id: 'Runtime,SortName,ProductionYear'
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

export default FavoritesView;
