// React & hooks
import * as React from 'react';
import { useSearchParams } from 'react-router-dom';

// MUI
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Divider from '@mui/material/Divider';

import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';

// Stylesheets
import '../App.css';

const pages = ['Info', 'Interests', 'Ads Collected', 'Classify Ads'];
const pages_url = {'Info': 'info', 'Interests': "interests", "Ads Collected": "ads", "Classify Ads": "classify_ad"};

const ResponsiveAppBar = () => {
    const setSearchParams = useSearchParams()[1];
    const [anchorElNav, setAnchorElNav] = React.useState(null);

    const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
    };

    const handleCloseNavMenu = () => {
    setAnchorElNav(null);
    };

    return (
        <>

            <AppBar position="sticky">
                <Toolbar disableGutters sx={{minHeight: "68.5px", pl: 2}}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{display: { xs: 'none', md: 'flex' }}}>
                    <Avatar variant="rounded" src="/images/logo_128.png" alt="logo"/>
                    <Typography
                        variant="h6"
                        noWrap
                        sx={{
                        mr: 2,
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        letterSpacing: '.3rem',
                        color: 'inherit',
                        textDecoration: 'none',
                        alignItems: 'center'
                        }}
                    >
                        OVERPROFILING
                    </Typography>
                </Stack>

                <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
                    <IconButton
                    size="large"
                    aria-label="account of current user"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    color="inherit"
                    onClick={handleOpenNavMenu}
                    >
                    <MenuIcon />
                    </IconButton>
                    <Menu
                    id="menu-appbar"
                    anchorEl={anchorElNav}
                    open={Boolean(anchorElNav)}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                    }}
                    keepMounted
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                    }}
                    onClose={handleCloseNavMenu}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                    }}
                    >
                    {pages.map((page) => (
                        <MenuItem key={page} onClick={() => {setSearchParams({route: pages_url[page]}); handleCloseNavMenu()}}>
                        <Typography textAlign="center" style={{color: "white"}} >{page}</Typography>
                        </MenuItem>
                    ))}
                    </Menu>
                </Box>
                <Typography
                    variant="h5"
                    noWrap
                    sx={{
                    mr: 2,
                    display: { xs: 'flex', md: 'none' },
                    flexGrow: 1,
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    letterSpacing: '.3rem',
                    color: 'inherit',
                    textDecoration: 'none',
                    }}
                >
                    OVERPROFILING
                </Typography>
                <Box sx={{ flexGrow: 1, mx: 1, display: { xs: 'none', md: 'flex' }}}>
                    <Stack direction="row" spacing={1} divider={<Divider orientation="vertical" flexItem variant="middle"/>}>
                    
                    {pages.map((page) => (
                    <Button
                        key={page}
                        onClick={() => setSearchParams({route: pages_url[page]})}
                        sx={{  color: 'white', display: 'block' }}
                    >
                        {page}
                    </Button>
                    ))}
                    </Stack>
                </Box>

                </Toolbar>
            </AppBar>
        </>
    );
};
export default ResponsiveAppBar;