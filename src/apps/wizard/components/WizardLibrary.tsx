import { PlusIcon } from '@radix-ui/react-icons';
import { useNavigate } from '@tanstack/react-router';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import React, { useEffect, useState } from 'react';
import { Button, Heading, Text } from 'ui-primitives';
import BaseCard from '../../../components/cardbuilder/Card/BaseCard';
import Loading from '../../../components/loading/LoadingComponent';
import imageHelper from '../../../utils/image';
import * as styles from './WizardLibrary.css.ts';

const WizardLibrary = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [libraries, setLibraries] = useState<any[]>([]);
    const navigate = useNavigate();
    const apiClient = ServerConnections.currentApiClient();

    const loadLibraries = () => {
        const client = apiClient;
        if (!client) return;
        client.getVirtualFolders().then((result: any) => {
            setLibraries(result);
            setIsLoading(false);
        });
    };

    useEffect(() => {
        loadLibraries();
    }, [apiClient]);

    const handleAddLibrary = () => {
        import('../../../components/mediaLibraryCreator/mediaLibraryCreator').then(
            ({ default: MediaLibraryCreator }: any) => {
                new MediaLibraryCreator({
                    collectionTypeOptions: [
                        { name: globalize.translate('Movies'), value: 'movies' },
                        { name: globalize.translate('TabMusic'), value: 'music' },
                        { name: globalize.translate('Shows'), value: 'tvshows' },
                        { name: globalize.translate('Books'), value: 'books' },
                        { name: globalize.translate('HomeVideosPhotos'), value: 'homevideos' }
                    ],
                    refresh: false
                }).then((hasChanges: boolean) => {
                    if (hasChanges) loadLibraries();
                });
            }
        );
    };

    if (isLoading) return <Loading />;

    return (
        <div className={styles.container}>
            <Heading.H2 className={styles.header}>
                {globalize.translate('HeaderSetupLibraries')}
            </Heading.H2>
            <Text className={styles.helpText}>
                {globalize.translate('HeaderSetupLibrariesHelp')}
            </Text>

            <div className={styles.grid}>
                <div>
                    <BaseCard
                        title={globalize.translate('ButtonAddMediaLibrary')}
                        onClick={handleAddLibrary}
                        icon={<PlusIcon style={{ width: 48, height: 48 }} />}
                    />
                </div>
                {libraries.map((lib) => (
                    <div key={lib.ItemId}>
                        <BaseCard
                            title={lib.Name}
                            text={lib.CollectionType}
                            image={
                                lib.PrimaryImageItemId && apiClient
                                    ? apiClient.getScaledImageUrl(lib.PrimaryImageItemId, {
                                          maxWidth: 400,
                                          type: 'Primary'
                                      })
                                    : null
                            }
                            icon={
                                <span
                                    className={`material-icons ${imageHelper.getLibraryIcon(lib.CollectionType)}`}
                                    style={{ fontSize: 48 }}
                                />
                            }
                        />
                    </div>
                ))}
            </div>

            <div className={styles.buttonRow}>
                <Button size="lg" onClick={() => navigate({ to: '/wizard/settings' })}>
                    {globalize.translate('ButtonNext')}
                </Button>
            </div>
        </div>
    );
};

export default WizardLibrary;
