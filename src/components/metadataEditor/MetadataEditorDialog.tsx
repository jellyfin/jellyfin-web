import { PersonKind } from '@jellyfin/sdk/lib/generated-client/models/person-kind';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import React, { useCallback, useState } from 'react';
import { vars } from 'styles/tokens.css.ts';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogCloseButton,
    DialogContentComponent,
    DialogOverlayComponent,
    DialogPortal,
    Divider,
    Flex,
    FormHelperText,
    FormLabel,
    Heading,
    Input,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Text
} from 'ui-primitives';
import { z } from 'zod';
import toast from '../toast/toast';
import { PersonEditorDialog } from './PersonEditorDialog';

const metadataSchema = z.object({
    Name: z.string().min(1, globalize.translate('NameIsRequired')),
    ForcedSortName: z.string().optional(),
    Overview: z.string().optional(),
    ProductionYear: z.number().int().min(1800).max(2100).optional().nullable(),
    CommunityRating: z.number().min(0).max(10).optional().nullable(),
    OfficialRating: z.string().optional().nullable()
});

type MetadataValues = z.infer<typeof metadataSchema>;

interface MetadataEditorDialogProps {
    itemId: string;
    serverId: string;
    onClose: () => void;
}

interface MetadataEditorConfig {
    ParentalRatingOptions: Array<{ Name: string }>;
    ExternalIdInfos: Array<{ Key: string; Name: string }>;
}

