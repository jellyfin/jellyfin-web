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
import globalize from 'lib/globalize';

interface PlaybackSectionProps {
    currentUser: UserDto;
    onFormChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const PlaybackSection: FC<PlaybackSectionProps> = ({
    currentUser,
    onFormChange
}) => {
    const theme = useTheme();
    return (
        <Stack spacing={2}>
            <Typography variant='h2' className='checkboxListLabel'>
                {globalize.translate('HeaderPlayback')}
            </Typography>
            <FormControl>
                <FormGroup
                    sx={{ px: 2, backgroundColor: theme.palette.background.paper }}
                >
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={currentUser?.Policy?.EnableMediaPlayback}
                                onChange={onFormChange}
                                name='EnableMediaPlayback'
                            />
                        }
                        label={globalize.translate('OptionAllowMediaPlayback')}
                    />

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={
                                    currentUser?.Policy
                                        ?.EnableAudioPlaybackTranscoding
                                }
                                onChange={onFormChange}
                                name='EnableAudioPlaybackTranscoding'
                            />
                        }
                        label={globalize.translate(
                            'OptionAllowAudioPlaybackTranscoding'
                        )}
                    />

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={
                                    currentUser?.Policy
                                        ?.EnableVideoPlaybackTranscoding
                                }
                                onChange={onFormChange}
                                name='EnableVideoPlaybackTranscoding'
                            />
                        }
                        label={globalize.translate(
                            'OptionAllowVideoPlaybackTranscoding'
                        )}
                    />

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={
                                    currentUser?.Policy?.EnablePlaybackRemuxing
                                }
                                onChange={onFormChange}
                                name='EnablePlaybackRemuxing'
                            />
                        }
                        label={globalize.translate(
                            'OptionAllowVideoPlaybackRemuxing'
                        )}
                    />

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={
                                    currentUser?.Policy
                                        ?.ForceRemoteSourceTranscoding
                                }
                                onChange={onFormChange}
                                name='ForceRemoteSourceTranscoding'
                            />
                        }
                        label={globalize.translate(
                            'OptionForceRemoteSourceTranscoding'
                        )}
                    />
                </FormGroup>
                <FormHelperText>
                    {globalize.translate('OptionAllowMediaPlaybackTranscodingHelp')}
                </FormHelperText>
            </FormControl>
        </Stack>
    );
};

export default PlaybackSection;
