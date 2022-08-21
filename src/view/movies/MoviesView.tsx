import React, { FunctionComponent, useCallback } from 'react';
import globalize from '../../scripts/globalize';

import ViewItemsContainer from '../components/ViewItemsContainer';

type IProps = {
    topParentId: string | null;
}

const MoviesView: FunctionComponent<IProps> = ({ topParentId }: IProps) => {
    const getBasekey = useCallback(() => {
        return 'movies';
    }, []);

    const getFilterMode = useCallback(() => {
        return 'movies';
    }, []);

    const getItemTypes = useCallback(() => {
        return 'Movie';
    }, []);

    const getNoItemsMessage = useCallback(() => {
        return 'MessageNoItemsAvailable';
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
            isBtnShuffleEnabled={true}
            getBasekey={getBasekey}
            getFilterMode={getFilterMode}
            getItemTypes={getItemTypes}
            getSortMenuOptions={getSortMenuOptions}
            getNoItemsMessage={getNoItemsMessage}
        />
    );
};

export default MoviesView;
