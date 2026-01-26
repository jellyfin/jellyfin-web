import React, { type ReactElement, type ReactNode, type CSSProperties } from 'react';
import { tableCell, tableContainer, tableHeader, tableRow, tableStyles } from './Table.css';

export { tableCell, tableContainer, tableHeader, tableRow, tableStyles };

interface TableProps {
    readonly children: ReactNode;
    readonly className?: string;
    readonly style?: CSSProperties;
}

export function Table({ children, className, style }: TableProps): ReactElement {
    return (
        <div className={tableContainer} style={style}>
            <table className={`${tableStyles} ${className ?? ''}`}>{children}</table>
        </div>
    );
}

export function TableHeader({
    children,
    className
}: {
    readonly children: ReactNode;
    readonly className?: string;
}): ReactElement {
    return <thead className={className}>{children}</thead>;
}

export function TableBody({
    children,
    className
}: {
    readonly children: ReactNode;
    readonly className?: string;
}): ReactElement {
    return <tbody className={className}>{children}</tbody>;
}

export function TableRow({
    children,
    className
}: {
    readonly children: ReactNode;
    readonly className?: string;
}): ReactElement {
    return <tr className={`${tableRow} ${className ?? ''}`}>{children}</tr>;
}

export function TableHead({
    children,
    className
}: {
    readonly children: ReactNode;
    readonly className?: string;
}): ReactElement {
    return <th className={`${tableHeader} ${className ?? ''}`}>{children}</th>;
}

export function TableCell({
    children,
    className
}: {
    readonly children: ReactNode;
    readonly className?: string;
}): ReactElement {
    return <td className={`${tableCell} ${className ?? ''}`}>{children}</td>;
}
