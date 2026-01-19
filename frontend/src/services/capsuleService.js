import api from './api';

// Capsule API
export const capsuleAPI = {
  create: (data) => api.post('/capsules', data),
  getAll: (params) => api.get('/capsules', { params }),
  getById: (id) => api.get(`/capsules/${id}`),
  update: (id, data) => api.put(`/capsules/${id}`, data),
  delete: (id) => api.delete(`/capsules/${id}`),
  toggleFavorite: (id) => api.patch(`/capsules/${id}/favorite`),
  getStatistics: () => api.get('/capsules/statistics'),
  exportData: () => api.get('/capsules/export')
};

// Category API
export const categoryAPI = {
  create: (data) => api.post('/categories', data),
  getAll: () => api.get('/categories'),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`)
};

// Tag API
export const tagAPI = {
  create: (data) => api.post('/tags', data),
  getAll: () => api.get('/tags'),
  delete: (id) => api.delete(`/tags/${id}`)
};

// Template API
export const templateAPI = {
  getAll: (params) => api.get('/templates', { params }),
  create: (data) => api.post('/templates', data),
  delete: (id) => api.delete(`/templates/${id}`)
};

// Comment API
export const commentAPI = {
  add: (capsuleId, data) => api.post(`/comments/${capsuleId}`, data),
  getAll: (capsuleId) => api.get(`/comments/${capsuleId}`),
  delete: (id) => api.delete(`/comments/${id}`)
};

// ========================================
// LIKE API (Sistema Antigo - Compatibilidade)
// ========================================
export const likeAPI = {
  toggle: (capsuleId) => api.post('/likes/toggle', { capsuleId }),
  getCount: (capsuleId) => api.get(`/likes/${capsuleId}/count`),
  isLiked: (capsuleId) => api.get(`/likes/${capsuleId}/check`)
};

// ========================================
// REACTION API (Sistema Novo - Multi-emoji)
// ========================================
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

/**
 * Configuração de emojis disponíveis
 */
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

// Favorite API (per-user favorites)
export const favoriteAPI = {
  toggle: (capsuleId) => api.post('/favorites/toggle', { capsuleId }),
  listByUser: (userId) => api.get(`/favorites/user/${userId}`)
};

// Community API
export const communityAPI = {
  explorePublic: (params) => api.get('/community/explore/public', { params }),
  getStats: () => api.get('/community/stats'),
  getLeaderboard: (params) => api.get('/community/leaderboard', { params }),
  trackView: (capsuleId) => api.post('/community/track-view', { capsuleId }),
  getTrendingTechs: () => api.get('/community/trending'),
  vote: (capsuleId) => api.post('/community/vote', { capsuleId })
};

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  updateProfile: (data) => api.patch('/auth/profile', data)
};

// Follow API
export const followAPI = {
  toggle: (targetId) => api.post('/follow/toggle', { targetId }),
  getFollowing: (userId) => api.get(`/follow/following/${userId}`),
  getFollowers: (userId) => api.get(`/follow/followers/${userId}`)
};

// Notification API
export const notificationAPI = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  sendEmail: (data) => api.post('/notifications/send-email', data),
  schedule: (data) => api.post('/notifications/schedule', data)
};