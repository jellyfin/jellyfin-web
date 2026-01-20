import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Typography from '@mui/joy/Typography';
import AddIcon from '@mui/icons-material/Add';
import Page from 'components/Page';
import globalize from 'lib/globalize';
import React, { useCallback, useState } from 'react';
import Stack from '@mui/joy/Stack';
import { useRepositories } from 'apps/dashboard/features/plugins/api/useRepositories';
import Loading from 'components/loading/LoadingComponent';
import Alert from '@mui/joy/Alert';
import List from '@mui/joy/List';
import Sheet from '@mui/joy/Sheet';
import RepositoryListItem from 'apps/dashboard/features/plugins/components/RepositoryListItem';
import type { RepositoryInfo } from '@jellyfin/sdk/lib/generated-client/models/repository-info';
import { useSetRepositories } from 'apps/dashboard/features/plugins/api/useSetRepositories';
import NewRepositoryForm from 'apps/dashboard/features/plugins/components/NewRepositoryForm';

export const Component = () => {
    const { data: repositories, isPending, isError } = useRepositories();
    const [ isRepositoryFormOpen, setIsRepositoryFormOpen ] = useState(false);
    const setRepositories = useSetRepositories();

    const onDelete = useCallback((repository: RepositoryInfo) => {
        if (repositories) {
            setRepositories.mutate({
                repositoryInfo: repositories.filter(currentRepo => currentRepo.Url !== repository.Url)
            });
        }
    }, [ repositories, setRepositories ]);

    const onRepositoryAdd = useCallback((repository: RepositoryInfo) => {
        if (repositories) {
            setRepositories.mutate({
                repositoryInfo: [
                    ...repositories,
                    repository
                ]
            }, {
                onSettled: () => {
                    setIsRepositoryFormOpen(false);
                }
            });
        }
    }, [ repositories, setRepositories ]);

    const openRepositoryForm = useCallback(() => {
        setIsRepositoryFormOpen(true);
    }, []);

    const onRepositoryFormClose = useCallback(() => {
        setIsRepositoryFormOpen(false);
    }, []);

    if (isPending) {
        return <Loading />;
    }

    return (
        <Page
            id='repositories'
            title={globalize.translate('TabRepositories')}
            className='type-interior mainAnimatedPage'
        >
            <NewRepositoryForm
                open={isRepositoryFormOpen}
                onClose={onRepositoryFormClose}
                onAdd={onRepositoryAdd}
            />
            <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
                {isError ? (
                    <Alert color='danger'>{globalize.translate('RepositoriesPageLoadError')}</Alert>
                ) : (
                    <Stack spacing={4}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography level='h2'>{globalize.translate('TabRepositories')}</Typography>
                            <Button
                                startDecorator={<AddIcon />}
                                onClick={openRepositoryForm}
                            >
                                {globalize.translate('HeaderNewRepository')}
                            </Button>
                        </Stack>

                        {repositories && repositories.length > 0 ? (
                            <Sheet variant="outlined" sx={{ borderRadius: 'md', overflow: 'hidden' }}>
                                <List sx={{ '--ListItem-paddingY': '12px', '--ListItem-paddingX': '16px' }}>
                                    {repositories.map((repository, index) => (
                                        <React.Fragment key={repository.Url}>
                                            <RepositoryListItem
                                                repository={repository}
                                                onDelete={onDelete}
                                            />
                                            {index < repositories.length - 1 && <div style={{ height: 1, backgroundColor: 'var(--joy-palette-divider)' }} />}
                                        </React.Fragment>
                                    ))}
                                </List>
                            </Sheet>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'background.surface', borderRadius: 'md', border: '1px dashed', borderColor: 'divider' }}>
                                <Typography level='h4' sx={{ mb: 1 }}>{globalize.translate('MessageNoRepositories')}</Typography>
                                <Typography level='body-md' color='neutral'>{globalize.translate('MessageAddRepository')}</Typography>
                            </Box>
                        )}
                    </Stack>
                )}
            </Box>
        </Page>
    );
};

Component.displayName = 'PluginRepositoriesPage';