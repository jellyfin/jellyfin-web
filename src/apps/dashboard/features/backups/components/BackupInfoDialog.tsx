import type { BackupManifestDto } from '@jellyfin/sdk/lib/generated-client/models/backup-manifest-dto';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Box from '@mui/material/Box';
import globalize from 'lib/globalize';
import React, { FunctionComponent, useCallback } from 'react';
import Stack from '@mui/material/Stack';
import FormGroup from '@mui/material/FormGroup';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import ContentCopy from '@mui/icons-material/ContentCopy';
import IconButton from '@mui/material/IconButton';
import { copy } from 'scripts/clipboard';
import toast from 'components/toast/toast';

type IProps = {
    backup: BackupManifestDto;
    open: boolean;
    onClose: () => void;
};

const BackupInfoDialog: FunctionComponent<IProps> = ({
    backup,
    open,
    onClose
}: IProps) => {
    const copyPath = useCallback(async () => {
        if (backup.Path) {
            await copy(backup.Path);
            toast({ text: globalize.translate('Copied') });
        }
    }, [backup.Path]);

    return (
        <Dialog onClose={onClose} open={open} maxWidth={'sm'} fullWidth>
            <DialogTitle>{backup.DateCreated}</DialogTitle>

            <DialogContent>
                <Stack spacing={2}>
                    <Box>
                        <Stack
                            direction='row'
                            spacing={2}
                        >
                            <Typography fontWeight='bold'>{globalize.translate('LabelPath')}</Typography>
                            <Stack direction='row'>
                                <Typography color='text.secondary'>
                                    {backup.Path}
                                </Typography>
                                <IconButton size='small' onClick={copyPath}>
                                    <ContentCopy fontSize='small' />
                                </IconButton>
                            </Stack>
                        </Stack>
                        <Stack
                            direction='row'
                            spacing={2}
                        >
                            <Typography fontWeight='bold'>{globalize.translate('LabelVersion')}</Typography>
                            <Typography color='text.secondary'>{backup.ServerVersion}</Typography>
                        </Stack>
                    </Box>

                    <FormGroup>
                        <FormControl>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name='Database'
                                        defaultChecked={true}
                                        disabled
                                    />
                                }
                                label={globalize.translate('LabelDatabase')}
                            />
                        </FormControl>

                        <FormControl>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name='Metadata'
                                        defaultChecked={
                                            backup.Options?.Metadata
                                        }
                                        disabled
                                    />
                                }
                                label={globalize.translate('LabelMetadata')}
                            />
                        </FormControl>

                        <FormControl>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name='Subtitles'
                                        defaultChecked={
                                            backup.Options?.Subtitles
                                        }
                                        disabled
                                    />
                                }
                                label={globalize.translate('Subtitles')}
                            />
                        </FormControl>

                        <FormControl>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name='Trickplay'
                                        defaultChecked={
                                            backup.Options?.Trickplay
                                        }
                                        disabled
                                    />
                                }
                                label={globalize.translate('Trickplay')}
                            />
                        </FormControl>
                    </FormGroup>
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>
                    {globalize.translate('ButtonOk')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BackupInfoDialog;
