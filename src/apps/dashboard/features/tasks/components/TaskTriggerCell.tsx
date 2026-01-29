import type { TaskTriggerInfo } from '@jellyfin/sdk/lib/generated-client/models/task-trigger-info';
import type { CellContext } from '@tanstack/react-table';
import { useLocale } from 'hooks/useLocale';
import globalize from 'lib/globalize';
import React from 'react';
import { vars } from 'styles/tokens.css.ts';
import { Flex, Text } from 'ui-primitives';
import { getTriggerFriendlyName } from '../utils/edit';

const TaskTriggerCell = ({ cell }: CellContext<TaskTriggerInfo, TaskTriggerInfo>) => {
    const { dateFnsLocale } = useLocale();
    const trigger = cell.getValue();

    const timeLimitHours = trigger.MaxRuntimeTicks ? trigger.MaxRuntimeTicks / 36e9 : false;

    return (
        <Flex style={{ flexDirection: 'column', gap: vars.spacing['1'] }}>
            <Text as="span">{getTriggerFriendlyName(trigger, dateFnsLocale)}</Text>
            {timeLimitHours !== false && (
                <Text as="span" size="sm" color="secondary">
                    {timeLimitHours === 1
                        ? globalize.translate('ValueTimeLimitSingleHour')
                        : globalize.translate('ValueTimeLimitMultiHour', timeLimitHours)}
                </Text>
            )}
        </Flex>
    );
};

export default TaskTriggerCell;
