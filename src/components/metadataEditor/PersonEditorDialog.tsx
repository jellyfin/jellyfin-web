import React, { useState } from 'react';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import DialogTitle from '@mui/joy/DialogTitle';
import DialogContent from '@mui/joy/DialogContent';
import DialogActions from '@mui/joy/DialogActions';
import Button from '@mui/joy/Button';
import Stack from '@mui/joy/Stack';
import { PersonKind } from '@jellyfin/sdk/lib/generated-client/models/person-kind';
import globalize from '../../lib/globalize';
import { EmbyInput, EmbySelect } from '../../elements';

interface PersonEditorDialogProps {
    open: boolean;
    person: any;
    onClose: () => void;
    onSave: (updatedPerson: any) => void;
}

const PersonEditorDialog: React.FC<PersonEditorDialogProps> = ({ open, person, onClose, onSave }) => {
    const [ name, setName ] = useState(person.Name || '');
    const [ type, setType ] = useState(person.Type || PersonKind.Actor);
    const [ role, setRole ] = useState(person.Role || '');

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...person, Name: name, Type: type, Role: role || null });
        onClose();
    };

    const typeOptions = Object.values(PersonKind)
        .filter(t => t !== PersonKind.Unknown)
        .map(t => ({ label: globalize.translate(t), value: t }));

    const showRole = [ PersonKind.Actor, PersonKind.GuestStar ].includes(type as PersonKind);

    return (
        <Modal open={open} onClose={onClose}>
            <ModalDialog component="form" onSubmit={handleSave} sx={{ minWidth: 400 }}>
                <DialogTitle>{globalize.translate('HeaderEditPerson')}</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <EmbyInput
                            label={globalize.translate('LabelName')}
                            value={name}
                            onChange={(e: any) => setName(e.target.value)}
                            required
                            autoFocus
                        />
                        <EmbySelect
                            label={globalize.translate('LabelType')}
                            value={type}
                            onChange={(_: any, val: any) => setType(val)}
                            options={typeOptions}
                        />
                        {showRole && (
                            <EmbyInput
                                label={globalize.translate('LabelRole')}
                                value={role}
                                onChange={(e: any) => setRole(e.target.value)}
                            />
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button type="submit">{globalize.translate('Save')}</Button>
                    <Button variant="plain" color="neutral" onClick={onClose}>{globalize.translate('ButtonCancel')}</Button>
                </DialogActions>
            </ModalDialog>
        </Modal>
    );
};

export default PersonEditorDialog;
