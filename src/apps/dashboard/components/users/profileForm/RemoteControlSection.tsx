import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import React, { type FC } from 'react';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Checkbox from '@mui/material/Checkbox';
import { useTheme } from '@mui/material/styles';
import globalize from 'scripts/globalize';

interface RemoteControlSectionProps {
    currentUser: UserDto;
    onFormChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const RemoteControlSection: FC<RemoteControlSectionProps> = ({
    currentUser,
    onFormChange
}) => {
    const theme = useTheme();

    return (
        <Stack spacing={2}>
            <Typography variant='h2' className='checkboxListLabel'>
                {globalize.translate('HeaderRemoteControl')}
            </Typography>
            <FormControl>
                <FormGroup
                    sx={{ px: 2, backgroundColor: theme.palette.background.paper }}
                >
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={
                                    currentUser?.Policy
                                        ?.EnableRemoteControlOfOtherUsers
                                }
                                onChange={onFormChange}
                                name='EnableRemoteControlOfOtherUsers'
                            />
                        }
                        label={globalize.translate(
                            'OptionAllowRemoteControlOthers'
                        )}
                    />

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={
                                    currentUser?.Policy?.EnableSharedDeviceControl
                                }
                                onChange={onFormChange}
                                name='EnableSharedDeviceControl'
                            />
                        }
                        label={globalize.translate(
                            'OptionAllowRemoteSharedDevices'
                        )}
                    />
                </FormGroup>
                <FormHelperText className='fieldDescription'>
                    {globalize.translate('OptionAllowMediaPlaybackTranscodingHelp')}
                </FormHelperText>
            </FormControl>
        </Stack>
    );
};

export default RemoteControlSection;
