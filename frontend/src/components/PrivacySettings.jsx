/**
 * Componente de Definições de Privacidade
 * 
 * Permite aos utilizadores:
 * - Alternar entre conta pública e privada
 * - Gerir pedidos de seguimento pendentes
 * - Controlar quem pode ver o seu perfil e cápsulas
 * 
 * Integra-se com a página de UserProfile
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { followAPI, authAPI } from '../services/capsuleService';
import '../styles/privacySettings.css';

function PrivacySettings({ userId, currentUser, onSettingsChange }) {
  // Estado da privacidade
  const [isPrivate, setIsPrivate] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [expandedRequest, setExpandedRequest] = useState(null);

  // Carrega definições de privacidade ao montar
  useEffect(() => {
    if (currentUser && currentUser.id === userId) {
      loadPrivacySettings();
    }
  }, [userId, currentUser]);

  /**
   * Carrega configurações de privacidade do utilizador
   * Inclui: estado privado + pedidos de seguimento pendentes
   */
  const loadPrivacySettings = async () => {
    try {
      setLoading(true);
      
      // Obtém estado de privacidade do perfil
      const userRes = await authAPI.getProfile();
      setIsPrivate(userRes.data.user?.isPrivate || false);
      
      // Obtém pedidos de seguimento pendentes
      if (userRes.data.user?.id) {
        const requestsRes = await followAPI.getPendingRequests();
        setPendingRequests(requestsRes.data.requests || []);
      }
    } catch (error) {
      console.error('Erro ao carregar definições de privacidade:', error);
      toast.error('Erro ao carregar definições');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Alterna o estado de privacidade da conta
   * Se privada: requer aprovação para seguimento
   * Se pública: qualquer um pode seguir
   */
  const togglePrivacy = async () => {
    try {
      setSavingPrivacy(true);
      const newPrivacyState = !isPrivate;
      
      // Atualiza no servidor
      const res = await authAPI.updateProfile({
        isPrivate: newPrivacyState
      });
      
      setIsPrivate(newPrivacyState);
      onSettingsChange?.();
      
      const message = newPrivacyState 
        ? '🔒 Conta privada ativada! Novos seguidores precisam de aprovação.'
        : '🔓 Conta pública ativada! Qualquer um pode seguir-te.';
      
      toast.success(message);
    } catch (error) {
      console.error('Erro ao atualizar privacidade:', error);
      toast.error('Erro ao atualizar privacidade');
    } finally {
      setSavingPrivacy(false);
    }
  };

  /**
   * Aprova um pedido de seguimento pendente
   * @param {string} requesterId - ID do utilizador que pediu seguimento
   */
  const approvePendingRequest = async (requesterId) => {
    try {
      await followAPI.approvePendingRequest(requesterId);
      
      // Remove do estado
      setPendingRequests(prev => prev.filter(r => r.id !== requesterId));
      setExpandedRequest(null);
      
      toast.success('✅ Pedido aprovado!');
    } catch (error) {
      console.error('Erro ao aprovar pedido:', error);
      toast.error('Erro ao aprovar pedido');
    }
  };

  /**
   * Rejeita um pedido de seguimento pendente
   * @param {string} requesterId - ID do utilizador que pediu seguimento
   */
  const rejectPendingRequest = async (requesterId) => {
    try {
      await followAPI.rejectPendingRequest(requesterId);
      
      // Remove do estado
      setPendingRequests(prev => prev.filter(r => r.id !== requesterId));
      setExpandedRequest(null);
      
      toast.success('❌ Pedido recusado');
    } catch (error) {
      console.error('Erro ao rejeitar pedido:', error);
      toast.error('Erro ao rejeitar pedido');
    }
  };

  if (loading) {
    return (
      <motion.div 
        className="privacy-settings"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="loading-state">
          <div className="spinner"></div>
          <p>A carregar definições...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="privacy-settings"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* ===== Secção de Controlo de Privacidade ===== */}
      <div className="privacy-section">
        <div className="section-header">
          <h3>🔒 Privacidade da Conta</h3>
          <p>Controla quem pode seguir-te e ver o teu perfil</p>
        </div>

        <div className="privacy-toggle-container">
          <div className="toggle-info">
            <div className="toggle-label">
              <span className="toggle-title">
                {isPrivate ? '🔒 Conta Privada' : '🔓 Conta Pública'}
              </span>
              <span className="toggle-description">
                {isPrivate 
                  ? 'Apenas seguidores aprovados podem ver-te' 
                  : 'Qualquer um pode seguir-te'}
              </span>
            </div>

            <button 
              className={`toggle-switch ${isPrivate ? 'active' : ''}`}
              onClick={togglePrivacy}
              disabled={savingPrivacy}
            >
              <span className="switch-slider"></span>
            </button>
          </div>

          {isPrivate && (
            <motion.div 
              className="privacy-info-box"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <p>✓ Novos seguidores precisam da tua aprovação</p>
              <p>✓ Apenas seguidores aprovados veem as tuas cápsulas</p>
              <p>✓ Recebes notificação de cada pedido</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* ===== Secção de Pedidos Pendentes ===== */}
      {isPrivate && (
        <div className="pending-section">
          <div className="section-header">
            <h3>
              📬 Pedidos Pendentes 
              {pendingRequests.length > 0 && (
                <span className="badge">{pendingRequests.length}</span>
              )}
            </h3>
            <p>Utilizadores à espera de aprovação para seguir-te</p>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="empty-state">
              <p>🎉 Sem pedidos pendentes!</p>
              <p className="empty-description">
                Quando alguém tentar seguir-te, aparecerá aqui
              </p>
            </div>
          ) : (
            <motion.div 
              className="requests-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <AnimatePresence>
                {pendingRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    className={`request-item ${expandedRequest === request.id ? 'expanded' : ''}`}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    {/* Avatar e Informações */}
                    <div className="request-info">
                      <div className="avatar-small">
                        <img 
                          src={request.avatar} 
                          alt={request.username}
                          onError={(e) => {
                            e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.id}`;
                          }}
                        />
                      </div>

                      <div className="requester-details">
                        <h4>{request.username}</h4>
                        <p className="requester-bio">{request.bio || 'Sem biografia'}</p>
                        <p className="request-date">
                          Pediu há {formatRequestDate(request.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <motion.div 
                      className="request-actions"
                      initial={false}
                      animate={{
                        opacity: expandedRequest === request.id ? 1 : 0.7,
                        width: expandedRequest === request.id ? '100%' : 'auto'
                      }}
                    >
                      <button
                        className="action-button expand-btn"
                        onClick={() => setExpandedRequest(
                          expandedRequest === request.id ? null : request.id
                        )}
                      >
                        {expandedRequest === request.id ? '⌄' : '›'}
                      </button>

                      <AnimatePresence>
                        {expandedRequest === request.id && (
                          <motion.div
                            className="action-buttons"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                          >
                            <button
                              className="btn-approve"
                              onClick={() => approvePendingRequest(request.id)}
                            >
                              ✅ Aprovar
                            </button>
                            <button
                              className="btn-reject"
                              onClick={() => rejectPendingRequest(request.id)}
                            >
                              ❌ Rejeitar
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      )}

      {/* ===== Dica de Privacidade ===== */}
      <motion.div 
        className="privacy-tip"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <p>💡 <strong>Dica:</strong> Podes alternar entre privado e público a qualquer momento. Nenhum seguidor será removido automaticamente.</p>
      </motion.div>
    </motion.div>
  );
}

/**
 * Formata a data do pedido de forma legível
 * @param {string} date - Data ISO do pedido
 * @returns {string} Texto formatado (ex: "2 horas")
 */
function formatRequestDate(date) {
  if (!date) return 'há pouco';
  
  const now = new Date();
  const requestDate = new Date(date);
  const diffMs = now - requestDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  
  return requestDate.toLocaleDateString('pt-PT');
}

export default PrivacySettings;
