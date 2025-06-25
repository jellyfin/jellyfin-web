import { FunctionComponent, useCallback, useMemo, useState } from 'react';
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
import { getIntervalOptions, getTimeOfDayOptions } from '../utils/edit';
import { useLocale } from 'hooks/useLocale';

type IProps = {
    open: boolean,
    title: string,
    onClose?: () => void,
    onAdd?: (trigger: TaskTriggerInfo) => void
};

const NewTriggerForm: FunctionComponent<IProps> = ({ open, title, onClose, onAdd }: IProps) => {
    const { dateFnsLocale } = useLocale();
    const [triggerType, setTriggerType] = useState<TaskTriggerInfoType>(TaskTriggerInfoType.DailyTrigger);

    const timeOfDayOptions = useMemo(() => getTimeOfDayOptions(dateFnsLocale), [dateFnsLocale]);
    const intervalOptions = useMemo(() => getIntervalOptions(dateFnsLocale), [dateFnsLocale]);

    const onTriggerTypeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setTriggerType(e.target.value as TaskTriggerInfoType);
    }, []);

    const onSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
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
            trigger.MaxRuntimeTicks = parseFloat(data.TimeLimit.toString()) * 36e9;
        }

        if (onAdd) {
            onAdd(trigger);
        }
    }, [ onAdd ]);

    return (
        <Dialog
            open={open}
            maxWidth={'xs'}
            fullWidth
            onClose={onClose}
            slotProps={{
                paper: {
                    component: 'form',
                    onSubmit
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
                        <MenuItem value={TaskTriggerInfoType.DailyTrigger}>{globalize.translate('OptionDaily')}</MenuItem>
                        <MenuItem value={TaskTriggerInfoType.WeeklyTrigger}>{globalize.translate('OptionWeekly')}</MenuItem>
                        <MenuItem value={TaskTriggerInfoType.IntervalTrigger}>{globalize.translate('OptionOnInterval')}</MenuItem>
                        <MenuItem value={TaskTriggerInfoType.StartupTrigger}>{globalize.translate('OnApplicationStartup')}</MenuItem>
                    </TextField>

                    {triggerType == TaskTriggerInfoType.WeeklyTrigger && (
                        <TextField
                            name='DayOfWeek'
                            select
                            fullWidth
                            defaultValue={DayOfWeek.Sunday}
                            label={globalize.translate('LabelDay')}
                        >
                            <MenuItem value={DayOfWeek.Sunday}>{globalize.translate('Sunday')}</MenuItem>
                            <MenuItem value={DayOfWeek.Monday}>{globalize.translate('Monday')}</MenuItem>
                            <MenuItem value={DayOfWeek.Tuesday}>{globalize.translate('Tuesday')}</MenuItem>
                            <MenuItem value={DayOfWeek.Wednesday}>{globalize.translate('Wednesday')}</MenuItem>
                            <MenuItem value={DayOfWeek.Thursday}>{globalize.translate('Thursday')}</MenuItem>
                            <MenuItem value={DayOfWeek.Friday}>{globalize.translate('Friday')}</MenuItem>
                            <MenuItem value={DayOfWeek.Saturday}>{globalize.translate('Saturday')}</MenuItem>
                        </TextField>
                    )}

                    {(triggerType == TaskTriggerInfoType.DailyTrigger || triggerType == TaskTriggerInfoType.WeeklyTrigger) && (
                        <TextField
                            name='TimeOfDay'
                            select
                            fullWidth
                            defaultValue={'0'}
                            label={globalize.translate('LabelTime')}
                        >
                            {timeOfDayOptions.map((option) => {
                                return <MenuItem
                                    key={option.value}
                                    value={option.value}
                                >{option.name}</MenuItem>;
                            })}
                        </TextField>
                    )}

                    {triggerType == TaskTriggerInfoType.IntervalTrigger && (
                        <TextField
                            name='Interval'
                            select
                            fullWidth
                            defaultValue={intervalOptions[0].value}
                            label={globalize.translate('LabelEveryXMinutes')}
                        >
                            {intervalOptions.map((option) => {
                                return <MenuItem
                                    key={option.value}
                                    value={option.value}
                                >{option.name}</MenuItem>;
                            })}
                        </TextField>
                    )}

                    <TextField
                        name='TimeLimit'
                        fullWidth
                        defaultValue={''}
                        type='number'
                        label={globalize.translate('LabelTimeLimitHours')}
                        slotProps={{
                            htmlInput: {
                                min: 1,
                                step: 0.5
                            }
                        }}
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
