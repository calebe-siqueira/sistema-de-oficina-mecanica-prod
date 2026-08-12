import { ToastContainer, toast, Bounce } from 'react-toastify';

export const SystemToastContainer = () => {
  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={true}
      closeOnClick={false}
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
      transition={Bounce}
    />
  )
}

export const toastify = {
  /** Exibe um alerta visual de sucesso. */
  successMessage: (message: string) => {
    if (toast.isActive(message)) {
      toast.update(message);
    } else {
      toast.success(message, {
        autoClose: tempoMensagem(message),
        toastId: message,
      });
    }
  },

  /** Exibe um alerta visual de erro e loga os detalhes técnicos no console, se fornecidos. */
  errorMessage: (message: string, errorObj?: unknown) => {
    if (errorObj) {
      console.error(`${message}\n`, errorObj);
    }
    if (toast.isActive(message)) {
      toast.update(message);
    } else {
      toast.error(message, {
        autoClose: tempoMensagem(message),
        toastId: message,
      });
    }
  },

  /** Exibe um alerta visual de atenção. */
  warningMessage: (message: string) => {
    if (toast.isActive(message)) {
      toast.update(message);
    } else {
      toast.warning(message, {
        autoClose: tempoMensagem(message),
        toastId: message,
      });
    }
  },

  /** Exibe um alerta visual de informação. */
  infoMessage: (message: string) => {
    if (toast.isActive(message)) {
      toast.update(message);
    } else {
      toast.info(message, {
        autoClose: tempoMensagem(message),
        toastId: message,
      });
    }
  },

  /**
   * Associa uma Promise a um toast nativo, gerenciando os estados pendente, sucesso e erro.
   * Os detalhes técnicos de erro serão enviados para o console de forma silenciosa.
   */
  promiseMessage: <T,>(
    promise: Promise<T>,
    pendingMessage: string,
    successMessage: string,
    errorMessage: string
  ) => {
    // Intercepta a promise para registrar o erro no console apenas uma vez
    const interceptedPromise = promise.catch((err: unknown) => {
      console.error(`${errorMessage}\n`, err);
      throw err;
    });

    return toast.promise(interceptedPromise, {
      pending: pendingMessage,
      success: {
        render: successMessage,
        autoClose: tempoMensagem(successMessage),
      },
      error: {
        render({ data }: { data: any }) {
          const errDetail = data?.message || 'Erro desconhecido';
          return `${errorMessage}: ${errDetail}`;
        },
        autoClose: tempoMensagem(errorMessage),
      }
    });
  }

};

/**
 * Calcula o tempo de duração do alerta baseado no tamanho do texto.
 * @param message Texto da mensagem.
 * @returns Tempo de duração do alerta.
 */
function tempoMensagem(message: String) {
  var calc = message.length * 40 + 2000
  var time = calc < 4000 ? 4000 : calc > 8000 ? 8000 : calc

  return time
}
