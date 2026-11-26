import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

interface NotFoundScreenProps {
  returnPath: string;
}

export const NotFoundScreen: React.FC<NotFoundScreenProps> = ({ returnPath }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-gray-100 p-4">
      <h1 className="text-9xl font-bold text-gray-800">404</h1>
      <h2 className="text-2xl font-semibold text-gray-600 mt-4 text-center">Página não encontrada</h2>
      <p className="text-gray-500 mt-2 text-center mb-8 max-w-md">
        Desculpe, não conseguimos encontrar a página que você está procurando.
      </p>
      <Link to={returnPath}>
        <Button variant="primary">
          Voltar para o início
        </Button>
      </Link>
    </div>
  );
};