function MetadataEditorDialog({ itemId, serverId, onClose }: MetadataEditorDialogProps) {
    const [open, setOpen] = useState(true);
    const [personDialogOpen, setPersonDialogOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState<{
        Name: string;
        Type: PersonKind;
        Role?: string | null;
    } | null>(null);
    const [editingPersonIndex, setEditingPersonIndex] = useState(-1);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [overview, setOverview] = useState('');

    const apiClient = ServerConnections.getApiClient(serverId);
    const queryClient = useQueryClient();

    const { data: item, isLoading: itemLoading } = useQuery({
        queryKey: ['item', itemId],
        queryFn: () => apiClient.getItem(apiClient.getCurrentUserId(), itemId),
        staleTime: 30_000
    });

    const { data: config, isLoading: configLoading } = useQuery({
        queryKey: ['metadataEditorConfig', itemId],
        queryFn: async (): Promise<MetadataEditorConfig> => {
            const response = await apiClient.ajax({
                url: apiClient.getUrl(`Items/${itemId}/MetadataEditor`),
                type: 'GET'
            });
            return response.json();
        },
        staleTime: 60_000
    });

    const updateItemMutation = useMutation({
        mutationFn: async (values: any) => {
            await apiClient.updateItem(values);
        },
        onSuccess: () => {
            toast(globalize.translate('MessageItemSaved'));
            queryClient.invalidateQueries({ queryKey: ['item', itemId] });
            handleClose();
        },
        onError: (error) => {
            setSaveError(
                error instanceof Error ? error.message : globalize.translate('ErrorDefault')
            );
        }
    });

    const handleClose = useCallback(() => {
        setOpen(false);
        onClose();
    }, [onClose]);

    const handleOpenChange = useCallback(
        (next: boolean) => {
            if (!next) handleClose();
            setOpen(next);
        },
        [handleClose]
    );

    const handlePersonEdit = useCallback((person: any, index: number) => {
        if (person) {
            setEditingPerson({
                Name: person.Name || '',
                Type: person.Type || PersonKind.Actor,
                Role: person.Role
            });
        } else {
            setEditingPerson(null);
        }
        setEditingPersonIndex(index);
        setPersonDialogOpen(true);
    }, []);

    const handlePersonSave = useCallback(
        (updatedPerson: { Name: string; Type: PersonKind; Role?: string | null }) => {
            if (!item) return;

            const people = [...(item.People || [])];
            const newPerson = {
                Name: updatedPerson.Name,
                Type: updatedPerson.Type,
                Role: updatedPerson.Role
            };

            if (editingPersonIndex >= 0) {
                people[editingPersonIndex] = newPerson;
            } else {
                people.push(newPerson);
            }

            updateItemMutation.mutate({
                ...item,
                People: people
            });
        },
        [item, editingPersonIndex, updateItemMutation]
    );

    const handlePersonDelete = useCallback(
        (index: number) => {
            if (!item || !item.People) return;

            const people = [...item.People];
            people.splice(index, 1);

            updateItemMutation.mutate({
                ...item,
                People: people
            });
        },
        [item, updateItemMutation]
    );

    const form = useForm({
        defaultValues: {
            Name: item?.Name || '',
            ForcedSortName: item?.ForcedSortName || '',
            ProductionYear: item?.ProductionYear || null,
            CommunityRating: item?.CommunityRating || null,
            OfficialRating: item?.OfficialRating || ''
        } as Omit<MetadataValues, 'Overview' | 'ProviderIds'>,
        onSubmit: async ({ value: values }) => {
            if (!item) return;
            setSaveError(null);
            updateItemMutation.mutate({
                ...item,
                ...values,
                Overview: overview,
                ProviderIds: item.ProviderIds || {}
            });
        }
    });

    const isLoading = itemLoading || configLoading || updateItemMutation.isPending;

    if (itemLoading || configLoading) {
        return (
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogPortal>
                    <DialogOverlayComponent />
                    <DialogContentComponent
                        style={{ padding: vars.spacing['6'], textAlign: 'center' }}
                    >
                        <CircularProgress size="lg" />
                        <Text style={{ marginTop: vars.spacing['4'] }}>
                            {globalize.translate('Loading')}
                        </Text>
                    </DialogContentComponent>
                </DialogPortal>
            </Dialog>
        );
    }

    if (!item || !config) {
        return null;
    }

    const people = item.People || [];
    const providerIds = item.ProviderIds || {};

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogPortal>
                <DialogOverlayComponent />
                <DialogContentComponent
                    style={{
                        padding: '32px',
                        maxWidth: '800px',
                        width: 'min(94vw, 800px)',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }}
                >
                    <Flex
                        align="center"
                        justify="space-between"
                        style={{ marginBottom: vars.spacing['5'] }}
                    >
                        <Heading.H3>{globalize.translate('HeaderEditMetadata')}</Heading.H3>
                        <DialogCloseButton onClick={() => setOpen(false)} />
                    </Flex>

                    {saveError && (
                        <Alert variant="error" style={{ marginBottom: vars.spacing['5'] }}>
                            {saveError}
                        </Alert>
                    )}

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.handleSubmit();
                        }}
                    >
                        <Flex direction="column" style={{ gap: '24px' }}>
                            <form.Field name="Name">
                                {(field) => (
                                    <Box>
                                        <Input
                                            label={globalize.translate('LabelName')}
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            required
                                        />
                                        {field.state.meta.errors[0] && (
                                            <FormHelperText style={{ color: 'var(--error)' }}>
                                                {field.state.meta.errors[0]}
                                            </FormHelperText>
                                        )}
                                    </Box>
                                )}
                            </form.Field>

                            <form.Field name="ForcedSortName">
                                {(field) => (
                                    <Input
                                        label={globalize.translate('LabelSortName')}
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                    />
                                )}
                            </form.Field>

                            <Box>
                                <FormLabel>{globalize.translate('LabelOverview')}</FormLabel>
                                <textarea
                                    value={overview}
                                    onChange={(e) => setOverview(e.target.value)}
                                    rows={4}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: 'var(--surface)',
                                        border: '1px solid var(--divider)',
                                        borderRadius: '8px',
                                        color: 'var(--text)',
                                        fontFamily: 'inherit',
                                        resize: 'vertical'
                                    }}
                                />
                            </Box>

                            <Flex gap="16px" wrap="wrap">
                                <form.Field name="ProductionYear">
                                    {(field) => (
                                        <Input
                                            label={globalize.translate('LabelYear')}
                                            type="number"
                                            value={field.state.value?.toString() || ''}
                                            onChange={(e) =>
                                                field.handleChange(parseInt(e.target.value) || null)
                                            }
                                            min={1800}
                                            max={2100}
                                            style={{ width: '120px' }}
                                        />
                                    )}
                                </form.Field>

                                <form.Field name="CommunityRating">
                                    {(field) => (
                                        <Input
                                            label={globalize.translate('LabelCommunityRating')}
                                            type="number"
                                            value={field.state.value?.toString() || ''}
                                            onChange={(e) =>
                                                field.handleChange(
                                                    parseFloat(e.target.value) || null
                                                )
                                            }
                                            step={0.1}
                                            min={0}
                                            max={10}
                                            style={{ width: '120px' }}
                                        />
                                    )}
                                </form.Field>

                                <Box style={{ minWidth: '150px' }}>
                                    <FormLabel>
                                        {globalize.translate('LabelOfficialRating')}
                                    </FormLabel>
                                    <Select
                                        value={form.state.values.OfficialRating || ''}
                                        onValueChange={(val) =>
                                            form.setFieldValue('OfficialRating', val || null)
                                        }
                                    >
                                        <SelectTrigger style={{ width: '100%' }}>
                                            <SelectValue placeholder="" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {config.ParentalRatingOptions.map((option) => (
                                                <SelectItem key={option.Name} value={option.Name}>
                                                    {option.Name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Box>
                            </Flex>

                            <Divider />

                            <Heading.H4>{globalize.translate('HeaderExternalIds')}</Heading.H4>

                            <Flex gap="16px" wrap="wrap">
                                {config.ExternalIdInfos.map((idInfo) => (
                                    <Input
                                        key={idInfo.Key}
                                        label={idInfo.Name}
                                        value={providerIds[idInfo.Key] || ''}
                                        onChange={(e) => {
                                            const newIds = {
                                                ...providerIds,
                                                [idInfo.Key]: e.target.value
                                            };
                                            item.ProviderIds = newIds;
                                        }}
                                        style={{ width: '200px' }}
                                    />
                                ))}
                            </Flex>

                            <Divider />

                            <Heading.H4>{globalize.translate('HeaderPeople')}</Heading.H4>

                            <Box>
                                {people.length > 0 ? (
                                    <Flex direction="column" style={{ gap: vars.spacing['2'] }}>
                                        {people.map((person: any, index: number) => (
                                            <Flex
                                                key={`${person.Name}-${person.Type}-${index}`}
                                                align="center"
                                                justify="space-between"
                                                style={{
                                                    padding: '8px',
                                                    backgroundColor: 'var(--surface)',
                                                    borderRadius: '8px'
                                                }}
                                            >
                                                <Box>
                                                    <Text weight="medium">{person.Name}</Text>
                                                    <Text size="sm" color="secondary">
                                                        {person.Type}
                                                        {person.Role && ` - ${person.Role}`}
                                                    </Text>
                                                </Box>
                                                <Flex gap="8px">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            handlePersonEdit(person, index)
                                                        }
                                                    >
                                                        {globalize.translate('Edit')}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        color="danger"
                                                        onClick={() => handlePersonDelete(index)}
                                                    >
                                                        {globalize.translate('Delete')}
                                                    </Button>
                                                </Flex>
                                            </Flex>
                                        ))}
                                    </Flex>
                                ) : (
                                    <Text color="secondary">{globalize.translate('NoPeople')}</Text>
                                )}

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    style={{ marginTop: '12px' }}
                                    onClick={() => handlePersonEdit(null, -1)}
                                >
                                    + {globalize.translate('AddPerson')}
                                </Button>
                            </Box>

                            <Flex justify="flex-end" gap="12px" style={{ marginTop: '24px' }}>
                                <Button variant="ghost" onClick={handleClose}>
                                    {globalize.translate('Cancel')}
                                </Button>
                                <Button type="submit" variant="primary" loading={isLoading}>
                                    {globalize.translate('Save')}
                                </Button>
                            </Flex>
                        </Flex>
                    </form>

                    {personDialogOpen && (
                        <PersonEditorDialog
                            open={personDialogOpen}
                            person={editingPerson}
                            onClose={() => setPersonDialogOpen(false)}
                            onSave={handlePersonSave}
                        />
                    )}
                </DialogContentComponent>
            </DialogPortal>
        </Dialog>
    );
}

export { MetadataEditorDialog };
