import React from 'react';
import { useAuthContext } from '@asgardeo/auth-react';
import { Typography, Button, Box } from "@mui/material";
import { ReactNode } from 'react';

const ProtectedComponent = ({ children }: { children: ReactNode }) => {
  const { state, signIn, signOut } = useAuthContext();

  if (!state.isAuthenticated) {
    return (
        <Box sx={{ p: 4, backgroundColor: '#f9f9f9' }}>
        <Typography variant="h5" gutterBottom>You must be logged in to access this form.</Typography> {/* used to conceal forms behind auth */}
        <Button onClick={ () => signIn() }>Sign In</Button>
        </Box>
    )
  }

  return children;
};

export default ProtectedComponent;