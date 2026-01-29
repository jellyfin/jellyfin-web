import {
    type Cell,
    type ColumnDef,
    type ColumnFiltersState,
    type ColumnPinningState,
    type ColumnResizeMode,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type Header,
    type PaginationState,
    type Row,
    type SortingState,
    type Updater,
    useReactTable
} from '@tanstack/react-table';
import React, { type ReactElement, type ReactNode, useCallback, useMemo, useState } from 'react';
import { vars } from 'styles/tokens.css.ts';
import {
    dataTableActionsCellStyles,
    dataTableBodyStyles,
    dataTableCellPinnedLeftStyles,
    dataTableCellPinnedRightStyles,
    dataTableCellPinnedStyles,
    dataTableCellStyles,
    dataTableContainerStyles,
    dataTableEmptyStyles,
    dataTableHeaderCellPinnedLeftStyles,
    dataTableHeaderCellPinnedRightStyles,
    dataTableHeaderCellPinnedStyles,
    dataTableHeaderCellStyles,
    dataTableHeaderStyles,
    dataTableLoadingStyles,
    dataTablePaginationStyles,
    dataTableResizerActiveStyles,
    dataTableResizerStyles,
    dataTableRowPinnedLeftStyles,
    dataTableRowPinnedStyles,
    dataTableRowStyles,
    dataTableStyles,
    dataTableToolbarStyles
} from './DataTable.css.ts';

export {
    dataTableActionsCellStyles,
    dataTableBodyStyles,
    dataTableCellPinnedLeftStyles,
    dataTableCellPinnedRightStyles,
    dataTableCellPinnedStyles,
    dataTableCellStyles,
    dataTableContainerStyles,
    dataTableEmptyStyles,
    dataTableHeaderCellPinnedLeftStyles,
    dataTableHeaderCellPinnedRightStyles,
    dataTableHeaderCellPinnedStyles,
    dataTableHeaderCellStyles,
    dataTableHeaderStyles,
    dataTableLoadingStyles,
    dataTablePaginationStyles,
    dataTableResizerActiveStyles,
    dataTableResizerStyles,
    dataTableRowPinnedLeftStyles,
    dataTableRowPinnedStyles,
    dataTableRowStyles,
    dataTableStyles,
    dataTableToolbarStyles
};

interface DataTableProps<T> {
    readonly data: T[];
    readonly columns: ColumnDef<T>[];
    readonly isLoading?: boolean;
    readonly isEmpty?: boolean;
    readonly pageSize?: number;
    readonly onRowClick?: (row: T) => void;
    readonly sortable?: boolean;
    readonly manualPagination?: boolean;
    readonly rowCount?: number;
    readonly pagination?: {
        readonly pageIndex: number;
        readonly pageSize: number;
    };
    readonly onPaginationChange?: (pagination: {
        readonly pageIndex: number;
        readonly pageSize: number;
    }) => void;
    readonly enableColumnResizing?: boolean;
    readonly enableStickyHeader?: boolean;
    readonly enableStickyFooter?: boolean;
    readonly enableRowActions?: boolean;
    readonly renderRowActions?: (row: T) => ReactNode;
    readonly columnPinning?: ColumnPinningState;
    readonly renderToolbar?: () => ReactNode;
    readonly getRowId?: (row: T) => string;
}

function TableRow<T>({
    row,
    onRowClick,
    getCellClassName,
    getRowClassName
}: {
    readonly row: Row<T>;
    readonly onRowClick?: (row: T) => void;
    readonly getCellClassName: (cell: Cell<T, unknown>) => string;
    readonly getRowClassName: (row: Row<T>) => string;
}): ReactElement {
    const handleRowClick = useCallback((): void => {
        onRowClick?.(row.original);
    }, [onRowClick, row.original]);

    return (
        <tr
            className={getRowClassName(row)}
            onClick={handleRowClick}
            style={{ cursor: onRowClick !== undefined ? 'pointer' : 'default' }}
        >
            {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className={getCellClassName(cell)}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
            ))}
        </tr>
    );
}

