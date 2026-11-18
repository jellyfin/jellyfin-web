import { PersonKind } from '@jellyfin/sdk/lib/generated-client/models/person-kind';
import React, { FC, useCallback } from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import globalize from 'lib/globalize';
import { LibraryViewSettings } from 'types/library';

import { VIDEO_PERSON_KINDS } from '../../constants/personKinds';

interface FiltersPersonKindsProps {
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const FiltersPersonKinds: FC<FiltersPersonKindsProps> = ({
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    // all roles are enabled by default until the user makes an explicit selection
    const selectedPersonKinds = libraryViewSettings?.Filters?.PersonKinds ?? VIDEO_PERSON_KINDS;

    const onFiltersPersonKindsChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = event.target.value as PersonKind;

            const updatedPersonKinds = selectedPersonKinds.includes(value) ?
                selectedPersonKinds.filter((personKind) => personKind !== value) :
                [...selectedPersonKinds, value];

            setLibraryViewSettings((prevState) => ({
                ...prevState,
                StartIndex: 0,
                Filters: {
                    ...prevState.Filters,
                    PersonKinds: updatedPersonKinds.length === VIDEO_PERSON_KINDS.length ? undefined : updatedPersonKinds
                }
            }));
        },
        [setLibraryViewSettings, selectedPersonKinds]
    );

    return (
        <FormGroup>
            {VIDEO_PERSON_KINDS.map((personKind) => (
                <FormControlLabel
                    key={personKind}
                    control={
                        <Checkbox
                            checked={selectedPersonKinds.includes(personKind)}
                            onChange={onFiltersPersonKindsChange}
                            value={personKind}
                        />
                    }
                    label={globalize.translate(personKind)}
                />
            ))}
        </FormGroup>
    );
};

export default FiltersPersonKinds;
