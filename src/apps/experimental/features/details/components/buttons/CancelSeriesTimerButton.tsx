import React, { FC, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

import { useCancelSeriesTimer } from 'hooks/api/liveTvHooks';
import globalize from 'scripts/globalize';
import loading from 'components/loading/loading';
import toast from 'components/toast/toast';
import confirm from 'components/confirm/confirm';

interface CancelSeriesTimerButtonProps {
    timerId: string;
}

const CancelSeriesTimerButton: FC<CancelSeriesTimerButtonProps> = ({
    timerId
}) => {
    const navigate = useNavigate();
    //const queryClient = useQueryClient();
    const cancelSeriesTimer = useCancelSeriesTimer();

    const onCancelSeriesTimerClick = useCallback(() => {
        confirm({
            text: globalize.translate('MessageConfirmRecordingCancellation'),
            primary: 'delete',
            confirmText: globalize.translate('HeaderCancelSeries'),
            cancelText: globalize.translate('HeaderKeepSeries')
        })
            .then(function () {
                loading.show();
                cancelSeriesTimer.mutate(
                    {
                        timerId: timerId
                    },
                    {
                        onSuccess: async () => {
                            toast(globalize.translate('SeriesCancelled'));
                            loading.hide();
                            // await queryClient.invalidateQueries({
                            //     queryKey: ['DetailsItem']
                            // });
                            navigate('/livetv.html');
                        },
                        onError: (err: unknown) => {
                            console.error(
                                '[splitVersions] failed to cancel series timer',
                                err
                            );
                        }
                    }
                );
            })
            .catch(() => {
                // confirm dialog closed
            });
    }, [cancelSeriesTimer, navigate, timerId]);

    return (
        <IconButton
            className='button-flat btnCancelSeriesTimer'
            title={globalize.translate('CancelSeries')}
            onClick={onCancelSeriesTimerClick}
        >
            <DeleteIcon />
        </IconButton>
    );
};

export default CancelSeriesTimerButton;
