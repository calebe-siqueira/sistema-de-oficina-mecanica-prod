import React, { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext, UserFuncao } from '../../context/AuthContext';
import { getDefaultDashboard } from '../../hooks/useRoleRedirect';

interface ProtectedRouteProps {
  allowedRoles?: UserFuncao[]; // Novo parâmetro
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const authContext = useContext(AuthContext);
  const location = useLocation();

  if (!authContext) {
    return null;
  }

  const { isAuthenticated, loading, user } = authContext;

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Carregando...</div>
      </div>
    );
  }

  // 1. Verifica autenticação (O usuário está logado? Se não, redireciona para login)
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Verifica autorização (O usuário tem a role necessária para esta rota?)
  // Se não, redireciona para o dashboard correto (sem deslogar)
  if (allowedRoles && !allowedRoles.includes(user.funcao)) {
    const correctDashboard = getDefaultDashboard(user.funcao);
    return <Navigate to={correctDashboard} replace />;
  }

  return <Outlet />;
};
