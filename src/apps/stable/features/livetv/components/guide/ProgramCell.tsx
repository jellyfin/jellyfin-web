import React from 'react';
import globalize from 'lib/globalize';
import { Text } from 'ui-primitives';
import * as styles from './ProgramCell.css.ts';

interface ProgramCellProps {
    program: any;
    startPercent: number;
    widthPercent: number;
    onClick?: (program: any) => void;
}

const ProgramCell: React.FC<ProgramCellProps> = ({ program, startPercent, widthPercent, onClick }) => {
    const isLive = program.IsLive;
    const isNew = program.IsSeries && !program.IsRepeat;

    return (
        <button
            type="button"
            className={`${styles.styledProgramCell} ${program.active ? styles.styledProgramCellActive : ''}`}
            style={{ left: `${startPercent}%`, width: `${widthPercent}%` }}
            onClick={() => onClick?.(program)}
        >
            <div className={styles.programHeader}>
                <span className={styles.programName}>{program.Name}</span>
                {isLive && <div className={styles.liveChip}>{globalize.translate('Live')}</div>}
                {isNew && <div className={styles.newChip}>{globalize.translate('New')}</div>}
            </div>
            {program.EpisodeTitle && <div className={styles.programTitle}>{program.EpisodeTitle}</div>}
        </button>
    );
};

export default ProgramCell;
