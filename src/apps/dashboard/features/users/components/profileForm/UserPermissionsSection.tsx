import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import React, { type FC } from 'react';
import FormControl from '@mui/material/FormControl';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import globalize from 'lib/globalize';

interface UserPermissionsSectionProps {
    enableRemoteAccess?: boolean
    currentUser: UserDto;
    onFormChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const UserPermissionsSection: FC<UserPermissionsSectionProps> = ({
    enableRemoteAccess,
    currentUser,
    onFormChange
}) => {
    return (
        <FormControl fullWidth>
            <FormGroup>
                {enableRemoteAccess && (
                    <>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={
                                        currentUser?.Policy
                                            ?.EnableRemoteAccess
                                    }
                                    onChange={onFormChange}
                                    name='EnableRemoteAccess'
                                />
                            }
                            label={globalize.translate(
                                'AllowRemoteAccess'
                            )}
                        />
                        <FormHelperText className='fieldDescription'>
                            {globalize.translate('AllowRemoteAccessHelp')}
                        </FormHelperText>
                    </>
                )}

                <FormControlLabel
                    control={
                        <Checkbox
                            disabled={!currentUser.HasConfiguredPassword}
                            checked={
                                currentUser?.Policy
                                    ?.IsAdministrator
                            }
                            onChange={onFormChange}
                            name='IsAdministrator'
                        />
                    }
                    label={globalize.translate(
                        'OptionAllowUserToManageServer'
                    )}
                />
                {
                    !currentUser.HasConfiguredPassword && (
                        <FormHelperText className='fieldDescription'>
                            {globalize.translate('ConfiguredPasswordRequiredForAdmin')}
                        </FormHelperText>
                    )
                }

                <FormControlLabel
                    control={
                        <Checkbox
                            checked={
                                currentUser?.Policy
                                    ?.EnableCollectionManagement
                            }
                            onChange={onFormChange}
                            name='EnableCollectionManagement'
                        />
                    }
                    label={globalize.translate(
                        'AllowCollectionManagement'
                    )}
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={
                                currentUser?.Policy
                                    ?.EnableSubtitleManagement
                            }
                            onChange={onFormChange}
                            name='EnableSubtitleManagement'
                        />
                    }
                    label={globalize.translate(
                        'AllowSubtitleManagement'
                    )}
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={
                                currentUser?.Policy
                                    ?.EnableUserPreferenceAccess
                            }
                            onChange={onFormChange}
                            name='EnableUserPreferenceAccess'
                        />
                    }
                    label={globalize.translate(
                        'AllowUserPreferenceAccess'
                    )}
                />
                <FormHelperText className='fieldDescription'>
                    {globalize.translate('AllowUserPreferenceAccessHelp')}
                </FormHelperText>
            </FormGroup>
        </FormControl>
    );
};

export default UserPermissionsSection;
