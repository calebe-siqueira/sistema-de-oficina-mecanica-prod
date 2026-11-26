import React, { useState, useContext, ComponentType, SVGProps } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import Button from '../ui/Button';
import { AuthContext } from '../../context/AuthContext';
import {
  LogOutIcon,
  MenuIcon,
} from '../ui/Icons';

export interface NavItemConfig {
  name: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  path: string;
}

export interface BaseLayoutProps {
  /** Itens da navegação da barra lateral */
  navItems: NavItemConfig[];
  /** Rota principal para onde a logo redireciona */
  homePath: string;
  /** Rótulo exibido caso o nome do usuário não esteja disponível */
  defaultUserLabel?: string;
  /** Função customizada opcional para verificar se um item de menu está ativo */
  isItemActive?: (itemPath: string, currentPath: string) => boolean;
}

/**
 * Layout base reutilizável que encapsula a estrutura visual (Shell),
 * autenticação, topbar móvel, sidebar desktop e drawer móvel acessível com Headless UI v2.
 *
 * Segue os princípios DRY, KISS, SRP e OCP.
 */
export const BaseLayout: React.FC<BaseLayoutProps> = ({
  navItems,
  homePath,
  defaultUserLabel = 'Usuário',
  isItemActive,
}) => {
  const [hamburgerOpen, setHamburgerOpen] = useState(false);

  const authContext = useContext(AuthContext);
  const location = useLocation();

  if (!authContext) {
    return null;
  }

  const { logout, user } = authContext;

  const checkIsActive = (itemPath: string) => {
    if (isItemActive) {
      return isItemActive(itemPath, location.pathname);
    }
    // Correspondência exata da rota ou sub-rota estrita (ex: /clientes e /clientes/novo)
    return (
      location.pathname === itemPath ||
      location.pathname.startsWith(`${itemPath}/`)
    );
  };

  // Lista unificada dos itens de navegação
  const NavLinksList = () => (
    <nav className="flex-1 px-2 py-4 space-y-1">
      {navItems.map((item) => {
        const isActive = checkIsActive(item.path);
        return (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={() => setHamburgerOpen(false)}
            className={`w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none cursor-pointer ${
              isActive
                ? 'bg-gray-700 text-white transition-all duration-30 scale-103'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white'
            }`}
          >
            <item.icon className="mr-3 h-6 w-6 flex-shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );

  // Rodapé unificado com informações do usuário logado
  const UserFooter = () => (
    <div className="p-4 border-t border-gray-700 shrink-0">
      <p className="text-gray-400 text-xs">Logado como:</p>
      <p
        className="text-white font-medium truncate"
        title={user?.nome_usuario || defaultUserLabel}
      >
        {user?.nome_usuario || defaultUserLabel}
      </p>
      {user?.funcao && (
        <p className="text-gray-400 text-xs truncate mt-0.5">{user.funcao}</p>
      )}
      <Button
        variant="ghost"
        className="w-full mt-4 text-gray-300 hover:bg-gray-700 hover:text-white flex items-center justify-center py-2"
        onClick={logout}
      >
        <LogOutIcon className="mr-2 h-5 w-5 flex-shrink-0" /> Sair
      </Button>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* 1. Sidebar Fixa para Desktop (md:flex) */}
      <aside className="hidden md:flex md:flex-col md:w-54 bg-gray-800 h-full border-r border-gray-900 shrink-0">
        <NavLink
          to={homePath}
          className="flex items-center justify-center h-16 bg-gray-900 text-white font-bold text-xl w-full text-center tracking-wide focus:outline-none cursor-pointer"
        >
          Carbulab
        </NavLink>
        <div className="flex flex-col h-[calc(100%-64px)] justify-between">
          <div className="flex-1 overflow-y-auto">
            <NavLinksList />
          </div>
          <UserFooter />
        </div>
      </aside>

      {/* 2. Topbar e Área de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Topbar Fixa (Mobile) */}
        <header className="md:hidden flex justify-between items-center h-16 bg-gray-900 px-3 text-white z-20 shadow-md shrink-0">
          <Button
            variant="ghost"
            title="Abrir menu lateral"
            aria-label="Abrir menu lateral"
            className="hover:bg-gray-800 hover:text-white p-2 rounded-xl transition-colors"
            onClick={() => setHamburgerOpen(true)}
          >
            <MenuIcon className="h-6 w-6" />
          </Button>

          {/* Oculta suavemente ao abrir para evitar duplicação visual com a sidebar */}
          <h1 className={`text-xl font-bold tracking-wide transition-opacity duration-200 ${hamburgerOpen ? 'opacity-0' : 'opacity-100'}`}>
            <NavLink
              to={homePath}
              className="focus:outline-none cursor-pointer text-white"
            >
              Carbulab
            </NavLink>
          </h1>

          <Button
            variant="ghost"
            title="Sair"
            aria-label="Sair do sistema"
            className="hover:bg-gray-800 hover:text-white p-2 rounded-xl transition-colors"
            onClick={logout}
          >
            <LogOutIcon className="h-6 w-6" />
          </Button>
        </header>

        {/* 3. Sidebar Mobile com Headless UI v2 (Dialog) */}
        <Dialog
          open={hamburgerOpen}
          onClose={setHamburgerOpen}
          className="relative z-50 md:hidden"
        >
          {/* Backdrop escurecido com leve desfoque cobrindo a tela */}
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 ease-linear data-[closed]:opacity-0"
          />

          <div className="fixed inset-0 flex">
            <DialogPanel
              transition
              className="relative flex flex-col w-54 max-w-[85vw] bg-gray-800 text-white h-full shadow-2xl transition duration-300 ease-in-out data-[closed]:-translate-x-full"
            >
              {/* Cabeçalho do Drawer: Espelha com precisão de pixel a geometria da topbar (h-16 px-3 bg-gray-900) */}
              <div className="flex items-center h-16 px-3 bg-gray-900 border-b border-gray-700/60 shrink-0 gap-3">
                <Button
                  variant="ghost"
                  title="Fechar menu lateral"
                  aria-label="Fechar menu lateral"
                  className="bg-gray-800 text-white hover:bg-gray-700 hover:text-white p-2 rounded-xl transition-colors"
                  onClick={() => setHamburgerOpen(false)}
                >
                  <MenuIcon className="h-6 w-6" />
                </Button>
                <NavLink
                  to={homePath}
                  onClick={() => setHamburgerOpen(false)}
                  className="text-xl font-bold tracking-wide text-white focus:outline-none cursor-pointer"
                >
                  Carbulab
                </NavLink>
              </div>

              {/* Corpo com scroll da navegação */}
              <div className="flex-1 overflow-y-auto">
                <NavLinksList />
              </div>

              {/* Rodapé do usuário */}
              <UserFooter />
            </DialogPanel>
          </div>
        </Dialog>

        {/* 4. Conteúdo Principal da Página */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-8 focus:outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
