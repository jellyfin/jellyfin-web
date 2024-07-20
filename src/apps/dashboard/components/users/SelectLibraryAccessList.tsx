import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import type { DeviceInfo } from '@jellyfin/sdk/lib/generated-client/models/device-info';
import React, { type FC, useCallback } from 'react';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Checkbox from '@mui/material/Checkbox';
import { useTheme } from '@mui/material/styles';
import globalize from 'scripts/globalize';

type PolicyKey = 'EnabledFolders' | 'EnabledChannels' | 'EnabledDevices' | 'EnableContentDeletionFromFolders';

interface SelectLibraryAccessListProps {
    title: string;
    subTitle: string;
    policyKey: PolicyKey;
    items: BaseItemDto[] | DeviceInfo[] | undefined;
    currentUser: UserDto;
    setCurrentUser: React.Dispatch<React.SetStateAction<UserDto>>;
}

function getTitle(name: string | null | undefined, appName: string | null | undefined) {
    let title = name;
    if (appName) {
        title += ' - ' + appName;
    }
    return title;
}

const SelectLibraryAccessList: FC<SelectLibraryAccessListProps> = ({
    title,
    subTitle,
    policyKey,
    items,
    currentUser,
    setCurrentUser
}) => {
    const theme = useTheme();
    const handleChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = event.target.value as string;
            const existingValue = currentUser?.Policy?.[policyKey] ?? [];

            const updatedValue = existingValue.includes(value) ?
                existingValue.filter(filter => filter !== value) :
                [...existingValue, value];

            setCurrentUser(prevState => ({
                ...prevState,
                Policy: {
                    ...prevState?.Policy,
                    AuthenticationProviderId: prevState?.Policy?.AuthenticationProviderId || '',
                    PasswordResetProviderId: prevState?.Policy?.PasswordResetProviderId || '',
                    [policyKey]: updatedValue.length ? updatedValue : undefined
                }
            }));
        },
        [currentUser?.Policy, policyKey, setCurrentUser]
    );

    return (
        <Stack spacing={2}>
            <Typography variant='h2' className='checkboxListLabel'>
                {globalize.translate(title)}
            </Typography>
            <FormControl>
                <FormGroup sx={{ px: 2, backgroundColor: theme.palette.background.paper }}>
                    {items?.map((item) => (
                        <FormControlLabel
                            key={item.Id}
                            control={
                                <Checkbox
                                    checked={
                                        currentUser?.Policy?.[policyKey]?.includes(item.Id || '') || false
                                    }
                                    onChange={handleChange}
                                    value={item.Id}
                                />
                            }
                            label={getTitle(item.Name, (item as DeviceInfo)?.AppName )}
                        />
                    ))}
                </FormGroup>
                <FormHelperText className='fieldDescription'>{globalize.translate(subTitle)}</FormHelperText>
            </FormControl>
        </Stack>
    );
};

export default SelectLibraryAccessList;
