import { format } from 'date-fns';
import type { Cell } from '@tanstack/react-table';

import { useLocale } from 'hooks/useLocale';

interface CellProps<T = unknown> {
    cell: Cell<T, unknown>;
}

const DateTimeCell = <T,>({ cell }: CellProps<T>) => {
    const { dateFnsLocale } = useLocale();

    return format(cell.getValue<Date>(), 'Pp', { locale: dateFnsLocale });
};

export default DateTimeCell;
