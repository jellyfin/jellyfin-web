import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import React, { type FC } from 'react';

import ItemsContainer from 'elements/emby-itemscontainer/ItemsContainer';
import { appRouter } from 'components/router/appRouter';
import imageHelper from 'utils/image';

interface LibraryButtonsSectionProps {
    sectionTitle: string;
    userViews: BaseItemDto[];
}

const LibraryButtonsSection: FC<LibraryButtonsSectionProps> = ({
    sectionTitle,
    userViews
}) => {
    return (
        <div className='verticalSection verticalSection-extrabottompadding'>
            <div className='sectionTitleContainer sectionTitleContainer-cards padded-left'>
                <h2 className='sectionTitle sectionTitle-cards'>
                    {sectionTitle}
                </h2>
            </div>

            <ItemsContainer
                className='itemsContainer padded-left padded-right vertical-wrap focuscontainer-x'
                isMultiSelectEnabled={false}
            >
                {userViews?.map((userView) => (
                    <a
                        key={'sectionConatiner' + userView?.Id}
                        href={appRouter.getRouteUrl(userView)}
                        className='emby-button raised homeLibraryButton'
                    >
                        <span
                            className={`material-icons homeLibraryIcon ${imageHelper.getLibraryIcon(
                                userView.CollectionType
                            )}`}
                            aria-hidden='true'
                        />
                        <span className='homeLibraryText'>{userView.Name}</span>
                    </a>
                ))}
            </ItemsContainer>
        </div>
    );
};

export default LibraryButtonsSection;
