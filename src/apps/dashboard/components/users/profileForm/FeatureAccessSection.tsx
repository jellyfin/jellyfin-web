import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import React, { type FC } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useTheme } from '@mui/material/styles';
import globalize from 'scripts/globalize';

interface FeatureAccessSectionProps {
    currentUser: UserDto;
    onFormChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const FeatureAccessSection: FC<FeatureAccessSectionProps> = ({
    currentUser,
    onFormChange
}) => {
    const theme = useTheme();
    return (
        <Stack spacing={2}>
            <Typography variant='h2' className='checkboxListLabel'>
                {globalize.translate('HeaderFeatureAccess')}
            </Typography>
            <FormGroup
                sx={{ px: 2, backgroundColor: theme.palette.background.paper }}
            >
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={currentUser?.Policy?.EnableLiveTvAccess}
                            onChange={onFormChange}
                            name='EnableLiveTvAccess'
                        />
                    }
                    label={globalize.translate('OptionAllowBrowsingLiveTv')}
                />

                <FormControlLabel
                    control={
                        <Checkbox
                            checked={
                                currentUser?.Policy?.EnableLiveTvManagement
                            }
                            onChange={onFormChange}
                            name='EnableLiveTvManagement'
                        />
                    }
                    label={globalize.translate('OptionAllowManageLiveTv')}
                />
            </FormGroup>
        </Stack>
    );
};

export default FeatureAccessSection;
