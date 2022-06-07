import React, { FunctionComponent } from 'react';
import dom from '../../../../scripts/dom';
import CardImageContainer from './CardImageContainer';
import CardFooter from './CardFooter';
import { VirtualFolderInfo } from '@thornbill/jellyfin-sdk/dist/generated-client';

type IProps = {
    virtualFolder: IVirtualFolders;
    getCollectionTypeOptions: () => CollectionType[];
    index?: number
}

type CollectionType = {
    name?: string;
    value?: string;
    message?: string;
    hidden?: boolean;
}

type IVirtualFolders = VirtualFolderInfo & {
    icon?: string;
    showType?: boolean;
    showLocations?: boolean;
    showMenu?: boolean;
    showNameWithIcon?: boolean;
}

const Card: FunctionComponent<IProps> = ({ virtualFolder = {}, getCollectionTypeOptions, index }: IProps) => {
    let imgUrl;

    if (virtualFolder.PrimaryImageItemId) {
        imgUrl = window.ApiClient.getScaledImageUrl(virtualFolder.PrimaryImageItemId, {
            maxWidth: Math.round(dom.getScreenWidth() * 0.40),
            type: 'Primary'
        });
    }

    return (
        <div className='card backdropCard scalableCard backdropCard-scalable'
            data-index={index}
            data-id={virtualFolder.ItemId}
            style={{minWidth: '33.3%'}}
        >
            <div className='cardBox visualCardBox'>
                <div className='cardScalable visualCardBox-cardScalable'>
                    <div className='cardPadder cardPadder-backdrop'></div>
                    <CardImageContainer imgUrl={imgUrl} virtualFolder={virtualFolder} />
                </div>
                <CardFooter
                    virtualFolder={virtualFolder}
                    getCollectionTypeOptions={getCollectionTypeOptions}
                />
            </div>
        </div>
    );
};

export default Card;
