import { VirtualFolderInfo } from '@thornbill/jellyfin-sdk/dist/generated-client';
import React, { FunctionComponent } from 'react';
import imagehelper from '../../../../scripts/imagehelper';
import cardBuilder from '../../../cardbuilder/cardBuilder';
import CardIndicators from './CardIndicators';

type IProps = {
    virtualFolder: IVirtualFolders;
    imgUrl?: string;
}

type IVirtualFolders = VirtualFolderInfo & {
    icon?: string;
    showType?: boolean;
    showLocations?: boolean;
    showMenu?: boolean;
    showNameWithIcon?: boolean;
}

const CardImageContainer: FunctionComponent<IProps> = ({virtualFolder, imgUrl}: IProps) => {
    const renderImgUrl = () => {
        if (imgUrl) {
            return (
                <div className='cardImageContainer editLibrary' style={{cursor: 'pointer'}}>
                    <img src={imgUrl} alt='' style={{width: '100%'}}/>
                    <CardIndicators virtualFolder={virtualFolder} />
                </div>
            );
        } else if (!virtualFolder.showNameWithIcon) {
            return (
                <div className={`cardImageContainer editLibrary ${cardBuilder.getDefaultBackgroundClass()}`} style={{cursor: 'pointer'}}>
                    <span className={`cardImageIcon material-icons ${virtualFolder.icon || imagehelper.getLibraryIcon(virtualFolder.CollectionType)}`} aria-hidden='true'></span>
                    <CardIndicators virtualFolder={virtualFolder} />
                </div>
            );
        }

        if (!imgUrl && virtualFolder.showNameWithIcon) {
            return (
                <div className={`cardImageContainer addLibrary ${cardBuilder.getDefaultBackgroundClass()}`} style={{cursor: 'pointer'}}>
                    <span className={`cardImageIcon material-icons ${virtualFolder.icon || imagehelper.getLibraryIcon(virtualFolder.CollectionType)}`} aria-hidden='true'></span>
                </div>
            );
        }
    };

    return (
        <div className='cardContent'>
            {renderImgUrl()}
        </div>
    );
};

export default CardImageContainer;
