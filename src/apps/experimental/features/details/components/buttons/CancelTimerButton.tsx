import React, { FC, useCallback } from 'react';
import { IconButton } from '@mui/material';
import StopIcon from '@mui/icons-material/Stop';
import { useQueryClient } from '@tanstack/react-query';
import { useCancelTimer } from 'hooks/api/liveTvHooks';
import globalize from 'scripts/globalize';
import loading from 'components/loading/loading';
import toast from 'components/toast/toast';

interface CancelTimerButtonProps {
    timerId: string;
}

const CancelTimerButton: FC<CancelTimerButtonProps> = ({ timerId }) => {
    const queryClient = useQueryClient();
    const cancelTimer = useCancelTimer();

    const onCancelTimerClick = useCallback(() => {
        loading.show();
        cancelTimer.mutate(
            {
                timerId: timerId
            },
            {
                onSuccess: async () => {
                    loading.hide();
                    toast(globalize.translate('RecordingCancelled'));

                    await queryClient.invalidateQueries({
                        queryKey: ['DetailsItem']
                    });
                }
            }
        );
    }, [cancelTimer, queryClient, timerId]);

    return (
        <IconButton
            className='button-flat btnCancelTimer'
            title={globalize.translate('StopRecording')}
            onClick={onCancelTimerClick}
        >
            <StopIcon />
        </IconButton>
    );
};

export default CancelTimerButton;
