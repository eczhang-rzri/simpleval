import React from 'react'
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { Link } from "react-router-dom";

export default function Header() {
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
            </Toolbar>
        </AppBar>
    );
}