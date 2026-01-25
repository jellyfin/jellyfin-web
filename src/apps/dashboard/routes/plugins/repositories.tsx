import { Box, Flex } from 'ui-primitives/Box';
import { Button } from 'ui-primitives/Button';
import { Text, Heading } from 'ui-primitives/Text';
import { PlusIcon } from '@radix-ui/react-icons';
import Page from 'components/Page';
import globalize from 'lib/globalize';
import React, { useCallback, useState } from 'react';
import { Alert } from 'ui-primitives/Alert';
import { List } from 'ui-primitives/List';
import { Paper } from 'ui-primitives/Paper';
import RepositoryListItem from 'apps/dashboard/features/plugins/components/RepositoryListItem';
import type { RepositoryInfo } from '@jellyfin/sdk/lib/generated-client/models/repository-info';
import { useRepositories } from 'apps/dashboard/features/plugins/api/useRepositories';
import Loading from 'components/loading/LoadingComponent';
import { useSetRepositories } from 'apps/dashboard/features/plugins/api/useSetRepositories';
import NewRepositoryForm from 'apps/dashboard/features/plugins/components/NewRepositoryForm';

export const Component = (): React.ReactElement => {
    const { data: repositories, isPending, isError } = useRepositories();
    const [isRepositoryFormOpen, setIsRepositoryFormOpen] = useState(false);
    const setRepositories = useSetRepositories();

    const onDelete = useCallback(
        (repository: RepositoryInfo) => {
            if (repositories) {
                setRepositories.mutate({
                    repositoryInfo: repositories.filter(currentRepo => currentRepo.Url !== repository.Url)
                });
            }
        },
        [repositories, setRepositories]
    );

    const onRepositoryAdd = useCallback(
        (repository: RepositoryInfo) => {
            if (repositories) {
                setRepositories.mutate(
                    {
                        repositoryInfo: [...repositories, repository]
                    },
                    {
                        onSettled: () => {
                            setIsRepositoryFormOpen(false);
                        }
                    }
                );
            }
        },
        [repositories, setRepositories]
    );

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
            <NewRepositoryForm open={isRepositoryFormOpen} onClose={onRepositoryFormClose} onAdd={onRepositoryAdd} />
            <Box style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
                {isError ? (
                    <Alert variant='error'>{globalize.translate('RepositoriesPageLoadError')}</Alert>
                ) : (
                    <Box className={`${Flex} ${Flex.col}`} style={{ gap: 32 }}>
                        <Box
                            className={`${Flex} ${Flex.row}`}
                            style={{ justifyContent: 'space-between', alignItems: 'center' }}
                        >
                            <Heading.H2 style={{ margin: 0 }}>{globalize.translate('TabRepositories')}</Heading.H2>
                            <Button startDecorator={<PlusIcon />} onClick={openRepositoryForm}>
                                {globalize.translate('HeaderNewRepository')}
                            </Button>
                        </Box>

                        {repositories && repositories.length > 0 ? (
                            <Paper variant='outlined' style={{ borderRadius: '8px', overflow: 'hidden' }}>
                                <List
                                    style={
                                        {
                                            '--ListItem-paddingY': '12px',
                                            '--ListItem-paddingX': '16px'
                                        } as React.CSSProperties
                                    }
                                >
                                    {repositories.map((repository, index) => (
                                        <React.Fragment key={repository.Url}>
                                            <RepositoryListItem repository={repository} onDelete={onDelete} />
                                            {index < repositories.length - 1 && (
                                                <div
                                                    style={{ height: 1, backgroundColor: 'var(--joy-palette-divider)' }}
                                                />
                                            )}
                                        </React.Fragment>
                                    ))}
                                </List>
                            </Paper>
                        ) : (
                            <Box
                                style={{
                                    textAlign: 'center',
                                    paddingTop: 64,
                                    paddingBottom: 64,
                                    backgroundColor: 'var(--joy-palette-background-surface)',
                                    borderRadius: '8px',
                                    border: '1px dashed var(--joy-palette-divider)'
                                }}
                            >
                                <Heading.H4 style={{ marginBottom: 8 }}>
                                    {globalize.translate('MessageNoRepositories')}
                                </Heading.H4>
                                <Text size='md' color='secondary'>
                                    {globalize.translate('MessageAddRepository')}
                                </Text>
                            </Box>
                        )}
                    </Box>
                )}
            </Box>
        </Page>
    );
};

Component.displayName = 'PluginRepositoriesPage';
