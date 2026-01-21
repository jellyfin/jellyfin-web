import React, { useEffect, useState } from 'react';
import { Heading } from 'ui-primitives/Text';
import { CircularProgress } from 'ui-primitives/CircularProgress';
import globalize from 'lib/globalize';
import { CardBuilder } from '../../../../components/cardbuilder/builders';

interface BaseLibraryPageProps {
    titleKey: string;
    fetchData: () => Promise<any[]>;
    shape?: string;
    icon?: string;
}

const BaseLibraryPage: React.FC<BaseLibraryPageProps> = ({ titleKey, fetchData, shape = 'portrait', icon = '🎬' }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const items = await fetchData();
                setData(items);
                setIsLoading(false);
            } catch (error) {
                console.error(`Failed to load ${titleKey}:`, error);
                setIsLoading(false);
            }
        };
        loadData();
    }, [fetchData, titleKey]);

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress size="lg" />
            </div>
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            <Heading.H2 style={{ marginBottom: '24px' }}>
                {globalize.translate(titleKey)}
            </Heading.H2>
            <CardBuilder 
                items={data} 
                options={{ shape }} 
            />
        </div>
    );
};

export default BaseLibraryPage;
