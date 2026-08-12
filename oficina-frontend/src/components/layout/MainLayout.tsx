import React, { useState, useContext, useEffect, ReactNode } from 'react';
import Button from '../ui/Button';
import { AuthContext } from '../../context/AuthContext';
import { NavigationContext } from '../../context/NavigationContext';
import {
  LuHouse,
  LuUsers,
  LuCar,
  LuFileText,
  LuClipboard,
  LuLogOut,
  LuMenu
} from '../ui/Icons';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [hamburgerOpen, setHamburgerOpen] = useState(false);

  const authContext = useContext(AuthContext);
  const navContext = useContext(NavigationContext);

  // Efeito global para fechar a sidebar mobile com a tecla ESC
  useEffect(() => {
    if (!hamburgerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHamburgerOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hamburgerOpen]);

  if (!authContext || !navContext) {
    // Trate o contexto adequadamente, se necessário
    // Verificar se o usuário está logado. Se não estiver, solicitar o login
    return null;
  }

  const { logout, user } = authContext;
  const { navigate, currentView, params } = navContext;

  const navItems = [
    { name: 'Dashboard', icon: LuHouse, view: 'dashboard' },
    { name: 'Clientes', icon: LuUsers, view: 'clients' },
    { name: 'Veículos', icon: LuCar, view: 'vehicles' },
    { name: 'Ordens de Serviço', icon: LuFileText, view: 'serviceOrders' },
    { name: 'Relatórios', icon: LuClipboard, view: 'reports' },
    // { name: 'Usuários', icon: LuUsers, view: 'users' },
    // { name: 'Auditoria', icon: LuShieldCheck, view: 'audits' },
    // { name: 'Lixeira', icon: LuTrash2, view: 'trash' },
  ];

  const isViewActive = (itemView: string) => {
    if (itemView === currentView) return true;
    if (itemView === 'clients' && (currentView === 'clientForm' || params?.selectClientForOS)) return true;
    if (itemView === 'serviceOrders' && currentView === 'serviceOrderForm') return true;
    return false;
  };

  // Subcomponente local DRY: Evita duplicar a estrutura interna de navegação e perfil
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = isViewActive(item.view);
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => {
                  navigate(item.view);
                  setHamburgerOpen(false); // Fecha o menu mobile ao navegar
                }}
                className={`w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none cursor-pointer ${
                  isActive 
                    ? 'bg-gray-700 text-white transition-all duration-30 scale-103' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white'
                }`}
              >
                <item.icon className="mr-3 h-6 w-6 flex-shrink-0" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Painel do usuário logado */}
      <div className="p-4 border-t border-gray-700">
        <p className="text-gray-400 text-sm">Logado como:</p>
        <p className="text-white font-medium truncate">{user?.nome_usuario || 'Usuário'}</p>
        {user?.funcao && (
            <p className="text-gray-400 text-xs truncate">{user.funcao}</p>
        )}
        <Button
          variant="ghost"
          className="w-full mt-4 text-gray-300 hover:bg-gray-700 hover:text-white"
          onClick={logout}
        >
          <LuLogOut className="mr-2 h-5 w-5 flex-shrink-0" /> Sair
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      
      {/* Sidebar para telas grandes (desktop) */}
      <aside className="hidden md:flex md:flex-col md:w-54 bg-gray-800 h-full border-r border-gray-900">
        <button
          type="button"
          onClick={() => navigate('dashboard')}
          className="flex items-center justify-center h-16 bg-gray-900 text-white font-bold text-xl w-full text-center tracking-wide focus:outline-none cursor-pointer"
        >
          Carbulab
        </button>
        <SidebarContent />
      </aside>

      {/* Topbar e Sidebar para telas pequenas (mobile) */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Backdrop (escurece o fundo no mobile) */}
        {hamburgerOpen && (
          <div
            onClick={() => setHamburgerOpen(false)}
            className={`md:hidden fixed inset-0 z-40 bg-gradient-to-r from-black/50 via-black/30 to-black/0 transition-opacity duration-300 ease-in-out ${
              !hamburgerOpen 
                ? 'opacity-0 pointer-events-none' 
                : 'opacity-100 pointer-events-auto'
            }`}
            aria-hidden="true"
          />
        )}

        {/* Topbar (mobile) */}
        <header className="md:hidden flex justify-between items-center h-16 bg-gray-900 px-3 text-white z-40 shadow-md">
          <Button
            variant="ghost"
            title="Menu"
            aria-label={hamburgerOpen ? "Fechar menu lateral" : "Abrir menu lateral"}
            className="hover:bg-gray-800 hover:text-white p-2 rounded-xl"
            onClick={() => setHamburgerOpen(!hamburgerOpen)}
          >
            <LuMenu className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold tracking-wide">
            <button 
              type="button" 
              onClick={() => navigate('dashboard')} 
              className="focus:outline-none cursor-pointer"
            >
              Carbulab
            </button>
          </h1>
          <Button
            variant="ghost"
            title="Sair"
            aria-label="Sair do sistema"
            className="hover:bg-gray-800 hover:text-white p-2 rounded-xl"
            onClick={logout}
          >
            <LuLogOut className="h-6 w-6" />
          </Button>
        </header>

        {/* Sidebar (mobile) */}
        <aside
          // inert desativa o foco do teclado e esconde do leitor de tela nativamente quando fechado
          inert={!hamburgerOpen ? true : undefined}
          className="md:hidden flex flex-col w-54 h-[calc(100%-64px)] mt-16 bg-gray-800 absolute left-0 top-0 bottom-0 z-50 duration-300 ease-in-out transition-transform data-[open=false]:-translate-x-full data-[open=true]:translate-x-0"
          data-open={hamburgerOpen}
        >
          <SidebarContent />
        </aside>

        {/* Conteúdo principal da página */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-8 focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
};
