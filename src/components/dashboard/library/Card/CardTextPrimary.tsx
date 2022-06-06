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
    showIndicators?: boolean;
    showNameWithIcon?: boolean;
    elementId?: string;
}

const CardTextPrimary: FunctionComponent<IProps> = ({virtualFolder}: IProps) => {
    return (
        <div className='cardText'>
            {virtualFolder.showNameWithIcon ? <span>&nbsp;</span> : <span>{escapeHTML(virtualFolder.Name)}</span>}
        </div>
    );
};

export default CardTextPrimary;
