import { vars } from 'styles/tokens.css.ts';

import React, { type FunctionComponent, useCallback, useMemo, useState } from 'react';
import { Dialog, DialogOverlayComponent, DialogContentComponent, DialogTitle } from 'ui-primitives';
import { Button } from 'ui-primitives';
import { Flex } from 'ui-primitives';
import { Text } from 'ui-primitives';
import { Input } from 'ui-primitives';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'ui-primitives';
import type { TaskTriggerInfo } from '@jellyfin/sdk/lib/generated-client/models/task-trigger-info';
import { TaskTriggerInfoType } from '@jellyfin/sdk/lib/generated-client/models/task-trigger-info-type';
import { DayOfWeek } from '@jellyfin/sdk/lib/generated-client/models/day-of-week';
import globalize from 'lib/globalize';
import { getIntervalOptions, getTimeOfDayOptions } from '../utils/edit';
import { useLocale } from 'hooks/useLocale';

interface IProps {
    open: boolean;
    title: string;
    onClose?: () => void;
    onAdd?: (trigger: TaskTriggerInfo) => void;
}

const NewTriggerForm: FunctionComponent<IProps> = ({ open, title, onClose, onAdd }: IProps) => {
    const { dateFnsLocale } = useLocale();
    const [triggerType, setTriggerType] = useState<TaskTriggerInfoType>(TaskTriggerInfoType.DailyTrigger);

    const timeOfDayOptions = useMemo(() => getTimeOfDayOptions(dateFnsLocale), [dateFnsLocale]);
    const intervalOptions = useMemo(() => getIntervalOptions(dateFnsLocale), [dateFnsLocale]);

    const onTriggerTypeChange = useCallback((value: string) => {
        setTriggerType(value as TaskTriggerInfoType);
    }, []);

    const onSubmit = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
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
        },
        [onAdd]
    );

    return (
        <Dialog open={open} onOpenChange={open => !open && onClose?.()}>
            <DialogOverlayComponent />
            <DialogContentComponent title={title}>
                <form onSubmit={onSubmit}>
                    <Flex style={{ flexDirection: 'column', gap: '24px' }}>
                        <Select value={triggerType} onValueChange={onTriggerTypeChange}>
                            <SelectTrigger
                                style={{ width: '100%' }}
                                aria-label={globalize.translate('LabelTriggerType')}
                            >
                                <SelectValue placeholder={globalize.translate('LabelTriggerType')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TaskTriggerInfoType.DailyTrigger.toString()}>
                                    {globalize.translate('OptionDaily')}
                                </SelectItem>
                                <SelectItem value={TaskTriggerInfoType.WeeklyTrigger.toString()}>
                                    {globalize.translate('OptionWeekly')}
                                </SelectItem>
                                <SelectItem value={TaskTriggerInfoType.IntervalTrigger.toString()}>
                                    {globalize.translate('OptionOnInterval')}
                                </SelectItem>
                                <SelectItem value={TaskTriggerInfoType.StartupTrigger.toString()}>
                                    {globalize.translate('OnApplicationStartup')}
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {triggerType == TaskTriggerInfoType.WeeklyTrigger && (
                            <Select name="DayOfWeek" defaultValue={DayOfWeek.Sunday.toString()}>
                                <SelectTrigger style={{ width: '100%' }}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={DayOfWeek.Sunday.toString()}>
                                        {globalize.translate('Sunday')}
                                    </SelectItem>
                                    <SelectItem value={DayOfWeek.Monday.toString()}>
                                        {globalize.translate('Monday')}
                                    </SelectItem>
                                    <SelectItem value={DayOfWeek.Tuesday.toString()}>
                                        {globalize.translate('Tuesday')}
                                    </SelectItem>
                                    <SelectItem value={DayOfWeek.Wednesday.toString()}>
                                        {globalize.translate('Wednesday')}
                                    </SelectItem>
                                    <SelectItem value={DayOfWeek.Thursday.toString()}>
                                        {globalize.translate('Thursday')}
                                    </SelectItem>
                                    <SelectItem value={DayOfWeek.Friday.toString()}>
                                        {globalize.translate('Friday')}
                                    </SelectItem>
                                    <SelectItem value={DayOfWeek.Saturday.toString()}>
                                        {globalize.translate('Saturday')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        )}

                        {(triggerType == TaskTriggerInfoType.DailyTrigger ||
                            triggerType == TaskTriggerInfoType.WeeklyTrigger) && (
                            <Select name="TimeOfDay" defaultValue="0">
                                <SelectTrigger style={{ width: '100%' }}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {timeOfDayOptions.map(option => (
                                        <SelectItem key={String(option.value)} value={String(option.value)}>
                                            {option.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {triggerType == TaskTriggerInfoType.IntervalTrigger && (
                            <Select name="Interval" defaultValue={String(intervalOptions[0]?.value ?? '')}>
                                <SelectTrigger style={{ width: '100%' }}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {intervalOptions.map(option => (
                                        <SelectItem key={String(option.value)} value={String(option.value)}>
                                            {option.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        <Input
                            name="TimeLimit"
                            type="number"
                            label={globalize.translate('LabelTimeLimitHours')}
                            min={1}
                            step={0.5}
                            defaultValue=""
                        />
                    </Flex>

                    <Flex style={{ justifyContent: 'flex-end', gap: vars.spacing['2'], marginTop: '24px' }}>
                        <Button variant="ghost" onClick={onClose}>
                            {globalize.translate('ButtonCancel')}
                        </Button>
                        <Button type="submit">{globalize.translate('Add')}</Button>
                    </Flex>
                </form>
            </DialogContentComponent>
        </Dialog>
    );
};

export default NewTriggerForm;
