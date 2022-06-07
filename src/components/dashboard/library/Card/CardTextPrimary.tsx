import { VirtualFolderInfo } from '@thornbill/jellyfin-sdk/dist/generated-client';
import escapeHTML from 'escape-html';
import React, { FunctionComponent } from 'react';

type IProps = {
    virtualFolder: IVirtualFolders;
}

type IVirtualFolders = VirtualFolderInfo & {
    icon?: string;
    showType?: boolean;
    showLocations?: boolean;
    showMenu?: boolean;
    showNameWithIcon?: boolean;
}

const CardTextPrimary: FunctionComponent<IProps> = ({virtualFolder}: IProps) => {
    return (
        <div className='cardText'>
            <span>{escapeHTML(virtualFolder.Name)}</span>
        </div>
    );
};

export default CardTextPrimary;
