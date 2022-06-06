import { VirtualFolderInfo } from '@thornbill/jellyfin-sdk/dist/generated-client';
import React, { FunctionComponent } from 'react';
import CardTextPrimary from './CardTextPrimary';
import CardTextSecondary from './CardTextSecondary';
import CardTextTertiary from './CardTextTertiary';

const createButtonElement = () => ({
    __html: `<button
    type="button"
    is="paper-icon-button-light"
    class="btnCardMenu autoSize"
    >
    <span class="material-icons more_vert" aria-hidden="true"></span>
    </button>`
});

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
    showIndicators?: boolean;
    showNameWithIcon?: boolean;
    elementId?: string;
}

const CardFooter: FunctionComponent<IProps> = ({virtualFolder, getCollectionTypeOptions}: IProps) => {
    return (
        <div className='cardFooter visualCardBox-cardFooter'>
            {virtualFolder.showMenu !== false && (
                <div
                    style={{textAlign: 'right', float: 'right', paddingTop: '5px'}}
                    dangerouslySetInnerHTML={createButtonElement()}
                />
            )}
            <CardTextPrimary virtualFolder={virtualFolder} />
            <CardTextSecondary virtualFolder={virtualFolder} getCollectionTypeOptions={getCollectionTypeOptions}/>
            <CardTextTertiary virtualFolder={virtualFolder} />
        </div>
    );
};

export default CardFooter;
