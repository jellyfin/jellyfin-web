import { VirtualFolderInfo } from '@thornbill/jellyfin-sdk/dist/generated-client';
import React, { FunctionComponent } from 'react';
import IconButtonElement from '../../elements/IconButtonElement';
import CardTextPrimary from './CardTextPrimary';
import CardTextSecondary from './CardTextSecondary';
import CardTextTertiary from './CardTextTertiary';

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

const CardFooter: FunctionComponent<IProps> = ({virtualFolder, getCollectionTypeOptions}: IProps) => {
    return (
        <div className='cardFooter visualCardBox-cardFooter'>
            {virtualFolder.showMenu !== false && (
                <div
                    style={{textAlign: 'right', float: 'right', paddingTop: '5px'}}
                >
                    <IconButtonElement
                        is='paper-icon-button-light'
                        type='button'
                        className='btnCardMenu autoSize'
                        icon='more_vert'
                    />
                </div>
            )}
            <CardTextPrimary virtualFolder={virtualFolder} />
            <CardTextSecondary virtualFolder={virtualFolder} getCollectionTypeOptions={getCollectionTypeOptions}/>
            <CardTextTertiary virtualFolder={virtualFolder} />
        </div>
    );
};

export default CardFooter;
