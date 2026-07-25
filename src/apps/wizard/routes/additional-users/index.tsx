import React, { useCallback, useState } from 'react';
import WizardPage from 'apps/wizard/components/WizardPage';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Snackbar, { SnackbarCloseReason } from '@mui/material/Snackbar';
import globalize from 'lib/globalize';
import { useNavigate } from 'react-router-dom';
import type { StartupUserDto } from '@jellyfin/sdk/lib/generated-client/models/startup-user-dto';
import confirm from 'components/confirm/confirm';
import { getWizardDraft } from 'apps/wizard/utils/wizardDraft';
import { getPreviousStepPath, getWizardNextPath, useIsFromSummary } from 'apps/wizard/utils/wizardSteps';

export const Component = () => {
    const navigate = useNavigate();
    const isFromSummary = useIsFromSummary();
    const [ users, setUsers ] = useState<StartupUserDto[]>(() => [ ...getWizardDraft().users ]);
    const [ name, setName ] = useState('');
    const [ password, setPassword ] = useState('');
    const [ passwordConfirm, setPasswordConfirm ] = useState('');
    const [ toastOpen, setToastOpen ] = useState(false);
    const [ toastMessage, setToastMessage ] = useState('');

    const showToast = useCallback((message: string) => {
        setToastMessage(message);
        setToastOpen(true);
    }, []);

    const onToastClose = useCallback((_e: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
        if (reason === 'clickaway') return;
        setToastOpen(false);
    }, []);

    const addUser = useCallback((user: StartupUserDto) => {
        const updated = [ ...users, user ];
        getWizardDraft().users = updated;
        setUsers(updated);
        setName('');
        setPassword('');
        setPasswordConfirm('');
    }, [ users ]);

    const handleAddUser = useCallback(() => {
        const trimmedName = name.trim();
        if (!trimmedName) return;

        if (password !== passwordConfirm) {
            showToast(globalize.translate('PasswordMatchError'));
            return;
        }

        if (users.some(u => (u.Name ?? '').toLowerCase() === trimmedName.toLowerCase())) {
            showToast(globalize.translate('ErrorDefault'));
            return;
        }

        const newUser: StartupUserDto = { Name: trimmedName, Password: password };

        if (!password) {
            confirm({
                title: globalize.translate('HeaderUserPasswordWarning'),
                text: globalize.translate('MessageUserPasswordBlankWarning'),
                primary: 'delete'
            }).then(() => addUser(newUser)).catch(() => {
                // User chose to set a password instead
            });
            return;
        }

        addUser(newUser);
    }, [ name, password, passwordConfirm, users, addUser, showToast ]);

    // These fields sit inside WizardPage's outer <Form>; stop Enter from submitting
    // the whole wizard step and treat it as "add user" instead.
    const onFieldKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddUser();
        }
    }, [ handleAddUser ]);

    const onRemoveUser = useCallback((index: number) => {
        const updated = users.filter((_, i) => i !== index);
        getWizardDraft().users = updated;
        setUsers(updated);
    }, [ users ]);

    const onPrevious = useCallback(() => {
        navigate(getPreviousStepPath('additional-users')!);
    }, [ navigate ]);

    const onNext = useCallback(() => {
        navigate(getWizardNextPath('additional-users', isFromSummary)!);
    }, [ navigate, isFromSummary ]);

    let nextLabel;
    if (isFromSummary) {
        nextLabel = globalize.translate('ReturnToSummary');
    } else if (users.length === 0) {
        nextLabel = globalize.translate('Skip');
    }

    return (
        <WizardPage
            id='wizardAdditionalUsersPage'
            onPrevious={onPrevious}
            onNext={onNext}
            nextLabel={nextLabel}
        >
            <Snackbar
                open={toastOpen}
                autoHideDuration={3300}
                onClose={onToastClose}
                message={toastMessage}
            />
            <Stack spacing={3}>
                <Typography variant='h1'>{globalize.translate('HeaderAdditionalUsers')}</Typography>
                <Typography>{globalize.translate('AdditionalUsersIntro')}</Typography>

                {users.length > 0 ? (
                    <List aria-live='polite'>
                        {users.map((user, index) => (
                            <ListItem
                                key={user.Name}
                                secondaryAction={
                                    <IconButton
                                        edge='end'
                                        aria-label={globalize.translate('Delete')}
                                        // eslint-disable-next-line react/jsx-no-bind
                                        onClick={() => onRemoveUser(index)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                }
                            >
                                <ListItemText primary={user.Name} />
                            </ListItem>
                        ))}
                    </List>
                ) : null}

                <Stack spacing={2} onKeyDown={onFieldKeyDown}>
                    <TextField
                        label={globalize.translate('LabelName')}
                        value={name}
                        // eslint-disable-next-line react/jsx-no-bind
                        onChange={e => setName(e.target.value)}
                    />
                    <TextField
                        label={globalize.translate('LabelPassword')}
                        type='password'
                        value={password}
                        // eslint-disable-next-line react/jsx-no-bind
                        onChange={e => setPassword(e.target.value)}
                    />
                    <TextField
                        label={globalize.translate('LabelPasswordConfirm')}
                        type='password'
                        value={passwordConfirm}
                        // eslint-disable-next-line react/jsx-no-bind
                        onChange={e => setPasswordConfirm(e.target.value)}
                    />
                    <Button
                        type='button'
                        startIcon={<PersonAddIcon />}
                        sx={{ alignSelf: 'flex-start' }}
                        onClick={handleAddUser}
                    >
                        {globalize.translate('Add')}
                    </Button>
                </Stack>

                <Typography>{globalize.translate('MoreUsersCanBeAddedLater')}</Typography>
            </Stack>
        </WizardPage>
    );
};

Component.displayName = 'WizardAdditionalUsersPage';
