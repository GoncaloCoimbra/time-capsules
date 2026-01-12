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

// Like API
export const likeAPI = {
  toggle: (capsuleId) => api.post('/likes/toggle', { capsuleId }),
  getCount: (capsuleId) => api.get(`/likes/${capsuleId}/count`),
  isLiked: (capsuleId) => api.get(`/likes/${capsuleId}/check`)
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
  getTrendingTechs: () => api.get('/community/trending')
};

// community voting (placeholder - backend must support)
communityAPI.vote = (capsuleId) => api.post('/community/vote', { capsuleId });

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data)
};

// extend authAPI with profile update
authAPI.updateProfile = (data) => api.patch('/auth/profile', data);

// Follow API
export const followAPI = {
  toggle: (targetId) => api.post('/follow/toggle', { targetId }),
  getFollowing: (userId) => api.get(`/follow/following/${userId}`),
  getFollowers: (userId) => api.get(`/follow/followers/${userId}`)
};

// Notification API
export const notificationAPI = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`)
};

// send email placeholder (backend required)
notificationAPI.sendEmail = (data) => api.post('/notifications/send-email', data);

// schedule reminder placeholder (backend required) - front-end also persists locally
notificationAPI.schedule = (data) => api.post('/notifications/schedule', data);
