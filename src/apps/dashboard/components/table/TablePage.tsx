import type { ColumnDef, ColumnPinningState } from '@tanstack/react-table';
import React, { type ReactNode } from 'react';

import Page, { type PageProps } from 'components/Page';
import { vars } from 'styles/tokens.css';
import { Box as UIBox, Flex } from 'ui-primitives/Box';
import { DataTable } from 'ui-primitives/DataTable';
import { Heading, Text } from 'ui-primitives/Text';

interface TablePageProps<T> extends PageProps {
    title: string;
    subtitle?: string;
    data: T[];
    columns: ColumnDef<T>[];
    isLoading?: boolean;
    pageSize?: number;
    onRowClick?: (row: T) => void;
    manualPagination?: boolean;
    rowCount?: number;
    pagination?: {
        pageIndex: number;
        pageSize: number;
    };
    onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
    enableColumnResizing?: boolean;
    enableStickyHeader?: boolean;
    enableStickyFooter?: boolean;
    enableRowActions?: boolean;
    renderRowActions?: (row: T) => ReactNode;
    columnPinning?: ColumnPinningState;
    renderToolbar?: () => ReactNode;
    getRowId?: (row: T) => string;
    children?: ReactNode;
}

function TablePage<T extends unknown>({
    title,
    subtitle,
    data,
    columns,
    isLoading = false,
    pageSize = 25,
    onRowClick,
    manualPagination = false,
    rowCount,
    pagination,
    onPaginationChange,
    enableColumnResizing = false,
    enableStickyHeader = true,
    enableStickyFooter = true,
    enableRowActions = false,
    renderRowActions,
    columnPinning,
    renderToolbar,
    getRowId,
    children,
    ...pageProps
}: TablePageProps<T>): React.ReactElement {
    const isEmpty = data.length === 0 && !isLoading;

    return (
        <Page title={title} {...pageProps}>
            <UIBox
                className='content-primary'
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%'
                }}
            >
                <Flex
                    style={{
                        flexDirection: 'column',
                        gap: vars.spacing['4'],
                        marginBottom: vars.spacing['5']
                    }}
                >
                    <Heading.H1>{title}</Heading.H1>
                    {subtitle && <Text>{subtitle}</Text>}
                </Flex>
                <DataTable<T>
                    data={data}
                    columns={columns}
                    isLoading={isLoading}
                    isEmpty={isEmpty}
                    pageSize={pageSize}
                    onRowClick={onRowClick}
                    manualPagination={manualPagination}
                    rowCount={rowCount}
                    pagination={pagination}
                    onPaginationChange={onPaginationChange}
                    enableColumnResizing={enableColumnResizing}
                    enableStickyHeader={enableStickyHeader}
                    enableStickyFooter={enableStickyFooter}
                    enableRowActions={enableRowActions}
                    renderRowActions={renderRowActions}
                    columnPinning={columnPinning}
                    renderToolbar={renderToolbar}
                    getRowId={getRowId}
                />
            </UIBox>
            {children}
        </Page>
    );
}

export default TablePage;
export type { TablePageProps };
