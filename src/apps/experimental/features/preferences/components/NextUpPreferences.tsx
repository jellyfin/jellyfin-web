import React from 'react';
import { Flex } from 'ui-primitives/Box';
import { Checkbox } from 'ui-primitives/Checkbox';
import { FormControl, FormHelperText } from 'ui-primitives/FormControl';
import { Input } from 'ui-primitives/Input';
import { Heading } from 'ui-primitives/Text';

import globalize from 'lib/globalize';

import type { DisplaySettingsValues } from '../types/displaySettingsValues';

interface NextUpPreferencesProps {
    onChange: (event: React.SyntheticEvent) => void;
    values: DisplaySettingsValues;
}

export function NextUpPreferences({ onChange, values }: Readonly<NextUpPreferencesProps>) {
    return (
        <Flex direction="column" gap="24px">
            <Heading.H2>{globalize.translate('NextUp')}</Heading.H2>

            <Input
                aria-describedby="display-settings-max-days-next-up-description"
                value={values.maxDaysForNextUp}
                label={globalize.translate('LabelMaxDaysForNextUp')}
                name="maxDaysForNextUp"
                onChange={onChange}
                type="number"
                inputMode="numeric"
                max={1000}
                min={0}
                pattern="[0-9]"
                required
                step={1}
                helperText={globalize.translate('LabelMaxDaysForNextUpHelp')}
            />

            <FormControl>
                <Checkbox
                    aria-describedby="display-settings-next-up-rewatching-description"
                    checked={values.enableRewatchingInNextUp}
                    onChange={onChange}
                    name="enableRewatchingInNextUp"
                >
                    {globalize.translate('EnableRewatchingNextUp')}
                </Checkbox>
                <FormHelperText id="display-settings-next-up-rewatching-description">
                    {globalize.translate('EnableRewatchingNextUpHelp')}
                </FormHelperText>
            </FormControl>

            <FormControl>
                <Checkbox
                    aria-describedby="display-settings-next-up-images-description"
                    checked={values.episodeImagesInNextUp}
                    onChange={onChange}
                    name="episodeImagesInNextUp"
                >
                    {globalize.translate('UseEpisodeImagesInNextUp')}
                </Checkbox>
                <FormHelperText id="display-settings-next-up-images-description">
                    {globalize.translate('UseEpisodeImagesInNextUpHelp')}
                </FormHelperText>
            </FormControl>
        </Flex>
    );
}
