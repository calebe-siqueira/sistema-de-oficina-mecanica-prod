import React from 'react';
import Button from '../components/ui/Button';
import { FaCarCrash } from 'react-icons/fa';

interface ErrorFallbackScreenProps {
  title?: string;
  message?: string;
  children?: React.ReactNode;
}

export const ErrorFallbackScreen: React.FC<ErrorFallbackScreenProps> = ({
  title = "Ops! O sistema quebrou",
  message = "Desculpe, ocorreu um erro inesperado em nossa aplicação. Tente recarregar a página ou utilizar uma das opções abaixo.",
  children
}) => {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-gray-100 p-4">
      <FaCarCrash className="text-9xl text-gray-800" />
      <h2 className="text-2xl font-semibold text-gray-600 mt-4 text-center">{title}</h2>
      <p className="text-gray-500 mt-2 text-center mb-8 max-w-md">{message}</p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button variant="primary" onClick={handleReload}>
          Recarregar página
        </Button>
        {children}
      </div>
    </div>
  );
};
