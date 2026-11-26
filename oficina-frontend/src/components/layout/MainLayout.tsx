import React from 'react';
import { BaseLayout, NavItemConfig } from './BaseLayout';
import {
  HouseIcon,
  UsersIcon,
  CarIcon,
  FileTextIcon,
  ClipboardIcon,
  UserSearchIcon,
  ShieldCheckIcon,
  TrashIcon,
} from '../ui/Icons';

const MAIN_NAV_ITEMS: NavItemConfig[] = [
  { name: 'Dashboard', icon: HouseIcon, path: '/dashboard' },
  { name: 'Clientes', icon: UsersIcon, path: '/clientes' },
  { name: 'Veículos', icon: CarIcon, path: '/veiculos' },
  { name: 'Ordens de Serviço', icon: FileTextIcon, path: '/ordens-servico' },
  { name: 'Relatórios', icon: ClipboardIcon, path: '/relatorios' },
  // { name: 'Usuários', icon: UserSearchIcon, path: '/usuarios' },
  // { name: 'Auditoria', icon: ShieldCheckIcon, path: '/auditoria' },
  // { name: 'Lixeira', icon: TrashIcon, path: '/lixeira' },
];

/**
 * Layout principal para a área administrativa e operacional da oficina.
 * Utiliza o BaseLayout, declarando apenas os itens de navegação do perfil.
 */
export const MainLayout: React.FC = () => {
  return (
    <BaseLayout
      navItems={MAIN_NAV_ITEMS}
      homePath="/dashboard"
      defaultUserLabel="Usuário"
    />
  );
};
