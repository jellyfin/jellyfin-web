import React, { FC, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';

import { useCancelSeriesTimer } from 'hooks/api/liveTvHooks';
import globalize from 'lib/globalize';
import loading from 'components/loading/loading';
import toast from 'components/toast/toast';
import confirm from 'components/confirm/confirm';

interface CancelSeriesTimerButtonProps {
    itemId: string;
}

const CancelSeriesTimerButton: FC<CancelSeriesTimerButtonProps> = ({
    itemId
}) => {
    const navigate = useNavigate();
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
                        timerId: itemId
                    },
                    {
                        onSuccess:  () => {
                            toast(globalize.translate('SeriesCancelled'));
                            loading.hide();
                            navigate('/livetv');
                        },
                        onError: (err: unknown) => {
                            loading.hide();
                            toast(globalize.translate('MessageCancelSeriesTimerError'));
                            console.error(
                                '[cancelSeriesTimer] failed to cancel series timer',
                                err
                            );
                        }
                    }
                );
            })
            .catch(() => {
                // confirm dialog closed
            });
    }, [cancelSeriesTimer, navigate, itemId]);

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
