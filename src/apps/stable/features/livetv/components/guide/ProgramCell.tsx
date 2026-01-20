import React from 'react';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import { styled } from '@mui/joy/styles';
import globalize from 'lib/globalize';
import escapeHtml from 'escape-html';

const StyledProgramCell = styled('button')(({ theme }) => ({
    position: 'absolute',
    height: '100%',
    padding: theme.spacing(0.5, 1),
    border: '1px solid',
    borderColor: theme.vars.palette.divider,
    backgroundColor: theme.vars.palette.background.surface,
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': {
        backgroundColor: theme.vars.palette.background.level1,
    },
    '&.active': {
        borderLeft: `4px solid ${theme.vars.palette.primary.solidBg}`,
    },
}));

interface ProgramCellProps {
    program: any;
    startPercent: number;
    widthPercent: number;
    onClick?: (program: any) => void;
}

const ProgramCell: React.FC<ProgramCellProps> = ({ program, startPercent, widthPercent, onClick }) => {
    const isLive = program.IsLive;
    const isNew = program.IsSeries && !program.IsRepeat;
    const isHD = program.IsHD;

    return (
        <StyledProgramCell
            className={program.active ? 'active' : ''}
            style={{ left: `${startPercent}%`, width: `${widthPercent}%` }}
            onClick={() => onClick?.(program)}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, overflow: 'hidden' }}>
                <Typography level="body-sm" noWrap sx={{ fontWeight: 'bold' }}>
                    {program.Name}
                </Typography>
                {isLive && (
                    <Box sx={{ bgcolor: 'danger.solidBg', px: 0.5, borderRadius: 'xs' }}>
                        <Typography level="body-xs" sx={{ color: 'white', fontWeight: 'bold' }}>
                            {globalize.translate('Live')}
                        </Typography>
                    </Box>
                )}
                {isNew && (
                    <Box sx={{ bgcolor: 'success.solidBg', px: 0.5, borderRadius: 'xs' }}>
                        <Typography level="body-xs" sx={{ color: 'white', fontWeight: 'bold' }}>
                            {globalize.translate('New')}
                        </Typography>
                    </Box>
                )}
            </Box>
            {program.EpisodeTitle && (
                <Typography level="body-xs" noWrap color="neutral">
                    {program.EpisodeTitle}
                </Typography>
            )}
        </StyledProgramCell>
    );
};

export default ProgramCell;
