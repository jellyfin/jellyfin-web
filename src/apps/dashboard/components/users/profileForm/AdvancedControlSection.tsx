import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import React, { type FC } from 'react';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import globalize from 'scripts/globalize';

interface AdvancedControlSectionProps {
    currentUser: UserDto;
    onFormChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const AdvancedControlSection: FC<AdvancedControlSectionProps> = ({
    currentUser,
    onFormChange
}) => {
    const theme = useTheme();
    return (
        <Stack spacing={2}>
            <Typography variant='h2' className='checkboxListLabel'>
                {globalize.translate('HeaderAdvancedControl')}
            </Typography>
            <Stack spacing={2} sx={{ px: 2, backgroundColor: theme.palette.background.paper }}>
                <FormControl>
                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={
                                        currentUser?.Policy
                                            ?.EnableContentDownloading
                                    }
                                    onChange={onFormChange}
                                    name='EnableContentDownloading'
                                />
                            }
                            label={globalize.translate(
                                'OptionAllowContentDownload'
                            )}
                        />
                        <FormHelperText className='fieldDescription'>
                            {globalize.translate(
                                'OptionAllowContentDownloadHelp'
                            )}
                        </FormHelperText>

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={
                                        currentUser?.Policy?.IsDisabled
                                    }
                                    onChange={onFormChange}
                                    name='IsDisabled'
                                />
                            }
                            label={globalize.translate(
                                'OptionDisableUser'
                            )}
                        />
                        <FormHelperText className='fieldDescription'>
                            {globalize.translate(
                                'OptionDisableUserHelp'
                            )}
                        </FormHelperText>

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={
                                        currentUser?.Policy?.IsHidden
                                    }
                                    onChange={onFormChange}
                                    name='IsHidden'
                                />
                            }
                            label={globalize.translate(
                                'OptionHideUser'
                            )}
                        />
                        <FormHelperText className='fieldDescription'>
                            {globalize.translate(
                                'OptionHideUserFromLoginHelp'
                            )}
                        </FormHelperText>
                    </FormGroup>
                </FormControl>
                <FormControl fullWidth>
                    <TextField
                        id='txtLoginAttemptsBeforeLockout'
                        label={globalize.translate(
                            'LabelUserLoginAttemptsBeforeLockout'
                        )}
                        type='number'
                        inputProps={{
                            min: -1,
                            step: 1
                        }}
                        value={
                            currentUser?.Policy
                                ?.LoginAttemptsBeforeLockout || 0
                        }
                        name='LoginAttemptsBeforeLockout'
                        onChange={onFormChange}
                    />
                    <FormHelperText
                        component={Stack}
                        className='fieldDescription'
                    >
                        <span>
                            {globalize.translate(
                                'OptionLoginAttemptsBeforeLockout'
                            )}
                        </span>
                        <span>
                            {globalize.translate(
                                'OptionLoginAttemptsBeforeLockoutHelp'
                            )}
                        </span>
                    </FormHelperText>
                </FormControl>
                <FormControl fullWidth>
                    <TextField
                        id='txtMaxActiveSessions'
                        label={globalize.translate(
                            'LabelUserMaxActiveSessions'
                        )}
                        type='number'
                        inputProps={{
                            min: 0,
                            step: 1
                        }}
                        value={
                            currentUser?.Policy
                                ?.MaxActiveSessions || 0
                        }
                        name='MaxActiveSessions'
                        onChange={onFormChange}
                    />
                    <FormHelperText
                        component={Stack}
                        className='fieldDescription'
                    >
                        <span>
                            {globalize.translate(
                                'OptionMaxActiveSessions'
                            )}
                        </span>
                        <span>
                            {globalize.translate(
                                'OptionMaxActiveSessionsHelp'
                            )}
                        </span>
                    </FormHelperText>
                </FormControl>
            </Stack>
        </Stack>
    );
};

export default AdvancedControlSection;
