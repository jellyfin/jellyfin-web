import React from 'react';
import { Flex } from 'ui-primitives/Box';
import { Checkbox } from 'ui-primitives/Checkbox';
import { FormControl, FormHelperText } from 'ui-primitives/FormControl';
import { Input } from 'ui-primitives/Input';
import { Heading } from 'ui-primitives/Text';

import globalize from 'lib/globalize';

import type { DisplaySettingsValues } from '../types/displaySettingsValues';

interface LibraryPreferencesProps {
    onChange: (event: React.SyntheticEvent) => void;
    values: DisplaySettingsValues;
}

export function LibraryPreferences({ onChange, values }: Readonly<LibraryPreferencesProps>) {
    return (
        <Flex direction="column" gap="24px">
            <Heading.H2>{globalize.translate('HeaderLibraries')}</Heading.H2>

            <Input
                aria-describedby="display-settings-lib-pagesize-description"
                value={values.libraryPageSize}
                label={globalize.translate('LabelLibraryPageSize')}
                name="libraryPageSize"
                onChange={onChange}
                type="number"
                inputMode="numeric"
                max={1000}
                min={0}
                pattern="[0-9]"
                required
                step={1}
                helperText={globalize.translate('LabelLibraryPageSizeHelp')}
            />

            <FormControl>
                <Checkbox
                    aria-describedby="display-settings-lib-backdrops-description"
                    checked={values.enableLibraryBackdrops}
                    onChange={onChange}
                    name="enableLibraryBackdrops"
                >
                    {globalize.translate('Backdrops')}
                </Checkbox>
                <FormHelperText id="display-settings-lib-backdrops-description">
                    {globalize.translate('EnableBackdropsHelp')}
                </FormHelperText>
            </FormControl>

            <FormControl>
                <Checkbox
                    aria-describedby="display-settings-lib-theme-songs-description"
                    checked={values.enableLibraryThemeSongs}
                    onChange={onChange}
                    name="enableLibraryThemeSongs"
                >
                    {globalize.translate('ThemeSongs')}
                </Checkbox>
                <FormHelperText id="display-settings-lib-theme-songs-description">
                    {globalize.translate('EnableThemeSongsHelp')}
                </FormHelperText>
            </FormControl>

            <FormControl>
                <Checkbox
                    aria-describedby="display-settings-lib-theme-videos-description"
                    checked={values.enableLibraryThemeVideos}
                    onChange={onChange}
                    name="enableLibraryThemeVideos"
                >
                    {globalize.translate('ThemeVideos')}
                </Checkbox>
                <FormHelperText id="display-settings-lib-theme-videos-description">
                    {globalize.translate('EnableThemeVideosHelp')}
                </FormHelperText>
            </FormControl>

            <FormControl>
                <Checkbox
                    aria-describedby="display-settings-show-missing-episodes-description"
                    checked={values.displayMissingEpisodes}
                    onChange={onChange}
                    name="displayMissingEpisodes"
                >
                    {globalize.translate('DisplayMissingEpisodesWithinSeasons')}
                </Checkbox>
                <FormHelperText id="display-settings-show-missing-episodes-description">
                    {globalize.translate('DisplayMissingEpisodesWithinSeasonsHelp')}
                </FormHelperText>
            </FormControl>
        </Flex>
    );
}
