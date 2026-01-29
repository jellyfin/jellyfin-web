import React, { type FC } from 'react';
import type { ItemDto } from 'types/base/models/item-dto';
import type { ListOptions } from 'types/listOptions';
import { Box } from 'ui-primitives';
import InfoIconButton from '../../common/InfoIconButton';
import MoreVertIconButton from '../../common/MoreVertIconButton';
import PlaylistAddIconButton from '../../common/PlaylistAddIconButton';
import RightIconButtons from '../../common/RightIconButtons';
import FavoriteButton from '../../itemActions/FavoriteButton';
import PlayedButton from '../../itemActions/PlayedButton';
import itemHelper from '../../itemHelper';

interface ListViewUserDataButtonsProps {
    item: ItemDto;
    listOptions: ListOptions;
}

const ListViewUserDataButtons: FC<ListViewUserDataButtonsProps> = ({ item = {}, listOptions }) => {
    const { IsFavorite, Played } = item.UserData ?? {};

    const renderRightButtons = () => {
        return listOptions.rightButtons?.map((button, index) => (
            <RightIconButtons
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                className="listItemButton itemAction"
                id={button.id}
                title={button.title}
                icon={button.icon}
            />
        ));
    };

    return (
        <Box className="listViewUserDataButtons">
            {listOptions.addToListButton && (
                <PlaylistAddIconButton className="paper-icon-button-light listItemButton itemAction" />
            )}
            {listOptions.infoButton && (
                <InfoIconButton className="paper-icon-button-light listItemButton itemAction" />
            )}

            {listOptions.rightButtons && renderRightButtons()}

            {listOptions.enableUserDataButtons !== false && (
                <>
                    {itemHelper.canMarkPlayed(item) && listOptions.enablePlayedButton !== false && (
                        <PlayedButton
                            className="listItemButton"
                            isPlayed={Played}
                            itemId={item.Id}
                            itemType={item.Type}
                        />
                    )}

                    {itemHelper.canRate(item) && listOptions.enableRatingButton !== false && (
                        <FavoriteButton
                            className="listItemButton"
                            isFavorite={IsFavorite}
                            itemId={item.Id}
                        />
                    )}
                </>
            )}

            {listOptions.moreButton !== false && (
                <MoreVertIconButton className="paper-icon-button-light listItemButton itemAction" />
            )}
        </Box>
    );
};

export default ListViewUserDataButtons;
