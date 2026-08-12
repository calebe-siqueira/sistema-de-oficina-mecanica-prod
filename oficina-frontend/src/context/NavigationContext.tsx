import React, { createContext, useState, useCallback, useMemo, ReactNode } from 'react';

export interface NavigationContextType {
  navigate: (newView: string, newParams?: any) => void;
  goBack: () => void;
  currentView: string;
  params: any;
}

export const NavigationContext = createContext<NavigationContextType | null>(null);

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [view, setView] = useState<string>('dashboard');
  const [params, setParams] = useState<any>({});
  const [history, setHistory] = useState<{ view: string; params: any }[]>([]);

  const navigate = useCallback((newView: string, newParams: any = {}) => {
    setHistory(prev => [...prev, { view, params }]);
    setView(newView);
    setParams(newParams);
    window.scrollTo(0, 0);
  }, [view, params]);

  const goBack = useCallback(() => {
    setHistory(prev => {
      const newHistory = [...prev];
      const last = newHistory.pop();
      if (last) {
        setView(last.view);
        setParams(last.params);
        return newHistory;
      }
      return prev;
    });
  }, []);

  const navCtx = useMemo<NavigationContextType>(
    () => ({ navigate, goBack, currentView: view, params }),
    [navigate, goBack, view, params]
  );

  return (
    <NavigationContext.Provider value={navCtx}>
      {children}
    </NavigationContext.Provider>
  );
};