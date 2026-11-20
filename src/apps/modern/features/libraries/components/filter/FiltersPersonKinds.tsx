import { PersonKind } from '@jellyfin/sdk/lib/generated-client/models/person-kind';
import React, { FC, useCallback } from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import globalize from 'lib/globalize';
import { LibraryViewSettings } from 'types/library';

interface FiltersPersonKindsProps {
    availablePersonKinds: PersonKind[];
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const isDefaultSelection = (selected: PersonKind[], available: PersonKind[]) =>
    selected.length === available.length && available.every((personKind) => selected.includes(personKind));

const FiltersPersonKinds: FC<FiltersPersonKindsProps> = ({
    availablePersonKinds,
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    // all roles are enabled by default until the user makes an explicit selection
    const selectedPersonKinds = libraryViewSettings?.Filters?.PersonKinds ?? availablePersonKinds;

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
                    PersonKinds: isDefaultSelection(updatedPersonKinds, availablePersonKinds) ? undefined : updatedPersonKinds
                }
            }));
        },
        [setLibraryViewSettings, selectedPersonKinds, availablePersonKinds]
    );

    return (
        <FormGroup>
            {availablePersonKinds.map((personKind) => (
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
