import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/confirmDialog.css';

/**
 * Componente de Diálogo de Confirmação
 * 
 * Modal reutilizável para confirmar ações perigosas ou importantes.
 * Suporta três tipos de diálogo: aviso, perigo e informação.
 * 
 * Exemplo de utilização:
 * <ConfirmDialog
 *   isOpen={showConfirm}
 *   title="Eliminar cápsula?"
 *   message="Esta ação não pode ser desfeita."
 *   type="danger"
 *   isDangerous={true}
 *   onConfirm={() => deleteCapsule()}
 *   onCancel={() => setShowConfirm(false)}
 * />
 */
function ConfirmDialog({ 
  isOpen = false,
  title = 'Confirmar ação',
  message = 'Tem a certeza que deseja continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning', // 'warning', 'danger', 'info'
  isDangerous = false,
  onConfirm = () => {},
  onCancel = () => {},
  loading = false
}) {
  // Configuração visual para cada tipo de diálogo
  const typeConfig = {
    warning: { icon: '⚠️', color: '#f59e0b' },
    danger: { icon: '🗑️', color: '#ef4444' },
    info: { icon: 'ℹ️', color: '#3b82f6' }
  };

  // Obtém a configuração apropriada (com fallback para 'warning')
  const config = typeConfig[type] || typeConfig.warning;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Camada de fundo com desfoque para destacar o diálogo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="confirm-backdrop"
            onClick={onCancel}
          />

          {/* Diálogo principal com animação de primavera */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="confirm-dialog"
          >
            {/* Ícone com cor baseada no tipo de diálogo */}
            <div className={`confirm-icon confirm-${type}`}>
              {config.icon}
            </div>

            {/* Títtulo e mensagem do diálogo */}
            <h2 className="confirm-title">{title}</h2>
            <p className="confirm-message">{message}</p>

            {/* Botões de ação */}
            <div className="confirm-buttons">
              <button 
                className="btn-cancel"
                onClick={onCancel}
                disabled={loading}
              >
                {cancelText}
              </button>
              <button 
                className={`btn-confirm btn-confirm-${type}`}
                onClick={onConfirm}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-mini"></span>
                    {confirmText}
                  </>
                ) : (
                  confirmText
                )}
              </button>
            </div>

            {isDangerous && (
              <p className="confirm-warning">
                ⚠️ Esta ação não pode ser desfeita.
              </p>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ConfirmDialog;
