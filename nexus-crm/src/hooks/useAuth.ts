import { useContext } from 'react';
import { AuthContext } from '../contexts/authCore';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth deve ser utilizado dentro de um <AuthProvider>');
  }
  
  return context;
};
