import { vars } from 'styles/tokens.css.ts';

import { z } from 'zod';
import { useForm } from '@tanstack/react-form';
import React, { useState } from 'react';
import { PersonKind } from '@jellyfin/sdk/lib/generated-client/models/person-kind';
import globalize from '../../lib/globalize';
import { Input } from 'ui-primitives';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'ui-primitives';
import { FormControl, FormLabel } from 'ui-primitives';
import {
    Dialog,
    DialogPortal,
    DialogOverlayComponent,
    DialogContentComponent,
    DialogTitle
} from 'ui-primitives';
import { Button } from 'ui-primitives';
import { Flex } from 'ui-primitives';

const personSchema = z.object({
    Name: z.string().min(1, globalize.translate('NameIsRequired')),
    Type: z.nativeEnum(PersonKind),
    Role: z.string().optional().nullable()
});

type PersonValues = z.infer<typeof personSchema>;

interface PersonEditorDialogProps {
    open: boolean;
    person: PersonValues | null;
    onClose: () => void;
    onSave: (updatedPerson: PersonValues) => void;
}

const typeOptions = Object.values(PersonKind)
    .filter(t => t !== PersonKind.Unknown)
    .map(t => ({ label: globalize.translate(t), value: t }));

const showRoleForType = (type: PersonKind): boolean => {
    return type === PersonKind.Actor || type === PersonKind.GuestStar;
};

function PersonEditorDialog({ open, person, onClose, onSave }: PersonEditorDialogProps) {
    const [showRole, setShowRole] = useState(person ? showRoleForType(person.Type) : true);

    const form = useForm({
        defaultValues:
            person ||
            ({
                Name: '',
                Type: PersonKind.Actor,
                Role: ''
            } as PersonValues),
        onSubmit: async ({ value }) => {
            onSave(value);
            onClose();
        }
    });

    const handleTypeChange = (value: string) => {
        const type = value as PersonKind;
        form.setFieldValue('Type', type);
        setShowRole(showRoleForType(type));
        if (!showRoleForType(type)) {
            form.setFieldValue('Role', null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogPortal>
                <DialogOverlayComponent />
                <DialogContentComponent style={{ minWidth: 400 }}>
                    <DialogTitle>{globalize.translate(person ? 'HeaderEditPerson' : 'HeaderAddPerson')}</DialogTitle>
                    <form
                        onSubmit={e => {
                            e.preventDefault();
                            form.handleSubmit();
                        }}
                    >
                        <Flex direction="column" style={{ gap: vars.spacing['4'], marginTop: vars.spacing['2'] }}>
                            <form.Field name="Name">
                                {field => (
                                    <Input
                                        label={globalize.translate('LabelName')}
                                        value={field.state.value}
                                        onChange={e => field.handleChange(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                )}
                            </form.Field>

                            <FormControl>
                                <FormLabel>{globalize.translate('LabelType')}</FormLabel>
                                <Select value={form.state.values.Type} onValueChange={handleTypeChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {typeOptions.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormControl>

                            {showRole && (
                                <form.Field name="Role">
                                    {field => (
                                        <Input
                                            label={globalize.translate('LabelRole')}
                                            value={field.state.value || ''}
                                            onChange={e => field.handleChange(e.target.value || null)}
                                        />
                                    )}
                                </form.Field>
                            )}
                        </Flex>

                        <Flex gap="8px" style={{ marginTop: vars.spacing['4'] }}>
                            <Button type="submit" variant="primary">
                                {globalize.translate('Save')}
                            </Button>
                            <Button variant="ghost" onClick={onClose}>
                                {globalize.translate('ButtonCancel')}
                            </Button>
                        </Flex>
                    </form>
                </DialogContentComponent>
            </DialogPortal>
        </Dialog>
    );
}

export { PersonEditorDialog };
