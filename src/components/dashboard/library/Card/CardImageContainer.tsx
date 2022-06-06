import { VirtualFolderInfo } from '@thornbill/jellyfin-sdk/dist/generated-client';
import escapeHTML from 'escape-html';
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
    showIndicators?: boolean;
    showNameWithIcon?: boolean;
    elementId?: string;
}

const CardImageContainer: FunctionComponent<IProps> = ({virtualFolder, imgUrl}: IProps) => {
    const renderImgUrl = () => {
        if (imgUrl) {
            return (
                <div className={`cardImageContainer editLibrary ${imgUrl ? '' : cardBuilder.getDefaultBackgroundClass()}`} style={{cursor: 'pointer'}}>
                    <img src={imgUrl} alt='' style={{width: '100%'}}/>
                    {virtualFolder.showIndicators === false ? null : <CardIndicators virtualFolder={virtualFolder} />}
                </div>
            );
        } else if (!virtualFolder.showNameWithIcon) {
            return (
                <div className={`cardImageContainer editLibrary ${cardBuilder.getDefaultBackgroundClass()}`} style={{cursor: 'pointer'}}>
                    <span className={`cardImageIcon material-icons ${virtualFolder.icon || imagehelper.getLibraryIcon(virtualFolder.CollectionType)}`} aria-hidden='true'></span>
                    {virtualFolder.showIndicators !== false && (
                        <CardIndicators virtualFolder={virtualFolder} />
                    )}
                </div>
            );
        }

        if (!imgUrl && virtualFolder.showNameWithIcon) {
            return (
                <h3 className='cardImageContainer addLibrary' style={{position: 'absolute', top: '0', right: '0', bottom: '0', cursor: 'pointer', flexDirection: 'column' }}>
                    <span className={`cardImageIcon material-icons ${virtualFolder.icon || imagehelper.getLibraryIcon(virtualFolder.CollectionType)}`} aria-hidden='true'></span>

                    {virtualFolder.showNameWithIcon && (
                        <div style={{margin: '1em 0', width: '100%'}}>
                            {escapeHTML(virtualFolder.Name)}
                        </div>)}

                </h3>
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
