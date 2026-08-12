interface GeneratePdfOptions {
  url: string;
  tabTitle?: string;
  loadingMessage?: string;
}

export const fetchAndOpenPdf = async ({
  url,
  tabTitle = 'Gerando PDF...',
  loadingMessage = 'Carregando seu documento, por favor aguarde...'
}: GeneratePdfOptions): Promise<boolean> => {
  // 1. Abre a aba sincronamente para evitar bloqueio de pop-ups
  const newTab = window.open('', '_blank');
  if (!newTab) {
    throw new Error('O navegador bloqueou a abertura da nova aba. Permita pop-ups para ver o PDF.');
  }

  newTab.document.title = tabTitle;
  newTab.document.body.innerHTML = `<h4>${loadingMessage}</h4>`;

  try {
    // 2. Executa a requisição (os cookies de sessão serão enviados via credentials: 'include')
    const response = await fetch(url, { 
        method: 'GET', 
        credentials: 'include'
    });

    if (!response.ok) {
      const errText = await response.text();
      let errorMsg = `Erro ${response.status}`;
      if (errText) {
        try {
          const errJson = JSON.parse(errText);
          errorMsg = errJson.message || errJson.error || errText;
        } catch {
          errorMsg = errText;
        }
      }
      throw new Error(errorMsg);
    }

    // 4. Manipula o binário e exibe o PDF
    const blob = await response.blob();
    const pdfUrl = URL.createObjectURL(blob);

    newTab.location.href = pdfUrl;
    newTab.focus();

    // 5. Limpa a memória após tempo razoável
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);

    return true;
  } catch (error) {
    // Em caso de erro, fecha a aba vazia gerada
    newTab.close();
    throw error;
  }
};