function ActionsCell<T>({
    row,
    renderRowActions
}: {
    readonly row: Row<T>;
    readonly renderRowActions: (row: T) => ReactNode;
}): ReactElement {
    return <div className={dataTableActionsCellStyles}>{renderRowActions(row.original)}</div>;
}

export function DataTable<T>({
    data,
    columns,
    isLoading = false,
    isEmpty = false,
    pageSize = 25,
    onRowClick,
    sortable = true,
    manualPagination = false,
    rowCount,
    pagination,
    onPaginationChange,
    enableColumnResizing = false,
    enableStickyHeader = false,
    enableStickyFooter = false,
    enableRowActions = false,
    renderRowActions,
    columnPinning,
    renderToolbar,
    getRowId
}: DataTableProps<T>): ReactElement {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const tableColumns = useMemo(() => {
        if (!enableRowActions || renderRowActions === undefined) return columns;

        const actionColumn: ColumnDef<T> = {
            id: 'actions',
            header: '',
            cell: ({ row }) => <ActionsCell row={row} renderRowActions={renderRowActions} />,
            size: 50,
            enableResizing: false,
            enableSorting: false,
            enableColumnFilter: false
        };

        return [...columns, actionColumn];
    }, [columns, enableRowActions, renderRowActions]);

    const handlePaginationChange = useCallback(
        (updater: Updater<PaginationState>): void => {
            if (onPaginationChange !== undefined && pagination !== undefined) {
                const newPagination = typeof updater === 'function' ? updater(pagination) : updater;
                onPaginationChange({
                    pageIndex: newPagination.pageIndex,
                    pageSize: newPagination.pageSize
                });
            }
        },
        [onPaginationChange, pagination]
    );

    const table = useReactTable({
        data,
        columns: tableColumns,
        state: {
            sorting,
            columnFilters,
            pagination:
                pagination !== undefined
                    ? {
                          pageIndex: pagination.pageIndex,
                          pageSize: pagination.pageSize
                      }
                    : undefined,
            columnPinning
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onPaginationChange: handlePaginationChange,
        onColumnPinningChange: (): void => {
            // Placeholder for column pinning change if needed
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: sortable ? getSortedRowModel() : undefined,
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
        initialState: {
            pagination: {
                pageSize
            }
        },
        manualPagination,
        rowCount,
        enableColumnResizing,
        columnResizeMode: 'onChange' as ColumnResizeMode,
        getRowId
    });

    const onPrevPageClick = useCallback((): void => {
        table.previousPage();
    }, [table]);

    const onNextPageClick = useCallback((): void => {
        table.nextPage();
    }, [table]);

    const handleStopPropagation = useCallback((e: React.MouseEvent): void => {
        e.stopPropagation();
    }, []);

    const getHeaderCellClassName = useCallback((header: Header<T, unknown>): string => {
        let className = dataTableHeaderCellStyles;
        const column = header.column;
        const isPinned = column.getIsPinned();
        if (isPinned === 'left') {
            className += ` ${dataTableHeaderCellPinnedStyles} ${dataTableHeaderCellPinnedLeftStyles}`;
        } else if (isPinned === 'right') {
            className += ` ${dataTableHeaderCellPinnedStyles} ${dataTableHeaderCellPinnedRightStyles}`;
        }
        return className;
    }, []);

    const getCellClassName = useCallback((cell: Cell<T, unknown>): string => {
        let className = dataTableCellStyles;
        const column = cell.column;
        const isPinned = column.getIsPinned();
        if (isPinned === 'left') {
            className += ` ${dataTableCellPinnedStyles} ${dataTableCellPinnedLeftStyles}`;
        } else if (isPinned === 'right') {
            className += ` ${dataTableCellPinnedStyles} ${dataTableCellPinnedRightStyles}`;
        }
        return className;
    }, []);

    const getRowClassName = useCallback((row: Row<T>): string => {
        let className = dataTableRowStyles;
        const firstCell = row.getVisibleCells()[0];
        if (firstCell?.column.getIsPinned() === 'left') {
            className += ` ${dataTableRowPinnedStyles} ${dataTableRowPinnedLeftStyles}`;
        }
        return className;
    }, []);

    if (isLoading) {
        return (
            <div className={dataTableContainerStyles}>
                <div className={dataTableLoadingStyles}>Loading...</div>
            </div>
        );
    }

    if (isEmpty || (manualPagination && data.length === 0)) {
        return (
            <div className={dataTableContainerStyles}>
                <div className={dataTableEmptyStyles}>No items</div>
            </div>
        );
    }

    const pageCount = table.getPageCount();
    const tableState = table.getState();
    const currentPageIndex = tableState.pagination.pageIndex;
    const canNextPage = currentPageIndex < pageCount - 1;
    const canPrevPage = currentPageIndex > 0;

    const effectivePageSize = pagination?.pageSize ?? pageSize;
    const itemStart = currentPageIndex * effectivePageSize + 1;
    const itemEnd = Math.min((currentPageIndex + 1) * effectivePageSize, rowCount ?? data.length);
    const totalCount = rowCount ?? data.length;

    return (
        <div className={dataTableContainerStyles}>
            {renderToolbar !== undefined && (
                <div className={dataTableToolbarStyles}>{renderToolbar()}</div>
            )}
            <div style={{ overflow: 'auto', flex: 1 }}>
                <table className={dataTableStyles} style={{ width: table.getTotalSize() }}>
                    <thead
                        className={dataTableHeaderStyles}
                        style={enableStickyHeader ? { position: 'sticky', top: 0, zIndex: 2 } : {}}
                    >
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    const onHeaderClick = header.column.getToggleSortingHandler();

                                    return (
                                        <th
                                            key={header.id}
                                            className={getHeaderCellClassName(header)}
                                            style={{ width: header.getSize() }}
                                            onClick={onHeaderClick}
                                        >
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                            {{
                                                asc: ' ↑',
                                                desc: ' ↓'
                                            }[header.column.getIsSorted() as string] ?? null}
                                            {enableColumnResizing &&
                                                header.column.getCanResize() && (
                                                    <button
                                                        type="button"
                                                        onClick={handleStopPropagation}
                                                        onMouseDown={header.getResizeHandler()}
                                                        onTouchStart={header.getResizeHandler()}
                                                        className={`${dataTableResizerStyles} ${header.column.getIsResizing() ? dataTableResizerActiveStyles : ''}`}
                                                        aria-label="Resize column"
                                                    />
                                                )}
                                        </th>
                                    );
                                })}
                            </tr>
                        ))}
                    </thead>
                    <tbody className={dataTableBodyStyles}>
                        {table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                row={row}
                                onRowClick={onRowClick}
                                getCellClassName={getCellClassName}
                                getRowClassName={getRowClassName}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
            {(manualPagination || pageCount > 1) && (
                <div
                    className={dataTablePaginationStyles}
                    style={enableStickyFooter ? { position: 'sticky', bottom: 0, zIndex: 2 } : {}}
                >
                    <div
                        style={{
                            fontSize: vars.typography['3'].fontSize,
                            color: vars.colors.textSecondary
                        }}
                    >
                        {`${itemStart}-${itemEnd} of ${totalCount}`}
                    </div>
                    <div style={{ display: 'flex', gap: vars.spacing['4'] }}>
                        <button
                            type="button"
                            onClick={onPrevPageClick}
                            disabled={!canPrevPage}
                            style={{
                                padding: `${vars.spacing['2']} ${vars.spacing['4']}`,
                                backgroundColor: 'transparent',
                                border: `1px solid ${vars.colors.divider}`,
                                borderRadius: vars.borderRadius.sm,
                                cursor: canPrevPage ? 'pointer' : 'not-allowed',
                                opacity: canPrevPage ? 1 : 0.5,
                                color: vars.colors.text
                            }}
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            onClick={onNextPageClick}
                            disabled={!canNextPage}
                            style={{
                                padding: `${vars.spacing['2']} ${vars.spacing['4']}`,
                                backgroundColor: 'transparent',
                                border: `1px solid ${vars.colors.divider}`,
                                borderRadius: vars.borderRadius.sm,
                                cursor: canNextPage ? 'pointer' : 'not-allowed',
                                opacity: canNextPage ? 1 : 0.5,
                                color: vars.colors.text
                            }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
