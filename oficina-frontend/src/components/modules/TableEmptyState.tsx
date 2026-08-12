interface TableEmptyStateProps {
  /** A mensagem que será exibida para o usuário */
  message?: string;
  /** Classes adicionais para sobrescrever ou adicionar estilos (opcional) */
  className?: string;
}

export function TableEmptyState({ 
  message = "Nenhum registro encontrado", // Mensagem padrão de fallback
  className = "" 
}: TableEmptyStateProps) {
  return (
    <p className={`px-6 py-4 text-center text-gray-500 ${className}`.trim()}>
      {message}
    </p>
  );
}