import format from 'date-fns/format';
import type { MRT_Cell, MRT_RowData } from 'material-react-table';
import { useLocale } from 'hooks/useLocale';

interface CellProps {
    cell: MRT_Cell<MRT_RowData>
}

export default function DateTimeCell({ cell }: CellProps) {
    const { dateFnsLocale } = useLocale();

    return format(cell.getValue<Date>(), 'Pp', { locale: dateFnsLocale });
};
