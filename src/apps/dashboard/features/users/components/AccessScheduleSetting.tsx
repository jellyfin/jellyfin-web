import type { AccessSchedule } from '@jellyfin/sdk/lib/generated-client/models/access-schedule';
import { DynamicDayOfWeek } from '@jellyfin/sdk/lib/generated-client/models/dynamic-day-of-week';

import React, { FC, useState, useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListSubheader from '@mui/material/ListSubheader';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    type SubmitHandler,
    useForm,
    SelectElement,
    FieldError,
    Control,
    useFieldArray
} from 'react-hook-form-mui';
import globalize from 'lib/globalize';
import { generateTimeSlots, getDisplayTime } from '../utils/item';
import type { ParentalFormValues } from './forms/UserParentalControlForm';

const accessScheduleSchema = z
    .object({
        DayOfWeek: z.nativeEnum(DynamicDayOfWeek),
        StartHour: z.number().min(0).max(24),
        EndHour: z.number().min(0).max(24)
    })
    .refine((data) => data.StartHour < data.EndHour, {
        message: 'ErrorStartHourGreaterThanEnd',
        path: ['EndHour']
    });

export type AccessScheduleFormValues = z.infer<typeof accessScheduleSchema>;

const daysOfWeekOpts = [
    { label: 'Sunday', value: DynamicDayOfWeek.Sunday },
    { label: 'Monday', value: DynamicDayOfWeek.Monday },
    { label: 'Tuesday', value: DynamicDayOfWeek.Tuesday },
    { label: 'Wednesday', value: DynamicDayOfWeek.Wednesday },
    { label: 'Thursday', value: DynamicDayOfWeek.Thursday },
    { label: 'Friday', value: DynamicDayOfWeek.Friday },
    { label: 'OptionEveryday', value: DynamicDayOfWeek.Everyday },
    { label: 'OptionWeekdays', value: DynamicDayOfWeek.Weekday },
    { label: 'OptionWeekends', value: DynamicDayOfWeek.Weekend }
];

interface AccessScheduleDialogFormProps {
    open: boolean;
    onClose: () => void;
    onAddValue: (data: AccessScheduleFormValues) => void;
}

const AccessScheduleDialogForm: FC<AccessScheduleDialogFormProps> = ({
    open,
    onClose,
    onAddValue
}) => {
    const {
        control,
        handleSubmit,
        reset,
        formState: { isDirty }
    } = useForm<AccessScheduleFormValues>({
        resolver: zodResolver(accessScheduleSchema),
        defaultValues: {
            DayOfWeek: DynamicDayOfWeek.Sunday,
            StartHour: 0,
            EndHour: 0
        }
    });

    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

    const handleParseError = useCallback((error: FieldError) => {
        return error.message ? globalize.translate(error.message) : '';
    }, []);

    const handleAddValue: SubmitHandler<AccessScheduleFormValues> = (data) => {
        onAddValue(data);
        reset();
        onClose();
    };

    const handleCancel = useCallback(() => {
        reset();
        onClose();
    }, [onClose, reset]);

    const timeSlots = generateTimeSlots();

    return (
        <Dialog
            fullScreen={fullScreen}
            fullWidth
            maxWidth={'sm'}
            open={open}
            onClose={handleCancel}
        >
            <DialogTitle>
                {globalize.translate('HeaderAccessSchedule')}
            </DialogTitle>
            <DialogContent>
                <SelectElement
                    label={globalize.translate('LabelAccessDay')}
                    name='DayOfWeek'
                    control={control}
                    options={daysOfWeekOpts.map((day) => ({
                        id: day.value,
                        label: globalize.translate(day.label)
                    }))}
                    sx={{ mb: 2 }}
                    fullWidth
                />

                <SelectElement
                    label={globalize.translate('LabelAccessStart')}
                    name='StartHour'
                    control={control}
                    options={timeSlots}
                    sx={{ mb: 2 }}
                    fullWidth
                />

                <SelectElement
                    label={globalize.translate('LabelAccessEnd')}
                    name='EndHour'
                    control={control}
                    options={timeSlots}
                    sx={{ mb: 2 }}
                    fullWidth
                    parseError={handleParseError}
                />
            </DialogContent>
            <DialogActions>
                <Button variant='text' onClick={handleCancel}>
                    {globalize.translate('ButtonCancel')}
                </Button>
                <Button
                    onClick={handleSubmit(handleAddValue)}
                    disabled={!isDirty}
                >
                    {globalize.translate('Add')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

interface AccessScheduleSettingProps {
    control: Control<ParentalFormValues>;
    title: string;
    subTitle: string;
}

const AccessScheduleSetting: FC<AccessScheduleSettingProps> = ({
    control,
    title,
    subTitle
}) => {
    const theme = useTheme();
    const [dialogOpen, setDialogOpen] = useState(false);

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'AccessSchedules'
    });

    const handleDialogOpen = useCallback(() => setDialogOpen(true), []);
    const handleDialogClose = useCallback(() => setDialogOpen(false), []);

    const handleAddValue = useCallback(
        (data: AccessSchedule) => {
            const isDuplicate = fields.some(
                (schedule) =>
                    schedule.DayOfWeek === data.DayOfWeek
                    && schedule.StartHour === data.StartHour
                    && schedule.EndHour === data.EndHour
            );

            if (!isDuplicate) {
                append(data);
            }
        },
        [fields, append]
    );

    return (
        <Box sx={{ my: 2 }}>
            <Stack spacing={2} direction={'row'} alignItems={'center'}>
                <Typography variant='h2'>
                    {globalize.translate(title)}
                </Typography>

                <IconButton
                    title={globalize.translate('Add')}
                    className='fab'
                    onClick={handleDialogOpen}
                >
                    <AddIcon />
                </IconButton>
            </Stack>

            {fields.length > 0 && (
                <List
                    sx={{
                        mt: 2,
                        borderRadius: 2,
                        backgroundColor: theme.palette.background.paper
                    }}
                    subheader={
                        <ListSubheader>
                            {globalize.translate(subTitle)}
                        </ListSubheader>
                    }
                >
                    {fields.map((field, index) => (
                        <ListItem
                            key={field.id}
                            secondaryAction={
                                <IconButton
                                    edge='end'
                                    aria-label='delete'
                                    title={globalize.translate('Delete')}
                                    className='btnDeleteTag listItemButton'
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onClick={() => remove(index)}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            }
                        >
                            <ListItemText
                                primary={globalize.translate(field.DayOfWeek)}
                                secondary={`${getDisplayTime(
                                    field.StartHour
                                )} - ${getDisplayTime(field.EndHour)}`}
                            />
                        </ListItem>
                    ))}
                </List>
            )}

            <AccessScheduleDialogForm
                open={dialogOpen}
                onClose={handleDialogClose}
                onAddValue={handleAddValue}
            />
        </Box>
    );
};

export default AccessScheduleSetting;
