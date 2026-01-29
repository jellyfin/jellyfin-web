import { formatDistance, formatDistanceToNow, parseISO } from 'date-fns';
import { useLocale } from 'hooks/useLocale';
import globalize from 'lib/globalize';
import React, { type FunctionComponent, useMemo } from 'react';
import { vars } from 'styles/tokens.css.ts';
import { Text } from 'ui-primitives';
import { type TaskProps } from '../types/taskProps';

const TaskLastRan: FunctionComponent<TaskProps> = ({ task }: TaskProps) => {
    const { dateFnsLocale } = useLocale();

    const [lastRan, timeTaken] = useMemo(() => {
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
                <Text size="xs" color="secondary">
                    {globalize.translate('LabelScheduledTaskLastRan', lastRan, timeTaken)}

                    {lastResultStatus === 'Failed' && (
                        <Text size="xs" color="error" style={{ display: 'inline' }}>
                            {` (${globalize.translate('LabelFailed')})`}
                        </Text>
                    )}
                    {lastResultStatus === 'Cancelled' && (
                        <Text size="xs" color="info" style={{ display: 'inline' }}>
                            {` (${globalize.translate('LabelCancelled')})`}
                        </Text>
                    )}
                    {lastResultStatus === 'Aborted' && (
                        <Text size="xs" color="error" style={{ display: 'inline' }}>
                            {` (${globalize.translate('LabelAbortedByServerShutdown')})`}
                        </Text>
                    )}
                </Text>
            );
        }
        return null;
    } else {
        return (
            <Text size="xs" color="secondary">
                {globalize.translate('LabelStopping')}
            </Text>
        );
    }
};

export default TaskLastRan;
