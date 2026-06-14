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

  /** Exibe um alerta visual de erro. */
  errorMessage: (message: string) => {
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
   * Exibe uma mensagem de carregamento, que pode ter seu tipo e mensagem atualizados posteriormente para mostrar seu resultado.
   * @param message Texto da mensagem.
   * @param id ID da mensagem.
   * @param type Tipo da mensagem.
   */
  loadingMessage: (message: string, id: number, type?: 'success' | 'error' | 'warning' | 'info') => {
    if (type !== 'info' && toast.isActive(id)) {
      toast.update(id, {
        render: message, // atualiza mensagem
        isLoading: false,
        autoClose: tempoMensagem(message),
        type: type,
        toastId: id,
      });
    } else {
      toast.info(message, {
        isLoading: true,
        toastId: id,
      });
    }
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
