import React, { useContext } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { MainLayout } from '../components/layout/MainLayout';
import { ClientLayout } from '../components/layout/ClientLayout';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { AuthContext } from '../context/AuthContext';
import { getDefaultDashboard } from '../hooks/useRoleRedirect';
import Button from '../components/ui/Button';

import { LoginScreen } from '../screens/LoginScreen';
import { NotFoundScreen } from '../screens/NotFoundScreen';
import { ErrorFallbackScreen } from '../screens/ErrorFallbackScreen';

// Telas (funcionalidades oficina)
import DashboardScreen from '../screens/oficina/DashboardScreen';
import ClientsScreen from '../screens/oficina/ClientsScreen';
import ClientFormScreen from '../screens/oficina/ClientFormScreen';
import VehiclesScreen from '../screens/oficina/VehiclesScreen';
import ServiceOrdersScreen from '../screens/oficina/ServiceOrdersScreen';
import ServiceOrderFormScreen from '../screens/oficina/ServiceOrderFormScreen';
import ReportsScreen from '../screens/oficina/ReportsScreen';

// Telas (funcionalidades administrador)
import AuditScreen from '../screens/admin/AuditScreen';
import UsersScreen from '../screens/admin/UsersScreen';
import TrashScreen from '../screens/admin/TrashScreen';

// Telas (funcionalidades cliente)
import DashboardClientScreen from '../screens/cliente/DashboardClientScreen';
import VehiclesClientScreen from '../screens/cliente/VehiclesClientScreen';
import ServiceOrdersClientScreen from '../screens/cliente/ServiceOrdersClientScreen';
import ServiceOrderViewClientScreen from '../screens/cliente/ServiceOrderViewClientScreen';
import MyDataClientScreen from '../screens/cliente/MyDataClientScreen';

/**
 * Componente que redireciona a rota raiz "/" para o dashboard correto
 * com base na role do usuário autenticado.
 */
const RootRedirect: React.FC = () => {
  const authContext = useContext(AuthContext);
  const dashboard = getDefaultDashboard(authContext?.user?.funcao);
  return <Navigate to={dashboard} replace />;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginScreen />,
  },
  {
    path: '/',
    element: <ProtectedRoute />, // Protege todas as rotas filhas
    errorElement: (
      <ErrorFallbackScreen>
        <a href="/login"><Button variant="secondary">Voltar para Login</Button></a>
      </ErrorFallbackScreen>
    ), // Fallback global de segurança
    children: [
      // Redireciona "/" para o dashboard correto de acordo com a role
      { index: true, element: <RootRedirect /> },

      // === MÓDULO CLIENTE ===
      {
        path: 'cliente',
        // Apenas a role 'CLIENTE' entra nessa árvore
        element: <ProtectedRoute allowedRoles={['CLIENTE']} />,
        errorElement: (
          <ErrorFallbackScreen>
            <a href="/cliente/dashboard"><Button variant="secondary">Voltar para o início</Button></a>
          </ErrorFallbackScreen>
        ),
        children: [
          {
            element: <ClientLayout />, // ClientLayout envelopa as views do cliente
            children: [
              { index: true, element: <Navigate to="/cliente/dashboard" replace /> },
              { path: 'dashboard', element: <DashboardClientScreen /> },
              { path: 'veiculos', element: <VehiclesClientScreen /> },
              { path: 'ordens-servico', element: <ServiceOrdersClientScreen /> },
              { path: 'visualizacao-os/:id', element: <ServiceOrderViewClientScreen /> },
              { path: 'meu-cadastro', element: <MyDataClientScreen /> },
            ]
          },
          // 404 Específico do cliente
          {
            path: '*',
            element: <NotFoundScreen returnPath="/cliente/dashboard" />
          }
        ]
      },

      // === MÓDULO OFICINA ===
      {
        // Apenas as roles 'ADMIN' e 'MECÂNICO' entram nessa árvore
        element: <ProtectedRoute allowedRoles={['ADMIN', 'MECANICO']} />,
        errorElement: (
          <ErrorFallbackScreen>
            <a href="/dashboard"><Button variant="secondary">Voltar para o início</Button></a>
          </ErrorFallbackScreen>
        ),
        children: [
          {
            element: <MainLayout />, // MainLayout envelopa as views da oficina
            children: [
              { path: 'dashboard', element: <DashboardScreen /> },
              { path: 'clientes', element: <ClientsScreen /> },
              { path: 'clientes/novo', element: <ClientFormScreen /> },
              { path: 'clientes/:id/editar', element: <ClientFormScreen /> },
              { path: 'veiculos', element: <VehiclesScreen /> },
              { path: 'ordens-servico', element: <ServiceOrdersScreen /> },
              { path: 'ordens-servico/nova', element: <ServiceOrderFormScreen /> },
              { path: 'ordens-servico/:id/editar', element: <ServiceOrderFormScreen /> },
              { path: 'relatorios', element: <ReportsScreen /> },
              { path: 'usuarios', element: <UsersScreen /> },
              { path: 'auditoria', element: <AuditScreen /> },
              { path: 'lixeira', element: <TrashScreen /> },
            ]
          },
          // 404 Específico da oficina
          {
            path: '*',
            element: <NotFoundScreen returnPath="/dashboard" />
          }
        ]
      }
    ],
  },
]);
