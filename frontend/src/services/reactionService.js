import api from './api';

/**
 * Serviço de Reações (Multi-emoji estilo Discord/Slack)
 * Suporta 8 tipos: like, love, fire, idea, laugh, wow, celebrate, clap
 */

export const reactionAPI = {
  /**
   * Toggle de reação em cápsula ou comentário
   * @param {Object} data - { capsuleId?, commentId?, reactionType }
   * @returns {Promise} - { reacted: boolean, reactionType: string }
   */
  toggleReaction: (data) => api.post('/likes/reaction/toggle', data),

  /**
   * Obter resumo de todas as reações (agrupado por tipo)
   * @param {string} capsuleId - ID da cápsula
   * @returns {Promise} - { summary: { like: {count, users}, ... }, total: number }
   */
  getCapsuleSummary: (capsuleId) => api.get(`/likes/reaction/capsule/${capsuleId}/summary`),

  /**
   * Obter resumo de reações de um comentário
   * @param {string} commentId - ID do comentário
   */
  getCommentSummary: (commentId) => api.get(`/likes/reaction/comment/${commentId}/summary`),

  /**
   * Obter reações do usuário logado para uma cápsula
   * @param {string} capsuleId - ID da cápsula
   * @returns {Promise} - { reactions: ['like', 'fire', ...] }
   */
  getUserCapsuleReactions: (capsuleId) => api.get(`/likes/reaction/capsule/${capsuleId}/user`),

  /**
   * Obter reações do usuário logado para um comentário
   * @param {string} commentId - ID do comentário
   */
  getUserCommentReactions: (commentId) => api.get(`/likes/reaction/comment/${commentId}/user`)
};


export const REACTION_CONFIG = {
  like: { emoji: '👍', label: 'Like', color: '#3b82f6' },
  love: { emoji: '❤️', label: 'Love', color: '#ef4444' },
  fire: { emoji: '🔥', label: 'Fire', color: '#f59e0b' },
  idea: { emoji: '💡', label: 'Idea', color: '#eab308' },
  laugh: { emoji: '😂', label: 'Haha', color: '#10b981' },
  wow: { emoji: '😮', label: 'Wow', color: '#8b5cf6' },
  celebrate: { emoji: '🎉', label: 'Party', color: '#ec4899' },
  clap: { emoji: '👏', label: 'Clap', color: '#06b6d4' }
};