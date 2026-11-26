import React from 'react';
import { BaseLayout, NavItemConfig } from './BaseLayout';
import {
  HouseIcon,
  CarIcon,
  FileTextIcon,
  UserCogIcon,
} from '../ui/Icons';

const CLIENT_NAV_ITEMS: NavItemConfig[] = [
  { name: 'Dashboard', icon: HouseIcon, path: '/cliente/dashboard' },
  { name: 'Veículos', icon: CarIcon, path: '/cliente/veiculos' },
  { name: 'Ordens de Serviço', icon: FileTextIcon, path: '/cliente/ordens-servico' },
  { name: 'Meu cadastro', icon: UserCogIcon, path: '/cliente/meu-cadastro' },
];

/**
 * Layout da área restrita do cliente.
 * Utiliza o BaseLayout, declarando apenas os itens de navegação específicos do cliente.
 */
export const ClientLayout: React.FC = () => {
  return (
    <BaseLayout
      navItems={CLIENT_NAV_ITEMS}
      homePath="/cliente/dashboard"
      defaultUserLabel="Cliente"
    />
  );
};
