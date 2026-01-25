import React, { type FC, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { IconButton } from 'ui-primitives/IconButton';
import { TrashIcon } from '@radix-ui/react-icons';

import { useCancelSeriesTimer } from 'hooks/api/liveTvHooks';
import globalize from 'lib/globalize';
import loading from 'components/loading/loading';
import toast from 'components/toast/toast';
import confirm from 'components/confirm/confirm';

interface CancelSeriesTimerButtonProps {
    itemId: string;
}

const CancelSeriesTimerButton: FC<CancelSeriesTimerButtonProps> = ({ itemId }) => {
    const navigate = useNavigate();
    const cancelSeriesTimer = useCancelSeriesTimer();

    const onCancelSeriesTimerClick = useCallback(() => {
        confirm({
            text: globalize.translate('MessageConfirmRecordingCancellation'),
            primary: 'delete',
            confirmText: globalize.translate('HeaderCancelSeries'),
            cancelText: globalize.translate('HeaderKeepSeries')
        })
            .then(() => {
                loading.show();
                cancelSeriesTimer.mutate(
                    {
                        timerId: itemId
                    },
                    {
                        onSuccess: async () => {
                            toast(globalize.translate('SeriesCancelled'));
                            loading.hide();
                            navigate({ to: '/livetv' });
                        },
                        onError: (err: unknown) => {
                            loading.hide();
                            toast(globalize.translate('MessageCancelSeriesTimerError'));
                            console.error('[cancelSeriesTimer] failed to cancel series timer', err);
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
            className="button-flat btnCancelSeriesTimer"
            title={globalize.translate('CancelSeries')}
            onClick={onCancelSeriesTimerClick}
        >
            <TrashIcon />
        </IconButton>
    );
};

export default CancelSeriesTimerButton;
