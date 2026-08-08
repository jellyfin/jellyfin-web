import React, { useCallback, useState } from 'react';
import WizardPage from 'apps/wizard/components/WizardPage';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import globalize from 'lib/globalize';
import Button from '@mui/material/Button';
import Add from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import WizardLibraryCard from 'apps/wizard/components/WizardLibraryCard';
import MediaLibraryCreator from 'components/mediaLibraryCreator/mediaLibraryCreator';
import getCollectionTypeOptions from 'apps/dashboard/features/libraries/utils/collectionTypeOptions';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import toast from 'components/toast/toast';
import { getWizardDraft, type WizardDraftLibrary } from 'apps/wizard/utils/wizardDraft';
import { getPreviousStepPath, getWizardNextPath, useIsFromSummary } from 'apps/wizard/utils/wizardSteps';

export const Component = () => {
    const navigate = useNavigate();
    const isFromSummary = useIsFromSummary();
    const [ libraries, setLibraries ] = useState<WizardDraftLibrary[]>(() => [ ...getWizardDraft().libraries ]);

    const showMediaLibraryCreator = useCallback(() => {
        // eslint-disable-next-line sonarjs/constructor-for-side-effects -- the dialog does its work via the onCreate callback below
        new MediaLibraryCreator({
            collectionTypeOptions: getCollectionTypeOptions(),
            onCreate: (library: WizardDraftLibrary) => {
                const isDuplicate = libraries.some(l => l.Name.toLowerCase() === library.Name.toLowerCase());
                if (isDuplicate) {
                    toast(globalize.translate('ErrorDefault'));
                    return false;
                }

                const updated = [ ...libraries, library ];
                getWizardDraft().libraries = updated;
                setLibraries(updated);
            }
        });
    }, [ libraries ]);

    const onRenameLibrary = useCallback((index: number, newName: string) => {
        const updated = libraries.map((l, i) => (i === index ? { ...l, Name: newName } : l));
        getWizardDraft().libraries = updated;
        setLibraries(updated);
    }, [ libraries ]);

    const onRemoveLibrary = useCallback((index: number) => {
        const updated = libraries.filter((_, i) => i !== index);
        getWizardDraft().libraries = updated;
        setLibraries(updated);
    }, [ libraries ]);

    const onPrevious = useCallback(() => {
        navigate(getPreviousStepPath('library')!);
    }, [ navigate ]);

    const onNext = useCallback(() => {
        navigate(getWizardNextPath('library', isFromSummary)!);
    }, [ navigate, isFromSummary ]);

    let nextLabel;
    if (isFromSummary) {
        nextLabel = globalize.translate('ReturnToSummary');
    } else if (libraries.length === 0) {
        nextLabel = globalize.translate('Skip');
    }

    return (
        <WizardPage
            id='wizardLibraryPage'
            onPrevious={onPrevious}
            onNext={onNext}
            nextLabel={nextLabel}
        >
            <Stack spacing={3}>
                <Stack direction='row' justifyContent={'space-between'} alignItems={'center'}>
                    <Typography variant='h1'>{globalize.translate('HeaderSetupLibrary')}</Typography>
                    <Button
                        startIcon={<HelpOutlineIcon />}
                        variant='outlined'
                        component={RouterLink}
                        to='https://jellyfin.org/docs/general/server/libraries/'
                        target='_blank'
                    >
                        {globalize.translate('Help')}
                    </Button>
                </Stack>

                <Button
                    startIcon={<Add />}
                    sx={{ alignSelf: 'flex-start' }}
                    onClick={showMediaLibraryCreator}
                >
                    {globalize.translate('ButtonAddMediaLibrary')}
                </Button>

                <Box>
                    <Grid container spacing={2}>
                        {libraries.map((library, index) => (
                            <Grid
                                key={library.Name}
                                item
                                xs={12}
                                sm={4}
                            >
                                <WizardLibraryCard
                                    library={library}
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onRename={newName => onRenameLibrary(index, newName)}
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onRemove={() => onRemoveLibrary(index)}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Stack>
        </WizardPage>
    );
};

Component.displayName = 'WizardLibraryPage';
