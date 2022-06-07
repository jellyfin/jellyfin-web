import { VirtualFolderInfo } from '@thornbill/jellyfin-sdk/dist/generated-client';
import React, { FunctionComponent } from 'react';
import globalize from '../../../../scripts/globalize';

type IProps = {
    virtualFolder: IVirtualFolders;
    getCollectionTypeOptions: () => CollectionType[];
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

const CardTextSecondary: FunctionComponent<IProps> = ({virtualFolder, getCollectionTypeOptions}: IProps) => {
    let typeName = getCollectionTypeOptions().filter(function (t: CollectionType) {
        return t.value == virtualFolder.CollectionType;
    })[0];
    typeName = typeName ? typeName.name : globalize.translate('Other');
    return (
        <div className='cardText cardText-secondary'>
            {virtualFolder.showType === false ? <span>&nbsp;</span> : <span>{typeName}</span>}
        </div>

    );
};

export default CardTextSecondary;
