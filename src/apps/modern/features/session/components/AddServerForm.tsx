import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import React, { type FC, useCallback, useEffect, useRef, useState } from 'react';

import globalize from 'lib/globalize';

import { normalizeServerAddress } from '../utils/serverAddress';

interface AddServerFormProps {
    isSubmitting?: boolean
    /** Receives the normalized address, which is never blank */
    onSubmit: (address: string) => void
    onCancel: () => void
}

// The default error label color has too little contrast on dark backgrounds; the red outline marks the field
const FIELD_SX = { '& .MuiInputLabel-root.Mui-error': { color: 'text.secondary' } };

const AddServerForm: FC<AddServerFormProps> = ({
    isSubmitting,
    onSubmit,
    onCancel
}) => {
    const [ address, setAddress ] = useState('');
    // Set when a blank address was submitted, until the address is edited
    const [ isAddressInvalid, setIsAddressInvalid ] = useState(false);
    const addressRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Entering the address is the only task of the page
        addressRef.current?.focus();
    }, []);

    const onAddressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setAddress(e.target.value);
        setIsAddressInvalid(false);
    }, []);

    const onFormSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // The submit button is not disabled while submitting (to keep its focus), so guard against resubmits here
        if (isSubmitting) return;

        const normalizedAddress = normalizeServerAddress(address);
        if (!normalizedAddress) {
            // The focused field announces the validation message through its description
            setIsAddressInvalid(true);
            addressRef.current?.focus();
            return;
        }

        onSubmit(normalizedAddress);
    }, [ address, isSubmitting, onSubmit ]);

    return (
        <form
            onSubmit={onFormSubmit}
            aria-busy={isSubmitting || undefined}
            // Browser validation would block the submit with its own message instead of the inline one
            noValidate
        >
            <Stack spacing={2}>
                <TextField
                    id='txtServerHost'
                    type='url'
                    label={globalize.translate('LabelServerHost')}
                    helperText={globalize.translate(isAddressInvalid ? 'MessageEnterServerAddress' : 'LabelServerHostHelp')}
                    value={address}
                    onChange={onAddressChange}
                    autoComplete='url'
                    inputRef={addressRef}
                    error={isAddressInvalid}
                    slotProps={{
                        // The field stays focusable and readable while submitting, but can not be edited
                        input: { readOnly: isSubmitting },
                        // Passed through to the input element, since TextField would put them on the root element
                        // where they have no effect
                        htmlInput: { autoCapitalize: 'off', autoCorrect: 'off', spellCheck: false }
                    }}
                    sx={FIELD_SX}
                    required
                />

                <Button
                    type='submit'
                    size='large'
                    color='primary'
                    // aria-disabled instead of disabled keeps the focus on the button while submitting.
                    // MUI's loading prop would disable the button, so the spinner is rendered manually.
                    aria-disabled={isSubmitting || undefined}
                    startIcon={isSubmitting ? <CircularProgress size={16} color='inherit' aria-hidden /> : undefined}
                >
                    {globalize.translate('Connect')}
                </Button>

                <Button
                    variant='text'
                    size='large'
                    // Leaving the page would abandon the connection in progress, which navigates once it is made
                    disabled={isSubmitting}
                    onClick={onCancel}
                >
                    {globalize.translate('ButtonCancel')}
                </Button>
            </Stack>
        </form>
    );
};

export default AddServerForm;
