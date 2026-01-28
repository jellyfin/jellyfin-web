import React, { type FC } from 'react';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { getItemTypeIcon, getLibraryIcon } from 'utils/image';
import DefaultName from './DefaultName';
import type { ItemDto } from 'types/base/models/item-dto';
import { vars } from 'styles/tokens.css.ts';

interface DefaultIconTextProps {
    item: ItemDto;
    defaultCardImageIcon?: string;
}

const DefaultIconText: FC<DefaultIconTextProps> = ({ item, defaultCardImageIcon }) => {
    let icon: string | undefined;

    if (item.Type === BaseItemKind.CollectionFolder || item.CollectionType) {
        icon = getLibraryIcon(item.CollectionType);
    }

    if (!icon) {
        icon = getItemTypeIcon(item.Type, defaultCardImageIcon);
    }

    if (icon) {
        return (
            <span
                className={`cardImageIcon material-icons ${icon}`}
                aria-hidden="true"
                style={{ color: 'inherit', fontSize: vars.typography.fontSizeDisplay }}
            >
                {icon}
            </span>
        );
    }

    return <DefaultName item={item} />;
};

export default DefaultIconText;
