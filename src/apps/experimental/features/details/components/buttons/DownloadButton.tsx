import React, { FC, useCallback } from 'react';
import { IconButton } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useGetDownload } from 'hooks/api/libraryHooks';
import globalize from 'scripts/globalize';
import { download } from 'scripts/fileDownloader';
import type { ItemDto } from 'types/base/models/item-dto';

interface DownloadButtonProps {
    item: ItemDto;
}

const DownloadButton: FC<DownloadButtonProps> = ({ item }) => {
    const {
        data: downloadHref
    } = useGetDownload({
        itemId: item?.Id || ''
    });

    const onDownloadClick = useCallback(async () => {
        download([
            {
                url: downloadHref,
                itemId: item?.Id,
                serverId: item?.ServerId,
                title: item?.Name,
                filename: item?.Path?.replace(/^.*[\\/]/, '')
            }
        ]);
    }, [downloadHref, item?.Id, item?.Name, item?.Path, item?.ServerId]);

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
