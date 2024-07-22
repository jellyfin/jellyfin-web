import React, { FC, useCallback } from 'react';
import { IconButton } from '@mui/material';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import { useQueryClient } from '@tanstack/react-query';
import { useDeleteAlternateSources } from 'hooks/api/videosHooks';
import globalize from 'scripts/globalize';
import confirm from 'components/confirm/confirm';
import loading from 'components/loading/loading';

interface SplitVersionsButtonProps {
    id: string;
}

const SplitVersionsButton: FC<SplitVersionsButtonProps> = ({ id }) => {
    const queryClient = useQueryClient();
    const deleteAlternateSources = useDeleteAlternateSources();

    const splitVersions = useCallback(() => {
        confirm(
            'Are you sure you wish to split the media sources into separate items?',
            'Split Media Apart'
        )
            .then(function () {
                loading.show();
                deleteAlternateSources.mutate(
                    {
                        itemId: id
                    },
                    {
                        onSuccess: async () => {
                            await queryClient.invalidateQueries({
                                queryKey: ['DetailsItem']
                            });
                            loading.hide();
                        },
                        onError: (err: unknown) => {
                            console.error(
                                '[splitVersions] failed to delete Videos',
                                err
                            );
                        }
                    }
                );
            })
            .catch(() => {
                // confirm dialog closed
            });
    }, [deleteAlternateSources, id, queryClient]);

    return (
        <IconButton
            className='button-flat btnSplitVersions'
            title={globalize.translate('ButtonSplit')}
            onClick={splitVersions}
        >
            <CallSplitIcon />
        </IconButton>
    );
};

export default SplitVersionsButton;
