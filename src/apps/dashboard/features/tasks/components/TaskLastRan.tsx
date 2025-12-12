import React, { FunctionComponent, useMemo } from 'react';
import { TaskProps } from '@/apps/dashboard/features/tasks/types/taskProps';
import { useLocale } from '@/hooks/useLocale';
import { formatDistance, formatDistanceToNow, parseISO } from 'date-fns';
import Typography from '@mui/material/Typography';
import globalize from '@/lib/globalize';

const TaskLastRan: FunctionComponent<TaskProps> = ({ task }: TaskProps) => {
    const { dateFnsLocale } = useLocale();

    const [ lastRan, timeTaken ] = useMemo(() => {
        if (task.LastExecutionResult?.StartTimeUtc && task.LastExecutionResult?.EndTimeUtc) {
            const endTime = parseISO(task.LastExecutionResult.EndTimeUtc);
            const startTime = parseISO(task.LastExecutionResult.StartTimeUtc);

            return [
                formatDistanceToNow(endTime, { locale: dateFnsLocale, addSuffix: true }),
                formatDistance(startTime, endTime, { locale: dateFnsLocale })
            ];
        }
        return [];
    }, [task, dateFnsLocale]);

    if (task.State == 'Idle') {
        if (task.LastExecutionResult?.StartTimeUtc && task.LastExecutionResult?.EndTimeUtc) {
            const lastResultStatus = task.LastExecutionResult.Status;

            return (
                <Typography sx={{ lineHeight: '1.2rem', color: 'text.secondary' }} variant='body1'>
                    {globalize.translate('LabelScheduledTaskLastRan', lastRan, timeTaken)}

                    {lastResultStatus == 'Failed' && <Typography display='inline' color='error'>{` (${globalize.translate('LabelFailed')})`}</Typography>}
                    {lastResultStatus == 'Cancelled' && <Typography display='inline' color='blue'>{` (${globalize.translate('LabelCancelled')})`}</Typography>}
                    {lastResultStatus == 'Aborted' && <Typography display='inline' color='error'>{` (${globalize.translate('LabelAbortedByServerShutdown')})`}</Typography>}
                </Typography>
            );
        }
    } else {
        return (
            <Typography sx={{ color: 'text.secondary' }}>{globalize.translate('LabelStopping')}</Typography>
        );
    }
};

export default TaskLastRan;
