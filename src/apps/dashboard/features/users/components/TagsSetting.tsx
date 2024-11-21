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
    TextFieldElement,
    Control,
    useFieldArray
} from 'react-hook-form-mui';
import globalize from 'lib/globalize';
import type { ParentalFormValues } from './forms/UserParentalControlForm';

const tagSchema = z.object({
    value: z.string().min(1)
});

type TagFormValues = z.infer<typeof tagSchema>;

interface TagDialogFormProps {
    open: boolean;
    onClose: () => void;
    onAddValue: (dsta: TagFormValues) => void;
}

const TagDialogForm: FC<TagDialogFormProps> = ({
    open,
    onClose,
    onAddValue
}) => {
    const { control, handleSubmit, reset, formState } = useForm<TagFormValues>({
        resolver: zodResolver(tagSchema)
    });

    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

    const handleAddValue: SubmitHandler<TagFormValues> = (data) => {
        onAddValue(data);
        onClose();
        reset();
    };

    const handleCancel = useCallback(() => {
        onClose();
        reset();
    }, [onClose, reset]);

    return (
        <Dialog
            fullScreen={fullScreen}
            fullWidth
            maxWidth={'sm'}
            open={open}
            onClose={handleCancel}
        >
            <DialogTitle>{globalize.translate('HeaderAddNewTag')}</DialogTitle>
            <DialogContent>
                <TextFieldElement
                    name='value'
                    control={control}
                    type='text'
                    label={globalize.translate('LabelTag')}
                    fullWidth
                />
            </DialogContent>
            <DialogActions>
                <Button variant='text' onClick={handleCancel}>
                    {globalize.translate('ButtonCancel')}
                </Button>
                <Button
                    onClick={handleSubmit(handleAddValue)}
                    disabled={!formState.isDirty}
                >
                    {globalize.translate('Add')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

type TagType = 'AllowedTags' | 'BlockedTags';

interface TagsSettingProps {
    name: TagType;
    control: Control<ParentalFormValues>;
    title: string;
    subTitle: string;
}

const TagsSetting: FC<TagsSettingProps> = ({
    name,
    control,
    title,
    subTitle
}) => {
    const theme = useTheme();
    const [dialogOpen, setDialogOpen] = useState(false);
    const { fields, append, remove } = useFieldArray({
        control,
        name
    });

    const handleDialogOpen = useCallback(() => setDialogOpen(true), []);
    const handleDialogClose = useCallback(() => setDialogOpen(false), []);

    const handleAddValue = useCallback(
        (data: TagFormValues) => {
            const isDuplicate = fields.some((tag) => tag.value === data.value);

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
                            <ListItemText primary={field.value} />
                        </ListItem>
                    ))}
                </List>
            )}

            <TagDialogForm
                open={dialogOpen}
                onClose={handleDialogClose}
                onAddValue={handleAddValue}
            />
        </Box>
    );
};

export default TagsSetting;
