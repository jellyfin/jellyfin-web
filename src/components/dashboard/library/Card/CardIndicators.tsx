import { VirtualFolderInfo } from '@thornbill/jellyfin-sdk/dist/generated-client';
import React, { FunctionComponent } from 'react';

const createItemRefreshIndicator = ({ className, dataprogress, datastatus }: { className?: string, dataprogress?: number, datastatus?: string | null; }) => ({
    __html: `<div
    is="emby-itemrefreshindicator"
    ${className}
    data-progress=${dataprogress}
    data-status=${datastatus}>
    </div>`
});

type IProps = {
    virtualFolder: VirtualFolderInfo;
}

const CardIndicators: FunctionComponent<IProps> = ({virtualFolder}: IProps) => {
    return (
        <div className='cardIndicators backdropCardIndicators' dangerouslySetInnerHTML={createItemRefreshIndicator({
            className: virtualFolder.RefreshProgress || virtualFolder.RefreshStatus && virtualFolder.RefreshStatus !== 'Idle' ? '' : 'class="hide"',
            dataprogress: virtualFolder.RefreshProgress || 0,
            datastatus: virtualFolder.RefreshStatus
        })}
        />
    );
};

export default CardIndicators;
