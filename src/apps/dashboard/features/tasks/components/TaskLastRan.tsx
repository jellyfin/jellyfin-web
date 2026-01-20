import React, { FunctionComponent, useMemo } from 'react';
import { TaskProps } from '../types/taskProps';
import { useLocale } from 'hooks/useLocale';
import { formatDistance, formatDistanceToNow, parseISO } from 'date-fns';
import Typography from '@mui/joy/Typography';
import globalize from 'lib/globalize';

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

    if (task.State === 'Idle') {
        if (task.LastExecutionResult?.StartTimeUtc && task.LastExecutionResult?.EndTimeUtc) {
            const lastResultStatus = task.LastExecutionResult.Status;

            return (
                <Typography level="body-xs" color="neutral">
                    {globalize.translate('LabelScheduledTaskLastRan', lastRan, timeTaken)}

                    {lastResultStatus === 'Failed' && (
                        <Typography level="body-xs" color="danger" sx={{ display: 'inline' }}>
                            {` (${globalize.translate('LabelFailed')})`}
                        </Typography>
                    )}
                    {lastResultStatus === 'Cancelled' && (
                        <Typography level="body-xs" color="primary" sx={{ display: 'inline' }}>
                            {` (${globalize.translate('LabelCancelled')})`}
                        </Typography>
                    )}
                    {lastResultStatus === 'Aborted' && (
                        <Typography level="body-xs" color="danger" sx={{ display: 'inline' }}>
                            {` (${globalize.translate('LabelAbortedByServerShutdown')})`}
                        </Typography>
                    )}
                </Typography>
            );
        }
        return null;
    } else {
        return (
            <Typography level="body-xs" color="neutral">
                {globalize.translate('LabelStopping')}
            </Typography>
        );
    }
};

export default TaskLastRan;