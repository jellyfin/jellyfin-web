import React, { FunctionComponent, useCallback, useMemo, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import type { TaskTriggerInfo } from '@jellyfin/sdk/lib/generated-client/models/task-trigger-info';
import { TaskTriggerInfoType } from '@jellyfin/sdk/lib/generated-client/models/task-trigger-info-type';
import { DayOfWeek } from '@jellyfin/sdk/lib/generated-client/models/day-of-week';
import globalize from 'lib/globalize';
import { getTimeOfDayOptions } from '../utils/edit';
import { useLocale } from 'hooks/useLocale';

type IProps = {
    open: boolean,
    title: string,
    onClose?: () => void,
    onSubmit?: (trigger: TaskTriggerInfo) => void
};

const NewTriggerForm: FunctionComponent<IProps> = ({ open, title, onClose, onSubmit }: IProps) => {
    const { dateFnsLocale } = useLocale();
    const [triggerType, setTriggerType] = useState('DailyTrigger');

    const timeOfDayOptions = useMemo(() => getTimeOfDayOptions(dateFnsLocale), [dateFnsLocale]);

    const onTriggerTypeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setTriggerType(e.target.value);
    }, []);

    return (
        <Dialog
            open={open}
            maxWidth={'xs'}
            fullWidth
            PaperProps={{
                component: 'form',
                onSubmit: (e: React.FormEvent<HTMLFormElement>) => {
                    e.preventDefault();

                    const formData = new FormData(e.currentTarget);
                    const data = Object.fromEntries(formData.entries());
                    const trigger: TaskTriggerInfo = {
                        Type: data.TriggerType.toString() as TaskTriggerInfoType
                    };

                    if (trigger.Type == TaskTriggerInfoType.WeeklyTrigger) {
                        trigger.DayOfWeek = data.DayOfWeek.toString() as DayOfWeek;
                    }

                    if (trigger.Type == TaskTriggerInfoType.DailyTrigger || trigger.Type == TaskTriggerInfoType.WeeklyTrigger) {
                        trigger.TimeOfDayTicks = parseInt(data.TimeOfDay.toString(), 10);
                    }

                    if (trigger.Type == TaskTriggerInfoType.IntervalTrigger) {
                        trigger.IntervalTicks = parseInt(data.Interval.toString(), 10);
                    }

                    if (data.TimeLimit.toString()) {
                        trigger.MaxRuntimeTicks = parseFloat(data.TimeLimit.toString()) * 3600000 * 1e4;
                    }

                    if (onSubmit) {
                        onSubmit(trigger);
                    }
                }
            }}
        >
            <DialogTitle>{title}</DialogTitle>

            <DialogContent>
                <Stack spacing={3}>
                    <TextField
                        name='TriggerType'
                        select
                        fullWidth
                        value={triggerType}
                        onChange={onTriggerTypeChange}
                        label={globalize.translate('LabelTriggerType')}
                    >
                        <MenuItem value='DailyTrigger'>{globalize.translate('OptionDaily')}</MenuItem>
                        <MenuItem value='WeeklyTrigger'>{globalize.translate('OptionWeekly')}</MenuItem>
                        <MenuItem value='IntervalTrigger'>{globalize.translate('OptionOnInterval')}</MenuItem>
                        <MenuItem value='StartupTrigger'>{globalize.translate('OnApplicationStartup')}</MenuItem>
                    </TextField>

                    {triggerType == 'WeeklyTrigger' && (
                        <TextField
                            name='DayOfWeek'
                            select
                            fullWidth
                            defaultValue={'Sunday'}
                            label={globalize.translate('LabelDay')}
                        >
                            <MenuItem value='Sunday'>{globalize.translate('Sunday')}</MenuItem>
                            <MenuItem value='Monday'>{globalize.translate('Monday')}</MenuItem>
                            <MenuItem value='Tuesday'>{globalize.translate('Tuesday')}</MenuItem>
                            <MenuItem value='Wednesday'>{globalize.translate('Wednesday')}</MenuItem>
                            <MenuItem value='Thursday'>{globalize.translate('Thursday')}</MenuItem>
                            <MenuItem value='Friday'>{globalize.translate('Friday')}</MenuItem>
                            <MenuItem value='Saturday'>{globalize.translate('Saturday')}</MenuItem>
                        </TextField>
                    )}

                    {['DailyTrigger', 'WeeklyTrigger'].includes(triggerType) && (
                        <TextField
                            name='TimeOfDay'
                            select
                            fullWidth
                            defaultValue={'0'}
                            label={globalize.translate('LabelTime')}
                        >
                            {timeOfDayOptions.map((option) => {
                                return <MenuItem key={option.value} value={option.value}>{option.name}</MenuItem>;
                            })}
                        </TextField>
                    )}

                    {triggerType == 'IntervalTrigger' && (
                        <TextField
                            name='Interval'
                            select
                            fullWidth
                            defaultValue={'9000000000'}
                            label={globalize.translate('LabelEveryXMinutes')}
                        >
                            <MenuItem value='9000000000'>15 minutes</MenuItem>
                            <MenuItem value='18000000000'>30 minutes</MenuItem>
                            <MenuItem value='27000000000'>45 minutes</MenuItem>
                            <MenuItem value='36000000000'>1 hour</MenuItem>
                            <MenuItem value='72000000000'>2 hours</MenuItem>
                            <MenuItem value='108000000000'>3 hours</MenuItem>
                            <MenuItem value='144000000000'>4 hours</MenuItem>
                            <MenuItem value='216000000000'>6 hours</MenuItem>
                            <MenuItem value='288000000000'>8 hours</MenuItem>
                            <MenuItem value='432000000000'>12 hours</MenuItem>
                            <MenuItem value='864000000000'>24 hours</MenuItem>
                        </TextField>
                    )}

                    <TextField
                        name='TimeLimit'
                        fullWidth
                        defaultValue={''}
                        type='number'
                        inputProps={{
                            min: 1,
                            step: 0.5
                        }}
                        label={globalize.translate('LabelTimeLimitHours')}
                    />
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button
                    onClick={onClose}
                    color='error'
                >{globalize.translate('ButtonCancel')}</Button>
                <Button type='submit'>{globalize.translate('Add')}</Button>
            </DialogActions>
        </Dialog>
    );
};

export default NewTriggerForm;
