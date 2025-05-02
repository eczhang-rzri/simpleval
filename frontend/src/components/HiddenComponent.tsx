import React from 'react';
import { useAuthContext } from '@asgardeo/auth-react';
import { ReactNode } from 'react';

const HiddenComponent = ({ children }: { children: ReactNode }) => {
  const { state, signIn, signOut } = useAuthContext();

  //only return the enclosed child if user is logged in - else hide it completely by returning nothing
  if (state.isAuthenticated) {
    return children;
  }
};

export default HiddenComponent;