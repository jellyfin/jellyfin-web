import React, { FC, useCallback } from 'react';
import IconButton from '@mui/material/IconButton';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

import { useGetDownload } from '@/hooks/api/libraryHooks';
import globalize from '@/lib/globalize';
import { download } from '@/scripts/fileDownloader';
import type { NullableString } from '@/types/base/common/shared/types';

interface DownloadButtonProps {
    itemId: string;
    itemServerId: NullableString,
    itemName: NullableString,
    itemPath: NullableString,
}

const DownloadButton: FC<DownloadButtonProps> = ({ itemId, itemServerId, itemName, itemPath }) => {
    const { data: downloadHref } = useGetDownload({ itemId });

    const onDownloadClick = useCallback(async () => {
        download([
            {
                url: downloadHref,
                itemId: itemId,
                serverId: itemServerId,
                title: itemName,
                filename: itemPath?.replace(/^.*[\\/]/, '')
            }
        ]);
    }, [downloadHref, itemId, itemName, itemPath, itemServerId]);

    return (
        <IconButton
            className='button-flat btnDownload'
            title={globalize.translate('Download')}
            onClick={onDownloadClick}
        >
            <FileDownloadIcon />
        </IconButton>
    );
};

export default DownloadButton;
