import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';
import { Grid } from '../Grid';
import { Box } from '../Box';
import { Text } from '../Text';

const meta: Meta<typeof Grid> = {
    title: 'UI Primitives/Grid',
    component: Grid,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof Grid>;

function DefaultStory(): ReactElement {
    return (
        <Grid container spacing='md' style={{ width: '400px' }}>
            <Grid item xs={12}>
                <Box style={{ backgroundColor: '#aa5eaa', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                    <Text color='secondary'>Full Width (12)</Text>
                </Box>
            </Grid>
            <Grid item xs={6}>
                <Box style={{ backgroundColor: '#4caf50', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                    <Text color='secondary'>Half (6)</Text>
                </Box>
            </Grid>
            <Grid item xs={6}>
                <Box style={{ backgroundColor: '#2196f3', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                    <Text color='secondary'>Half (6)</Text>
                </Box>
            </Grid>
            <Grid item xs={4}>
                <Box style={{ backgroundColor: '#ff9800', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                    <Text color='secondary'>Third (4)</Text>
                </Box>
            </Grid>
            <Grid item xs={4}>
                <Box style={{ backgroundColor: '#e91e63', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                    <Text color='secondary'>Third (4)</Text>
                </Box>
            </Grid>
            <Grid item xs={4}>
                <Box style={{ backgroundColor: '#9c27b0', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                    <Text color='secondary'>Third (4)</Text>
                </Box>
            </Grid>
        </Grid>
    );
}

export const Default: Story = {
    render: DefaultStory
};

function ResponsiveStory(): ReactElement {
    return (
        <Grid container spacing='md' style={{ width: '600px' }}>
            {Array.from({ length: 6 }, (_, i) => (
                <Grid key={i} item xs={12} sm={6} md={4}>
                    <Box style={{ backgroundColor: '#252525', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                        <Text color='secondary'>Item {i + 1}</Text>
                        <Text as='small' color='muted'>xs:12 sm:6 md:4</Text>
                    </Box>
                </Grid>
            ))}
        </Grid>
    );
}

export const Responsive: Story = {
    render: ResponsiveStory
};

function AllSpacingsStory(): ReactElement {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '500px' }}>
            {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((spacing) => (
                <Box key={spacing}>
                    <Text as='small' color='secondary' style={{ marginBottom: '8px' }}>
                        spacing=&quot;{spacing}&quot;
                    </Text>
                    <Grid container spacing={spacing}>
                        <Grid item xs={4}>
                            <Box style={{ backgroundColor: '#252525', padding: '12px', borderRadius: '4px' }}>
                                <Text size='sm'>Item</Text>
                            </Box>
                        </Grid>
                        <Grid item xs={4}>
                            <Box style={{ backgroundColor: '#252525', padding: '12px', borderRadius: '4px' }}>
                                <Text size='sm'>Item</Text>
                            </Box>
                        </Grid>
                        <Grid item xs={4}>
                            <Box style={{ backgroundColor: '#252525', padding: '12px', borderRadius: '4px' }}>
                                <Text size='sm'>Item</Text>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            ))}
        </div>
    );
}

export const AllSpacings: Story = {
    render: AllSpacingsStory
};

function TwelveColumnsStory(): ReactElement {
    return (
        <Grid container spacing='xs' style={{ width: '400px' }}>
            {Array.from({ length: 12 }, (_, i) => (
                <Grid key={i} item xs={1}>
                    <Box style={{ backgroundColor: '#aa5eaa', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                        <Text size='xs'>{i + 1}</Text>
                    </Box>
                </Grid>
            ))}
        </Grid>
    );
}

export const TwelveColumns: Story = {
    render: TwelveColumnsStory
};
