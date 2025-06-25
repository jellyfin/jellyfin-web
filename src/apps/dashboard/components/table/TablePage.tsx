import Box from '@mui/material/Box/Box';
import Stack from '@mui/material/Stack/Stack';
import Typography from '@mui/material/Typography/Typography';
import { type MRT_RowData, type MRT_TableInstance, MaterialReactTable } from 'material-react-table';

import Page, { type PageProps } from 'components/Page';

interface TablePageProps<T extends MRT_RowData> extends PageProps {
    title: string
    subtitle?: string
    table: MRT_TableInstance<T>
}

export const DEFAULT_TABLE_OPTIONS = {
    // Enable custom features
    enableColumnPinning: true,
    enableColumnResizing: true,

    // Sticky header/footer
    enableStickyFooter: true,
    enableStickyHeader: true,
    muiTableContainerProps: {
        sx: {
            maxHeight: 'calc(100% - 7rem)' // 2 x 3.5rem for header and footer
        }
    }
};

const TablePage = <T extends MRT_RowData>({
    title,
    subtitle,
    table,
    children,
    ...pageProps
}: TablePageProps<T>) => {
    return (
        <Page
            title={title}
            {...pageProps}
        >
            <Box
                className='content-primary'
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%'
                }}
            >
                <Stack
                    spacing={2}
                    sx={{
                        marginBottom: 1
                    }}
                >
                    <Typography variant='h2'>
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography>
                            {subtitle}
                        </Typography>
                    )}
                </Stack>
                <MaterialReactTable table={table} />
            </Box>
            {children}
        </Page>
    );
};

export default TablePage;
