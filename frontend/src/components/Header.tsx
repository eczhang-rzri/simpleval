import React from 'react'
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { Link } from "react-router-dom";
import { useAuthContext } from '@asgardeo/auth-react';

export default function Header() {
    const { state, signIn, signOut } = useAuthContext();

    return (
        <AppBar position="fixed" className="header" sx={{backgroundColor:"#144e6b"}} >
            <Toolbar className="toolbar" sx={{ gap: 1}}>
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', textAlign: 'left', gap: 2 }}>
                    <Box>
                        <img src={'/simpleval.png'} alt={'SimpleVAL logo'} width={30} />
                    </Box>
                    <Typography variant="h4">SimpleVAL</Typography>
                </Box>
                <Button component={Link} to="/" color="inherit">
                    Home
                </Button>
                <Button component={Link} to="/teams" color="inherit">
                    Teams
                </Button>
                <Button component={Link} to="/players" color="inherit">
                    Players
                </Button>
                <Button component={Link} to="/matches" color="inherit">
                    Matches
                </Button>
                <Button component={Link} to="/articles" color="inherit">
                    Articles
                </Button>
                {state.isAuthenticated ? (
                    <Button onClick={() => signOut()} color="inherit">
                        Logout
                    </Button>
                ) : (
                    <Button onClick={() => signIn()} color="inherit">
                        Login
                    </Button>
                )}
            </Toolbar>
        </AppBar>
    );
}