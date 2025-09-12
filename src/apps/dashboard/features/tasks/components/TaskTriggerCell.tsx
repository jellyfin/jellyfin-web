import React, { FC } from 'react';
import type { MRT_Cell, MRT_RowData } from 'material-react-table';
import { useLocale } from 'hooks/useLocale';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { getTriggerFriendlyName } from '../utils/edit';
import type { TaskTriggerInfo } from '@jellyfin/sdk/lib/generated-client/models/task-trigger-info';
import globalize from 'lib/globalize';

interface CellProps {
    cell: MRT_Cell<MRT_RowData>
}

const TaskTriggerCell: FC<CellProps> = ({ cell }) => {
    const { dateFnsLocale } = useLocale();
    const trigger = cell.getValue<TaskTriggerInfo>();

    const timeLimitHours = trigger.MaxRuntimeTicks ? trigger.MaxRuntimeTicks / 36e9 : false;

    return (
        <Box>
            <Typography variant='body1'>{getTriggerFriendlyName(trigger, dateFnsLocale)}</Typography>
            {timeLimitHours && (
                <Typography variant='body2' color={'text.secondary'}>
                    {timeLimitHours === 1 ?
                        globalize.translate('ValueTimeLimitSingleHour') :
                        globalize.translate('ValueTimeLimitMultiHour', timeLimitHours)}
                </Typography>
            )}
        </Box>
    );
};

export default TaskTriggerCell;
