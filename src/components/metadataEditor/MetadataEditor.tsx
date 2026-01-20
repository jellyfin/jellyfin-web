import React, { useEffect, useState, useCallback } from 'react';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import Divider from '@mui/joy/Divider';
import Grid from '@mui/joy/Grid';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from 'lib/globalize';
import { EmbyInput, EmbySelect, EmbyCheckbox, EmbyTextarea } from '../../elements';
import Loading from '../loading/LoadingComponent';
import toast from '../toast/toast';
import PersonEditorDialog from './PersonEditorDialog';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';

interface MetadataEditorProps {
    itemId: string;
    serverId: string;
    onSave?: () => void;
}

const MetadataEditor: React.FC<MetadataEditorProps> = ({ itemId, serverId, onSave }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [item, setItem] = useState<any>(null);
    const [config, setConfig] = useState<any>(null);
    const [personDialogOpen, setPersonOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState<any>(null);
    const [editingPersonIndex, setEditingPersonIndex] = useState(-1);

    const apiClient = ServerConnections.getApiClient(serverId);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        const [itemData, editorConfig] = await Promise.all([
            apiClient.getItem(apiClient.getCurrentUserId(), itemId),
            apiClient.ajax({ url: apiClient.getUrl(`Items/${itemId}/MetadataEditor`), type: 'GET' }).then((r: any) => r.json())
        ]);
        setItem(itemData);
        setConfig(editorConfig);
        setIsLoading(false);
    }, [apiClient, itemId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await apiClient.updateItem(item);
            toast(globalize.translate('MessageItemSaved'));
            onSave?.();
        } catch (err) {
            toast(globalize.translate('ErrorDefault'));
        } finally {
            setIsLoading(false);
        }
    };

    const updateField = (name: string, value: any) => {
        setItem((prev: any) => ({ ...prev, [name]: value }));
    };

    if (isLoading) return <Loading />;

    return (
        <Box component="form" onSubmit={handleSave} sx={{ p: 3 }}>
            <Stack spacing={4}>
                <Typography level="h2">{globalize.translate('HeaderEditMetadata')}</Typography>
                
                <Grid container spacing={3}>
                    <Grid xs={12} md={6}>
                        <EmbyInput
                            label={globalize.translate('LabelName')}
                            value={item.Name || ''}
                            onChange={(e: any) => updateField('Name', e.target.value)}
                            required
                        />
                    </Grid>
                    <Grid xs={12} md={6}>
                        <EmbyInput
                            label={globalize.translate('LabelSortName')}
                            value={item.ForcedSortName || ''}
                            onChange={(e: any) => updateField('ForcedSortName', e.target.value)}
                        />
                    </Grid>
                    
                    <Grid xs={12}>
                        <EmbyTextarea
                            label={globalize.translate('LabelOverview')}
                            value={item.Overview || ''}
                            onChange={(e: any) => updateField('Overview', e.target.value)}
                            minRows={4}
                        />
                    </Grid>

                    <Grid xs={12} md={4}>
                        <EmbyInput
                            label={globalize.translate('LabelYear')}
                            type="number"
                            value={item.ProductionYear || ''}
                            onChange={(e: any) => updateField('ProductionYear', parseInt(e.target.value, 10))}
                        />
                    </Grid>
                    <Grid xs={12} md={4}>
                        <EmbyInput
                            label={globalize.translate('LabelCommunityRating')}
                            type="number"
                            value={item.CommunityRating || ''}
                            onChange={(e: any) => updateField('CommunityRating', parseFloat(e.target.value))}
                            slotProps={{ input: { step: 0.1, min: 0, max: 10 } }}
                        />
                    </Grid>
                    <Grid xs={12} md={4}>
                        <EmbySelect
                            label={globalize.translate('LabelOfficialRating')}
                            value={item.OfficialRating || ''}
                            onChange={(_: any, val: any) => updateField('OfficialRating', val)}
                            options={config.ParentalRatingOptions.map((r: any) => ({ label: r.Name, value: r.Name }))}
                        />
                    </Grid>
                </Grid>

                <Divider />

                <Typography level="title-lg">{globalize.translate('HeaderExternalIds')}</Typography>
                <Grid container spacing={2}>
                    {config.ExternalIdInfos.map((idInfo: any) => (
                        <Grid key={idInfo.Key} xs={12} md={4}>
                            <EmbyInput
                                label={idInfo.Name}
                                value={item.ProviderIds?.[idInfo.Key] || ''}
                                onChange={(e: any) => {
                                    const newIds = { ...item.ProviderIds, [idInfo.Key]: e.target.value };
                                    updateField('ProviderIds', newIds);
                                }}
                            />
                        </Grid>
                    ))}
                </Grid>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
                    <Button type="submit" size="lg" loading={isLoading}>
                        {globalize.translate('Save')}
                    </Button>
                </Box>
            </Stack>

            {editingPerson && (
                <PersonEditorDialog
                    open={personDialogOpen}
                    person={editingPerson}
                    onClose={() => setPersonOpen(false)}
                    onSave={(updated) => {
                        const newPeople = [...item.People];
                        if (editingPersonIndex >= 0) newPeople[editingPersonIndex] = updated;
                        else newPeople.push(updated);
                        updateField('People', newPeople);
                    }}
                />
            )}
        </Box>
    );
};

export default MetadataEditor;
