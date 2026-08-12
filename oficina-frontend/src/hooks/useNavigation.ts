import { useContext } from 'react';
import { NavigationContext, NavigationContextType } from '../context/NavigationContext';

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('O useNavigation deve ser utilizado dentro de um NavigationProvider');
  }
  return context;
};
