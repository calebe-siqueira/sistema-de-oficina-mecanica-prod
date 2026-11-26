import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ChevronLeftIcon, SendIcon, DownloadIcon } from '../../components/ui/Icons';
import Button from '../../components/ui/Button';
import { OsViewer } from '../../components/modules/OsViewer';
import { InlineAlert } from '../../components/ui/InlineAlert';
import { toastify } from '../../components/modules/SystemMessages';

import { fetchMinhaOsPdf } from '../../services/clientAreaService';

// ─── Componente principal ───

const ServiceOrderViewClientScreen: React.FC = () => {
  const { id: cod_os } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Carregamento do PDF ───
  useEffect(() => {
    if (!cod_os) {
      setError('ID da ordem de serviço não informado.');
      setLoading(false);
      return;
    }

    let objectUrl: string | null = null;

    const loadPdf = async () => {
      setLoading(true);
      setError(null);
      try {
        const blob = await fetchMinhaOsPdf(cod_os);
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Ocorreu um erro ao carregar o PDF da ordem de serviço.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    loadPdf();

    // Cleanup: revoga o object URL ao desmontar para liberar memória
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [cod_os]);

  // ─── Ações ───

  /** Compartilha o PDF usando a Web Share API quando disponível */
  const handleShare = async () => {
    if (!pdfUrl) return;

    try {
      if (navigator.share && navigator.canShare) {
        const response = await fetch(pdfUrl);
        const blob = await response.blob();
        const file = new File([blob], `OS_${cod_os}.pdf`, {
          type: 'application/pdf',
        });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Ordem de Serviço ${cod_os}`,
            text: `Confira os detalhes da Ordem de Serviço ${cod_os} na Carbulab.`,
            files: [file],
          });
          return;
        }
      }

      // Se não suportar API de Share ou compartilhamento de arquivos, sugere baixar
      toastify.warningMessage(
        'O compartilhamento direto não é suportado neste dispositivo. Faça o download do arquivo.',
      );
    } catch (err) {
      // Ignorar AbortError (usuário cancelou a ação de compartilhamento)
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Erro ao compartilhar:', err);
      }
    }
  };

  /** Dispara o download do PDF localmente */
  const handleDownload = () => {
    if (!pdfUrl) return;

    const anchor = document.createElement('a');
    anchor.href = pdfUrl;
    anchor.download = `OS_${cod_os}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  // ─── Render ───

  return (
    <div className="flex flex-col min-h-full pb-8">
      {/* Barra superior de ações */}
      <div className="flex justify-between items-center mb-8">
        <Button
          variant="secondary"
          className="flex items-center text-gray-700 bg-gray-200 hover:bg-gray-300 border-none rounded-lg font-medium shadow-sm py-2 px-4"
          onClick={() => navigate(-1)}
        >
          <ChevronLeftIcon className="mr-1 h-5 w-5" />
          Voltar
        </Button>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="p-3 shadow-sm rounded-lg bg-gray-200 hover:bg-gray-300 border-none text-gray-700 disabled:opacity-50"
            aria-label="Compartilhar ordem de serviço"
            onClick={handleShare}
            disabled={!pdfUrl || loading}
          >
            <SendIcon className="h-5 w-5" />
          </Button>

          <Button
            variant="secondary"
            className="p-3 shadow-sm rounded-lg bg-gray-200 hover:bg-gray-300 border-none text-gray-700 disabled:opacity-50"
            aria-label="Baixar ordem de serviço em PDF"
            onClick={handleDownload}
            disabled={!pdfUrl || loading}
          >
            <DownloadIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <InlineAlert message={error} className="bg-red-100 mb-4" />

      {/* Visualizador de PDF */}
      <div className="flex-1 flex flex-col items-center justify-start w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center mt-20 text-gray-500">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-medium">Carregando documento...</p>
          </div>
        ) : pdfUrl && !error ? (
          <OsViewer pdfUrl={pdfUrl} scale={1.0} />
        ) : null}
      </div>
    </div>
  );
};

export default ServiceOrderViewClientScreen;