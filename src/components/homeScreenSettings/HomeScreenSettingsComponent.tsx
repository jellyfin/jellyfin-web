import { vars } from '../../styles/tokens.css';

import React, { useState, useEffect } from 'react';
import { Button } from 'ui-primitives/Button';
import { Box, Flex } from 'ui-primitives/Box';
import { Text } from 'ui-primitives/Text';
import { Checkbox } from 'ui-primitives/Checkbox';
import { FormControl, FormLabel } from 'ui-primitives/FormControl';
import { logger } from 'utils/logger';
import { getEnvironmentContext, generateEventId } from 'utils/observability';

interface HomeScreenSettingsProps {
    isTv?: boolean;
}

interface LandingScreenOption {
    value: string;
    name: string;
}

interface CollectionView {
    Id: string;
    Name: string;
    CollectionType?: string;
}

const HomeScreenSettingsComponent: React.FC<HomeScreenSettingsProps> = ({ isTv = false }) => {
    const [tvHomeScreen, setTvHomeScreen] = useState<string>('horizontal');
    const [hidePlayedFromLatest, setHidePlayedFromLatest] = useState<boolean>(false);
    const [numConfigurableSections, setNumConfigurableSections] = useState<number>(6);
    const [homeSectionsOrder, setHomeSectionsOrder] = useState<Record<number, string>>({});
    const [landingScreens, setLandingScreens] = useState<Record<string, string>>({});
    const [enableSaveButton, setEnableSaveButton] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [landingScreenOptions, setLandingScreenOptions] = useState<Record<string, LandingScreenOption[]>>({});
    const [views, setViews] = useState<CollectionView[]>([]);

    const sectionLabels = Array.from({ length: numConfigurableSections }, (_, i) => `Home Screen Section ${i + 1}`);

    useEffect(() => {
        logger.emit({
            operation: 'HomeScreenSettings.Initialized',
            component: 'HomeScreenSettingsComponent',
            outcome: 'success',
            eventId: generateEventId(),
            environment: getEnvironmentContext(),
            sessionId: globalThis.sessionStorage?.getItem('sessionId') || 'unknown',
            userId: globalThis.localStorage?.getItem('userId') || 'anonymous',
            businessContext: {
                isTv,
                numSections: numConfigurableSections,
                userContext: {
                    platform: navigator.platform,
                    userAgent: navigator.userAgent.substring(0, 100)
                }
            }
        });
    }, [isTv, numConfigurableSections]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            logger.emit({
                operation: 'HomeScreenSettings.SaveStarted',
                component: 'HomeScreenSettingsComponent',
                outcome: 'success',
                eventId: generateEventId(),
                environment: getEnvironmentContext(),
                sessionId: globalThis.sessionStorage?.getItem('sessionId') || 'unknown',
                userId: globalThis.localStorage?.getItem('userId') || 'anonymous',
                businessContext: {
                    settings: {
                        tvHomeScreen,
                        hidePlayedFromLatest,
                        homeSectionsOrder,
                        landingScreens
                    }
                }
            });

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            logger.emit({
                operation: 'HomeScreenSettings.SaveCompleted',
                component: 'HomeScreenSettingsComponent',
                outcome: 'success',
                eventId: generateEventId(),
                environment: getEnvironmentContext(),
                sessionId: globalThis.sessionStorage?.getItem('sessionId') || 'unknown',
                userId: globalThis.localStorage?.getItem('userId') || 'anonymous',
                businessContext: {
                    success: true,
                    settingsCount: Object.keys(homeSectionsOrder).length + Object.keys(landingScreens).length
                }
            });
        } catch (error) {
            logger.emit({
                operation: 'HomeScreenSettings.SaveFailed',
                component: 'HomeScreenSettingsComponent',
                outcome: 'error',
                eventId: generateEventId(),
                environment: getEnvironmentContext(),
                sessionId: globalThis.sessionStorage?.getItem('sessionId') || 'unknown',
                userId: globalThis.localStorage?.getItem('userId') || 'anonymous',
                error:
                    error instanceof Error
                        ? {
                              name: error.name,
                              message: error.message,
                              stack: error.stack
                          }
                        : {
                              name: 'UnknownError',
                              message: 'Unknown error'
                          },
                businessContext: {
                    settings: {
                        tvHomeScreen,
                        hidePlayedFromLatest
                    }
                }
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleLandingScreenChange = (viewId: string, value: string) => {
        setLandingScreens(prev => ({
            ...prev,
            [viewId]: value
        }));
        setEnableSaveButton(true);
    };

    const handleSectionOrderChange = (sectionIndex: number, value: string) => {
        setHomeSectionsOrder(prev => {
            const newOrder = { ...prev };
            newOrder[sectionIndex] = value;
            return newOrder;
        });
        setEnableSaveButton(true);
    };

    return (
        <Box>
            <form
                onSubmit={e => {
                    e.preventDefault();
                    handleSave();
                }}
            >
                <Box className="verticalSection verticalSection-extrabottompadding">
                    <Text as="h2" size="lg" weight="bold">
                        Home
                    </Text>

                    {isTv && (
                        <Box style={{ marginBottom: vars.spacing['4'] }}>
                            <FormControl>
                                <FormLabel>TV Home Screen</FormLabel>
                                <select
                                    value={tvHomeScreen}
                                    onChange={e => setTvHomeScreen(e.target.value)}
                                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                >
                                    <option value="horizontal">Horizontal</option>
                                    <option value="vertical">Vertical</option>
                                </select>
                                <Text size="sm" color="secondary" style={{ marginTop: vars.spacing['1'] }}>
                                    Please restart
                                </Text>
                            </FormControl>
                        </Box>
                    )}

                    <Box style={{ marginTop: vars.spacing['4'] }}>
                        <Checkbox
                            checked={hidePlayedFromLatest}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setHidePlayedFromLatest(e.target.checked)
                            }
                        >
                            Hide watched content from latest media
                        </Checkbox>
                    </Box>

                    <Box style={{ height: '24px' }} />

                    {Array.from({ length: numConfigurableSections }, (_, i) => {
                        const sectionIndex = i;
                        return (
                            <Box key={sectionIndex} style={{ marginBottom: vars.spacing['4'] }}>
                                <FormControl>
                                    <FormLabel>{sectionLabels[sectionIndex]}</FormLabel>
                                    <select
                                        value={homeSectionsOrder[sectionIndex] || ''}
                                        onChange={e => {
                                            handleSectionOrderChange(sectionIndex, e.target.value);
                                        }}
                                        style={{
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid #ccc',
                                            width: '100%'
                                        }}
                                    >
                                        <option value="">None</option>
                                        <option value="library">Library</option>
                                        <option value="resume">Continue Watching</option>
                                        <option value="latest">Latest Media</option>
                                        <option value="nextup">Next Up</option>
                                    </select>
                                </FormControl>
                            </Box>
                        );
                    })}

                    <Box style={{ height: '24px' }} />

                    {views.map(view => (
                        <Box key={view.Id} style={{ marginBottom: vars.spacing['4'] }}>
                            <FormControl>
                                <FormLabel>{view.Name} Landing Screen</FormLabel>
                                <select
                                    value={
                                        landingScreens[
                                            view.CollectionType === 'livetv' ? view.CollectionType : view.Id
                                        ] || ''
                                    }
                                    onChange={e =>
                                        handleLandingScreenChange(
                                            view.CollectionType === 'livetv' ? view.CollectionType : view.Id,
                                            e.target.value
                                        )
                                    }
                                    style={{
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: '1px solid #ccc',
                                        width: '100%'
                                    }}
                                >
                                    <option value="">Default</option>
                                    {(landingScreenOptions[view.CollectionType || ''] || []).map(opt => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.name}
                                        </option>
                                    ))}
                                </select>
                            </FormControl>
                        </Box>
                    ))}

                    {enableSaveButton && (
                        <Box style={{ marginTop: '24px' }}>
                            <Button variant="primary" type="submit" disabled={isLoading}>
                                {isLoading ? 'Saving...' : 'Save'}
                            </Button>
                        </Box>
                    )}
                </Box>
            </form>
        </Box>
    );
};

export default HomeScreenSettingsComponent;
