import { vars } from 'styles/tokens.css.ts';

import React, { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogPortal, DialogContentComponent, DialogClose } from 'ui-primitives';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'ui-primitives';
import { Button } from 'ui-primitives';
import { Box, Flex } from 'ui-primitives';
import globalize from '../../lib/globalize';
import datetime from '../../scripts/datetime';
import './accessSchedule.css.ts';
import {
    closeButtonStyle,
    errorStyle,
    labelStyle,
    overlayStyle,
    selectContainerStyle
} from './AccessScheduleDialog.css.ts';
import type { AccessSchedule } from '@jellyfin/sdk/lib/generated-client/models/access-schedule';
import { DynamicDayOfWeek } from '@jellyfin/sdk/lib/generated-client/models/dynamic-day-of-week';

export { closeButtonStyle, errorStyle, labelStyle, overlayStyle, selectContainerStyle };

interface AccessScheduleProps {
    schedule: AccessSchedule;
    onSubmit: (schedule: AccessSchedule) => void;
    onClose: () => void;
}

const DAYS = [
    { value: DynamicDayOfWeek.Sunday, label: globalize.translate('Sunday') },
    { value: DynamicDayOfWeek.Monday, label: globalize.translate('Monday') },
    { value: DynamicDayOfWeek.Tuesday, label: globalize.translate('Tuesday') },
    { value: DynamicDayOfWeek.Wednesday, label: globalize.translate('Wednesday') },
    { value: DynamicDayOfWeek.Thursday, label: globalize.translate('Thursday') },
    { value: DynamicDayOfWeek.Friday, label: globalize.translate('Friday') },
    { value: DynamicDayOfWeek.Saturday, label: globalize.translate('Saturday') },
    { value: DynamicDayOfWeek.Everyday, label: globalize.translate('OptionEveryday') },
    { value: DynamicDayOfWeek.Weekday, label: globalize.translate('OptionWeekdays') },
    { value: DynamicDayOfWeek.Weekend, label: globalize.translate('OptionWeekends') }
];

function getDisplayTime(hours: number): string {
    let minutes = 0;
    const pct = hours % 1;

    if (pct) {
        minutes = parseInt(String(60 * pct), 10);
    }

    return datetime.getDisplayTime(new Date(2000, 1, 1, hours, minutes, 0, 0));
}

const HOURS = Array.from({ length: 49 }, (_, i) => {
    const value = i * 0.5;
    return { value, label: value === 24 ? getDisplayTime(0) : getDisplayTime(value) };
});

const AccessScheduleDialog: React.FC<AccessScheduleProps> = ({ schedule, onSubmit, onClose }) => {
    const [dayOfWeek, setDayOfWeek] = useState<DynamicDayOfWeek>(schedule.DayOfWeek || DynamicDayOfWeek.Sunday);
    const [startHour, setStartHour] = useState(String(schedule.StartHour || 0));
    const [endHour, setEndHour] = useState(String(schedule.EndHour || 0));
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (parseFloat(startHour) >= parseFloat(endHour)) {
            setError(globalize.translate('ErrorStartHourGreaterThanEnd'));
            return;
        }

        onSubmit({
            ...schedule,
            DayOfWeek: dayOfWeek,
            StartHour: parseFloat(startHour),
            EndHour: parseFloat(endHour)
        });
    };

    return (
        <Dialog open={true} onOpenChange={open => !open && onClose()}>
            <DialogPortal>
                <DialogPrimitive.Overlay className={overlayStyle} />
                <DialogContentComponent
                    title={globalize.translate('HeaderAccessSchedule')}
                    style={{ maxWidth: '400px' }}
                >
                    <form onSubmit={handleSubmit} className="scheduleForm" style={{ margin: 0 }}>
                        <Box className={selectContainerStyle}>
                            <label className={labelStyle} htmlFor="selectDay">
                                {globalize.translate('LabelAccessDay')}
                            </label>
                            <Select value={dayOfWeek} onValueChange={val => setDayOfWeek(val as DynamicDayOfWeek)}>
                                <SelectTrigger id="selectDay" style={{ width: '100%' }}>
                                    <SelectValue placeholder={globalize.translate('LabelAccessDay')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {DAYS.map(day => (
                                        <SelectItem key={day.value} value={day.value}>
                                            {day.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Box>
                        <Box className={selectContainerStyle}>
                            <label className={labelStyle} htmlFor="selectStart">
                                {globalize.translate('LabelAccessStart')}
                            </label>
                            <Select value={startHour} onValueChange={setStartHour}>
                                <SelectTrigger id="selectStart" style={{ width: '100%' }}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {HOURS.map(hour => (
                                        <SelectItem key={hour.value} value={String(hour.value)}>
                                            {hour.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Box>
                        <Box className={selectContainerStyle}>
                            <label className={labelStyle} htmlFor="selectEnd">
                                {globalize.translate('LabelAccessEnd')}
                            </label>
                            <Select value={endHour} onValueChange={setEndHour}>
                                <SelectTrigger id="selectEnd" style={{ width: '100%' }}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {HOURS.map(hour => (
                                        <SelectItem key={hour.value} value={String(hour.value)}>
                                            {hour.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Box>
                        {error && <Box className={errorStyle}>{error}</Box>}
                        <Flex style={{ gap: vars.spacing['2'], justifyContent: 'flex-end', marginTop: '24px' }}>
                            <DialogClose asChild>
                                <Button variant="ghost" type="button" onClick={onClose}>
                                    {globalize.translate('Cancel')}
                                </Button>
                            </DialogClose>
                            <Button type="submit" variant="primary">
                                {globalize.translate('Add')}
                            </Button>
                        </Flex>
                    </form>
                    <DialogClose asChild>
                        <button className={closeButtonStyle} aria-label="Close" type="button">
                            ✕
                        </button>
                    </DialogClose>
                </DialogContentComponent>
            </DialogPortal>
        </Dialog>
    );
};

export default AccessScheduleDialog;
