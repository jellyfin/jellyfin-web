import { VirtualFolderInfo } from '@thornbill/jellyfin-sdk/dist/generated-client';
import React, { FunctionComponent } from 'react';
import globalize from '../../../../scripts/globalize';

type IProps = {
    virtualFolder: IVirtualFolders;
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

const CardTextTertiary: FunctionComponent<IProps> = ({virtualFolder}: IProps) => {
    const renderContent = () => {
        if (virtualFolder.showLocations === false) {
            return (
                <span>&nbsp;</span>
            );
        } else if (virtualFolder.Locations?.length && virtualFolder.Locations.length === 1) {
            return (
                <span>{virtualFolder.Locations[0]}</span>
            );
        } else {
            return (
                <span>{globalize.translate('NumLocationsValue', virtualFolder.Locations?.length)}</span>
            );
        }
    };

    return (
        <div className='cardText cardText-secondary'>
            {renderContent()}
        </div>
    );
};

export default CardTextTertiary;
