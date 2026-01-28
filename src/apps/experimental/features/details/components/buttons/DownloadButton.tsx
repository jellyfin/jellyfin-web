import React, { type FC, useCallback } from 'react';
import { IconButton } from 'ui-primitives';
import { DownloadIcon } from '@radix-ui/react-icons';

import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';
import { download } from 'scripts/fileDownloader';
import type { NullableString } from 'types/base/common/shared/types';

interface DownloadButtonProps {
    itemId: string;
    itemServerId: NullableString;
    itemName: NullableString;
    itemPath: NullableString;
}

const DownloadButton: FC<DownloadButtonProps> = ({ itemId, itemServerId, itemName, itemPath }) => {
    const { __legacyApiClient__ } = useApi();
    const downloadHref = __legacyApiClient__?.getUrl(`Items/${itemId}/Download`) || '';

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
            className="button-flat btnDownload"
            title={globalize.translate('Download')}
            onClick={onDownloadClick}
        >
            <DownloadIcon />
        </IconButton>
    );
};

export default DownloadButton;
