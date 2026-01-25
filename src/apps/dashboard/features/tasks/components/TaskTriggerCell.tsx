import React from 'react';
import { useLocale } from 'hooks/useLocale';
import { Flex } from 'ui-primitives/Box';
import { Text } from 'ui-primitives/Text';
import { getTriggerFriendlyName } from '../utils/edit';
import type { TaskTriggerInfo } from '@jellyfin/sdk/lib/generated-client/models/task-trigger-info';
import globalize from 'lib/globalize';
import type { CellContext } from '@tanstack/react-table';

const TaskTriggerCell = ({ cell }: CellContext<TaskTriggerInfo, TaskTriggerInfo>) => {
    const { dateFnsLocale } = useLocale();
    const trigger = cell.getValue();

    const timeLimitHours = trigger.MaxRuntimeTicks ? trigger.MaxRuntimeTicks / 36e9 : false;

    return (
        <Flex style={{ flexDirection: 'column', gap: '4px' }}>
            <Text as='span'>{getTriggerFriendlyName(trigger, dateFnsLocale)}</Text>
            {timeLimitHours !== false && (
                <Text as='span' size='sm' color='secondary'>
                    {timeLimitHours === 1 ?
                        globalize.translate('ValueTimeLimitSingleHour') :
                        globalize.translate('ValueTimeLimitMultiHour', timeLimitHours)}
                </Text>
            )}
        </Flex>
    );
};

export default TaskTriggerCell;
