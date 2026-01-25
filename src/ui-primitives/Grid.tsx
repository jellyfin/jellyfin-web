import React, { type ReactElement, type ReactNode, type CSSProperties } from 'react';
import {
    gridContainer,
    gridGap,
    gridColumns,
    gridXs,
    gridSm,
    gridMd,
    gridLg,
    gridXl,
    gridDisplay,
    gridOrder
} from './Grid.css';

type GridSize = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

interface GridProps {
    readonly children: ReactNode;
    readonly className?: string;
    readonly style?: CSSProperties;
    readonly container?: boolean;
    readonly spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    readonly columns?: GridSize;
    readonly xs?: GridSize | string;
    readonly sm?: GridSize | string;
    readonly md?: GridSize | string;
    readonly lg?: GridSize | string;
    readonly xl?: GridSize | string;
    readonly display?: 'block' | 'flex' | 'grid' | 'none' | 'initial' | string;
    readonly order?: number | 'initial' | 'first' | 'last';
}

function getGridClass(value: GridSize | string | undefined, gridMap: Record<string, string>): string {
    if (value === undefined) return '';
    const key = String(value);
    return Object.prototype.hasOwnProperty.call(gridMap, key) ? gridMap[key] : '';
}

export function Grid({
    children,
    className,
    style: gridStyle,
    container = true,
    spacing = 'md',
    columns,
    xs,
    sm,
    md,
    lg,
    xl,
    display,
    order
}: GridProps): ReactElement {
    const classList: string[] = [];

    if (container !== false) {
        classList.push(gridContainer);
    }

    classList.push(gridGap[spacing]);

    if (columns !== undefined) classList.push(gridColumns[columns]);

    if (xs !== undefined) classList.push(getGridClass(xs, gridXs));
    if (sm !== undefined) classList.push(getGridClass(sm, gridSm));
    if (md !== undefined) classList.push(getGridClass(md, gridMd));
    if (lg !== undefined) classList.push(getGridClass(lg, gridLg));
    if (xl !== undefined) classList.push(getGridClass(xl, gridXl));

    if (display !== undefined && Object.prototype.hasOwnProperty.call(gridDisplay, display)) {
        classList.push(gridDisplay[display as keyof typeof gridDisplay]);
    }

    if (order !== undefined && Object.prototype.hasOwnProperty.call(gridOrder, String(order))) {
        classList.push(gridOrder[String(order) as keyof typeof gridOrder]);
    }

    if (className !== undefined && className !== '') {
        classList.push(className);
    }

    const classes = classList.filter(Boolean).join(' ');

    return (
        <div className={classes} style={gridStyle}>
            {children}
        </div>
    );
}

export { gridContainer, gridGap, gridColumns, gridXs, gridSm, gridMd, gridLg, gridXl, gridDisplay, gridOrder };

