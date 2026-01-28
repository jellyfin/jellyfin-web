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
    className,
    style
}: {
    readonly children: ReactNode;
    readonly className?: string;
    readonly style?: CSSProperties;
}): ReactElement {
    return <thead className={className} style={style}>{children}</thead>;
}

export function TableBody({
    children,
    className,
    style
}: {
    readonly children: ReactNode;
    readonly className?: string;
    readonly style?: CSSProperties;
}): ReactElement {
    return <tbody className={className} style={style}>{children}</tbody>;
}

export function TableRow({
    children,
    className,
    style
}: {
    readonly children: ReactNode;
    readonly className?: string;
    readonly style?: CSSProperties;
}): ReactElement {
    return <tr className={`${tableRow} ${className ?? ''}`} style={style}>{children}</tr>;
}

export function TableHead({
    children,
    className,
    style
}: {
    readonly children: ReactNode;
    readonly className?: string;
    readonly style?: CSSProperties;
}): ReactElement {
    return <th className={`${tableHeader} ${className ?? ''}`} style={style}>{children}</th>;
}

export function TableCell({
    children,
    className,
    style
}: {
    readonly children: ReactNode;
    readonly className?: string;
    readonly style?: CSSProperties;
}): ReactElement {
    return <td className={`${tableCell} ${className ?? ''}`} style={style}>{children}</td>;
}
