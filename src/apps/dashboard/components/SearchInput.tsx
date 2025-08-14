import Search from '@mui/icons-material/Search';
import InputBase, { type InputBaseProps } from '@mui/material/InputBase';
import { alpha, styled } from '@mui/material/styles';
import React, { type FC } from 'react';

const SearchContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    '&:hover': {
        backgroundColor: alpha(theme.palette.common.white, 0.25)
    },
    width: '100%',
    [theme.breakpoints.up('sm')]: {
        width: 'auto'
    }
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: 'inherit',
    flexGrow: 1,
    '& .MuiInputBase-input': {
        padding: theme.spacing(1, 1, 1, 0),
        // vertical padding + font size from searchIcon
        paddingLeft: `calc(1em + ${theme.spacing(4)})`,
        transition: theme.transitions.create('width'),
        width: '100%',
        [theme.breakpoints.up('md')]: {
            width: '20ch'
        }
    }
}));

interface SearchInputProps extends InputBaseProps {
    label?: string;
}

const SearchInput: FC<SearchInputProps> = ({ label, ...props }) => {
    return (
        <SearchContainer>
            <SearchIconWrapper>
                <Search />
            </SearchIconWrapper>
            <StyledInputBase
                placeholder={label}
                inputProps={{
                    'aria-label': label,
                    ...props.inputProps
                }}
                {...props}
            />
        </SearchContainer>
    );
};

export default SearchInput;
