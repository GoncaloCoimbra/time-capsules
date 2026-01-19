import React, { useState, useEffect, useRef } from 'react';
import { reactionAPI, REACTION_CONFIG } from '../services/reactionService';
import './ReactionPicker.css';

/**
 * ReactionPicker - Sistema de reações multi-emoji (estilo Discord/Slack)
 * @param {string} capsuleId - ID da cápsula (obrigatório se não houver commentId)
 * @param {string} commentId - ID do comentário (opcional)
 * @param {string} variant - 'default' | 'compact' | 'inline'
 */
export default function ReactionPicker({ capsuleId, commentId, variant = 'default' }) {
  const [summary, setSummary] = useState({});
  const [userReactions, setUserReactions] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const pickerRef = useRef(null);

  // Fechar picker ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  // Carregar dados iniciais
  useEffect(() => {
    loadReactionData();
  }, [capsuleId, commentId]);

  const loadReactionData = async () => {
    try {
      setLoading(true);

      // Carregar resumo de reações
      const summaryRes = commentId
        ? await reactionAPI.getCommentSummary(commentId)
        : await reactionAPI.getCapsuleSummary(capsuleId);

      setSummary(summaryRes.data.summary || {});

      // Carregar reações do usuário
      const userRes = commentId
        ? await reactionAPI.getUserCommentReactions(commentId)
        : await reactionAPI.getUserCapsuleReactions(capsuleId);

      setUserReactions(userRes.data.reactions || []);
    } catch (err) {
      console.error('Erro ao carregar reações:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReaction = async (reactionType) => {
    try {
      const data = {
        reactionType,
        ...(capsuleId && { capsuleId }),
        ...(commentId && { commentId })
      };

      await reactionAPI.toggleReaction(data);
      
      // Recarregar dados
      await loadReactionData();
    } catch (err) {
      console.error('Erro ao alternar reação:', err);
      alert('Erro ao reagir. Tenta novamente.');
    }
  };

  // Reações ativas (com pelo menos 1 reação)
  const activeReactions = Object.entries(summary)
    .filter(([_, data]) => data.count > 0)
    .sort((a, b) => b[1].count - a[1].count);

  const totalReactions = activeReactions.reduce((sum, [_, data]) => sum + data.count, 0);

  const containerClass = `reaction-picker-container ${variant}`;

  return (
    <div className={containerClass} ref={pickerRef}>
      {/* Reações ativas (bolhas com contador) */}
      <div className="active-reactions">
        {activeReactions.map(([type, data]) => {
          const config = REACTION_CONFIG[type];
          const isUserReacted = userReactions.includes(type);

          return (
            <button
              key={type}
              className={`reaction-bubble ${isUserReacted ? 'user-reacted' : ''}`}
              onClick={() => handleToggleReaction(type)}
              style={{ color: config.color }}
              title={`${config.label} (${data.count})`}
            >
              <span className="reaction-emoji">{config.emoji}</span>
              <span className="reaction-count">{data.count}</span>
            </button>
          );
        })}
      </div>

      {/* Botão para adicionar nova reação */}
      <button
        className="add-reaction-btn"
        onClick={() => setShowPicker(!showPicker)}
        title="Adicionar reação"
      >
        <span className="add-icon">➕</span>
        {totalReactions > 0 && variant === 'compact' && (
          <span className="total-reactions-badge">{totalReactions}</span>
        )}
      </button>

      {/* Picker flutuante */}
      {showPicker && (
        <div className="reaction-picker-popup">
          <div className="picker-header">
            Escolhe uma reação
          </div>
          <div className="picker-grid">
            {Object.entries(REACTION_CONFIG).map(([type, config]) => {
              const count = summary[type]?.count || 0;
              const isActive = userReactions.includes(type);

              return (
                <button
                  key={type}
                  className={`picker-emoji-btn ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    handleToggleReaction(type);
                    setShowPicker(false);
                  }}
                  disabled={loading}
                  style={{ color: config.color }}
                >
                  <span className="picker-emoji">{config.emoji}</span>
                  {count > 0 && <span className="picker-count">{count}</span>}
                  <span className="picker-label">{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}