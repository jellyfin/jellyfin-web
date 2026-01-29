import globalize from 'lib/globalize';
import React from 'react';
import { Checkbox, Flex, FormControl, FormHelperText, Heading } from 'ui-primitives';

import type { DisplaySettingsValues } from '../types/displaySettingsValues';

interface ItemDetailPreferencesProps {
    onChange: (event: React.SyntheticEvent) => void;
    values: DisplaySettingsValues;
}

export function ItemDetailPreferences({ onChange, values }: Readonly<ItemDetailPreferencesProps>) {
    return (
        <Flex direction="column" gap="16px">
            <Heading.H2>{globalize.translate('ItemDetails')}</Heading.H2>

            <FormControl>
                <Checkbox
                    aria-describedby="display-settings-item-details-banner-description"
                    checked={values.enableItemDetailsBanner}
                    onChange={onChange}
                    name="enableItemDetailsBanner"
                >
                    {globalize.translate('EnableDetailsBanner')}
                </Checkbox>
                <FormHelperText id="display-settings-item-details-banner-description">
                    {globalize.translate('EnableDetailsBannerHelp')}
                </FormHelperText>
            </FormControl>
        </Flex>
    );
}
