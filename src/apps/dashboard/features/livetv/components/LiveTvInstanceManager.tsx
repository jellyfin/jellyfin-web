import React, { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import type { TunerHostInfo } from '@jellyfin/sdk/lib/generated-client/models/tuner-host-info';
import ConfirmDialog from 'components/ConfirmDialog';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';
import { queryClient } from 'utils/query/queryClient';

interface LiveTvInstanceInfo {
    Id: string;
    Name: string;
    TunerHostIds: string[];
}

interface LiveTvInstanceManagerProps {
    tunerHosts: TunerHostInfo[];
}

const QUERY_KEY = 'LiveTvInstances';
const EMPTY_ID = '00000000-0000-0000-0000-000000000000';
const EMPTY_INSTANCES: LiveTvInstanceInfo[] = [];

const LiveTvInstanceManager = ({ tunerHosts }: LiveTvInstanceManagerProps) => {
    const { __legacyApiClient__: apiClient } = useApi();
    const [ isAdding, setIsAdding ] = useState(false);
    const [ instanceToDelete, setInstanceToDelete ] = useState<LiveTvInstanceInfo>();

    const instancesQuery = useQuery({
        queryKey: [ QUERY_KEY ],
        queryFn: () => apiClient!.getJSON(apiClient!.getUrl('LiveTv/Instances')) as Promise<LiveTvInstanceInfo[]>,
        enabled: !!apiClient
    });

    const saveInstance = useMutation({
        mutationFn: (instance: LiveTvInstanceInfo) => apiClient!.ajax({
            type: 'POST',
            url: apiClient!.getUrl('LiveTv/Instances'),
            data: JSON.stringify(instance),
            contentType: 'application/json'
        }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [ QUERY_KEY ] })
    });

    const deleteInstance = useMutation({
        mutationFn: (id: string) => apiClient!.ajax({
            type: 'DELETE',
            url: apiClient!.getUrl(`LiveTv/Instances/${id}`)
        }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [ QUERY_KEY ] })
    });

    const instances = instancesQuery.data || EMPTY_INSTANCES;
    const assignedTunerIds = useMemo(() => new Set(
        instances.flatMap(instance => instance.TunerHostIds || [])
    ), [ instances ]);

    const onSave = useCallback((instance: LiveTvInstanceInfo) => {
        saveInstance.mutate(instance, {
            onSuccess: () => {
                if (instance.Id === EMPTY_ID) {
                    setIsAdding(false);
                }
            }
        });
    }, [ saveInstance ]);

    const onDelete = useCallback(() => {
        if (instanceToDelete) {
            deleteInstance.mutate(instanceToDelete.Id, {
                onSettled: () => setInstanceToDelete(undefined)
            });
        }
    }, [ deleteInstance, instanceToDelete ]);

    if (instancesQuery.isPending) {
        return null;
    }

    return (
        <Stack spacing={2}>
            <Typography variant='h2'>{globalize.translate('HeaderLiveTvInstances')}</Typography>
            <Typography>
                {globalize.translate('MessageLiveTvInstances')}
            </Typography>

            {(instancesQuery.isError || saveInstance.isError || deleteInstance.isError) && (
                <Alert severity='error'>{globalize.translate('HeaderError')}</Alert>
            )}

            {instances.map(instance => (
                <LiveTvInstanceEditor
                    key={instance.Id}
                    instance={instance}
                    tunerHosts={tunerHosts}
                    assignedTunerIds={assignedTunerIds}
                    isSaving={saveInstance.isPending}
                    onSave={onSave}
                    onDelete={() => setInstanceToDelete(instance)}
                />
            ))}

            {isAdding ? (
                <LiveTvInstanceEditor
                    tunerHosts={tunerHosts}
                    assignedTunerIds={assignedTunerIds}
                    isSaving={saveInstance.isPending}
                    onSave={onSave}
                    onCancel={() => setIsAdding(false)}
                />
            ) : (
                <Button
                    sx={{ alignSelf: 'flex-start' }}
                    startIcon={<AddIcon />}
                    onClick={() => setIsAdding(true)}
                >
                    {globalize.translate('ButtonAddLiveTvInstance')}
                </Button>
            )}

            <ConfirmDialog
                open={!!instanceToDelete}
                title={globalize.translate('HeaderDeleteLiveTvInstance')}
                text={globalize.translate('MessageDeleteLiveTvInstance')}
                onCancel={() => setInstanceToDelete(undefined)}
                onConfirm={onDelete}
                confirmButtonColor='error'
                confirmButtonText={globalize.translate('Delete')}
            />
        </Stack>
    );
};

interface LiveTvInstanceEditorProps {
    instance?: LiveTvInstanceInfo;
    tunerHosts: TunerHostInfo[];
    assignedTunerIds: Set<string>;
    isSaving: boolean;
    onSave: (instance: LiveTvInstanceInfo) => void;
    onDelete?: () => void;
    onCancel?: () => void;
}

const LiveTvInstanceEditor = ({
    instance,
    tunerHosts,
    assignedTunerIds,
    isSaving,
    onSave,
    onDelete,
    onCancel
}: LiveTvInstanceEditorProps) => {
    const [ name, setName ] = useState(instance?.Name || '');
    const [ selectedTunerIds, setSelectedTunerIds ] = useState<string[]>(instance?.TunerHostIds || []);
    const toggleTuner = (id: string) => {
        setSelectedTunerIds(current => {
            if (current.includes(id)) {
                return current.filter(tunerId => tunerId !== id);
            }

            return [ ...current, id ];
        });
    };

    const save = () => onSave({
        Id: instance?.Id || EMPTY_ID,
        Name: name.trim(),
        TunerHostIds: selectedTunerIds
    });

    return (
        <Card>
            <CardContent>
                <Stack spacing={2}>
                    <TextField
                        label={globalize.translate('LabelName')}
                        value={name}
                        onChange={event => setName(event.target.value)}
                        disabled={isSaving}
                        fullWidth
                    />
                    <FormGroup>
                        {tunerHosts.map(tuner => {
                            const id = tuner.Id || '';
                            const isAssignedElsewhere = assignedTunerIds.has(id)
                                && !instance?.TunerHostIds.includes(id);
                            const label = tuner.FriendlyName || tuner.Url || id;

                            return (
                                <FormControlLabel
                                    key={id}
                                    label={label}
                                    control={(
                                        <Checkbox
                                            checked={selectedTunerIds.includes(id)}
                                            onChange={() => toggleTuner(id)}
                                            disabled={!id || isAssignedElsewhere || isSaving}
                                        />
                                    )}
                                />
                            );
                        })}
                    </FormGroup>
                    <Box display='flex' gap={1}>
                        <Button
                            startIcon={<SaveIcon />}
                            onClick={save}
                            disabled={!name.trim() || selectedTunerIds.length === 0 || isSaving}
                        >
                            {globalize.translate('Save')}
                        </Button>
                        {onDelete && (
                            <Button
                                color='error'
                                startIcon={<DeleteIcon />}
                                onClick={onDelete}
                            >
                                {globalize.translate('Delete')}
                            </Button>
                        )}
                        {onCancel && (
                            <Button onClick={onCancel}>
                                {globalize.translate('ButtonCancel')}
                            </Button>
                        )}
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default LiveTvInstanceManager;
