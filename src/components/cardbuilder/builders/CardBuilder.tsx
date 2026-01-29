import { ServerConnections } from 'lib/jellyfin-apiclient';
import React from 'react';
import { vars } from 'styles/tokens.css.ts';
import { Grid } from 'ui-primitives';
import imageHelper from '../../../utils/image';
import BaseCard from '../Card/BaseCard';
import { CardOptions, getCardImageUrl, setCardData } from '../cardBuilder';

interface CardBuilderProps {
    items: any[];
    options?: CardOptions;
    onItemClick?: (item: any) => void;
}

const CardBuilder: React.FC<CardBuilderProps> = ({ items, options = {}, onItemClick }) => {
    const normalizedOptions = { ...options };
    setCardData(items, normalizedOptions);

    return (
        <Grid container spacing="md">
            {items.map((item, index) => {
                const apiClient = ServerConnections.getApiClient(
                    item.ServerId || normalizedOptions.serverId
                );
                const imgInfo = getCardImageUrl(
                    item,
                    apiClient,
                    normalizedOptions,
                    normalizedOptions.shape || 'portrait'
                );
                const icon = (
                    <span
                        className={`material-icons ${imageHelper.getLibraryIcon(item.CollectionType) || imageHelper.getItemTypeIcon(item.Type)}`}
                        style={{ fontSize: 48 }}
                    />
                );

                return (
                    <Grid
                        key={item.Id || index}
                        xs={12}
                        sm={6}
                        md={4}
                        lg={normalizedOptions.shape === 'backdrop' ? 3 : 2}
                    >
                        <BaseCard
                            title={item.Name}
                            text={item.ProductionYear?.toString()}
                            image={imgInfo.imgUrl}
                            icon={icon}
                            onClick={() => onItemClick?.(item)}
                        />
                    </Grid>
                );
            })}
        </Grid>
    );
};

export default CardBuilder;
