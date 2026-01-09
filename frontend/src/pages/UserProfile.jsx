import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { capsuleAPI, communityAPI, favoriteAPI, commentAPI, likeAPI, followAPI, notificationAPI, authAPI } from '../services/capsuleService';
import '../styles/userProfile.css';

function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  const [userProfile, setUserProfile] = useState(null);
  const [publicCapsules, setPublicCapsules] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [selectedCapsule, setSelectedCapsule] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const [filterType, setFilterType] = useState('all'); // all, unlocked, locked
  const [sortBy, setSortBy] = useState('recent'); // recent, popular, trending

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      // Buscar cápsulas públicas do usuário
      const capsulesRes = await communityAPI.explorePublic({
        creator: userId,
        limit: 50
      });
      
      const capsules = capsulesRes.data.capsules || [];
      setPublicCapsules(capsules);

      // Construir perfil a partir dos dados
      if (capsules.length > 0) {
        const creator = capsules[0].User;
        setUserProfile({
          id: userId,
          username: creator?.username || 'Usuário Anônimo',
          email: creator?.email,
          createdAt: creator?.createdAt,
          avatar: creator?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
          bio: creator?.bio || 'Colecionador de cápsulas temporais ⏰'
        });

        // Calcular estatísticas
        const stats = {
          totalCapsules: capsules.length,
          unlockedCapsules: capsules.filter(c => c.isUnlocked).length,
          lockedCapsules: capsules.filter(c => !c.isUnlocked).length,
          totalViews: capsules.reduce((sum, c) => sum + (c.viewCount || 0), 0),
          totalLikes: capsules.reduce((sum, c) => sum + (c.likeCount || 0), 0),
          totalComments: capsules.reduce((sum, c) => sum + (c.commentCount || 0), 0),
          memberSince: format(new Date(creator?.createdAt), 'MMMM yyyy', { locale: ptBR })
        };
        setUserStats(stats);
      }

      // check follow status
      if (currentUser) {
        try {
          const followersRes = await followAPI.getFollowers(userId);
          const followers = followersRes.data.followers || [];
          const isFollowing = followers.some(f => f.followerId === currentUser.id || f.followerId === currentUser.userId);
          setIsFollowing(!!isFollowing);
        } catch (err) {
          // ignore
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      setLoading(false);
    }
  };

  const [isFollowing, setIsFollowing] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const toggleFollowUser = async () => {
    if (!currentUser) return navigate('/login');
    try {
      const res = await followAPI.toggle(userId);
      setIsFollowing(res.data.following);
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const openEditProfile = () => {
    setEditUsername(userProfile.username || '');
    setEditAvatar(userProfile.avatar || '');
    setEditBio(userProfile.bio || '');
    setShowEditProfile(true);
  };

  const saveProfileEdits = async () => {
    try {
      const payload = { username: editUsername, avatar: editAvatar, bio: editBio };
      if (editPassword) payload.password = editPassword;
      const res = await authAPI.updateProfile(payload);
      setUserProfile(prev => ({ ...prev, ...res.data.user }));
      setShowEditProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const toggleFavorite = async (id) => {
    try {
      // optimistic UI
      setPublicCapsules(prev => prev.map(c => c.id === id ? { ...c, isFavorited: !c.isFavorited } : c));
      const res = await favoriteAPI.toggle(id);
      const fav = res.data.favorited;
      setPublicCapsules(prev => prev.map(c => c.id === id ? { ...c, isFavorited: fav } : c));
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // revert optimistic
      setPublicCapsules(prev => prev.map(c => c.id === id ? { ...c, isFavorited: !(c.isFavorited) } : c));
    }
  };

  const getFilteredAndSortedCapsules = () => {
    let filtered = [...publicCapsules];

    // Filtrar
    if (filterType === 'unlocked') {
      filtered = filtered.filter(c => c.isUnlocked);
    } else if (filterType === 'locked') {
      filtered = filtered.filter(c => !c.isUnlocked);
    }

    // Ordenar
    if (sortBy === 'popular') {
      filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    } else if (sortBy === 'trending') {
      filtered.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
    } else {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return filtered;
  };

  if (loading) {
    return (
      <div className="user-profile-container loading">
        <div className="loading-spinner">Carregando perfil...</div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="user-profile-container error">
        <div className="error-message">
          <h2>Usuário não encontrado</h2>
          <button onClick={() => navigate('/dashboard')}>Voltar</button>
        </div>
      </div>
    );
  }

  const displayedCapsules = getFilteredAndSortedCapsules();

  return (
    <div className="user-profile-container">
      {/* Cabeçalho do Perfil */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="profile-header"
      >
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Voltar
        </button>

        <div className="profile-card">
          <div className="profile-banner" style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
          }}>
            <img 
              src={userProfile.avatar} 
              alt={userProfile.username}
              className="profile-avatar"
            />
          </div>

          <div className="profile-info">
            <h1>{userProfile.username}</h1>
            <p className="profile-bio">✨ {userProfile.bio}</p>
            
            <div className="profile-meta">
              <div className="meta-item">
                <span className="meta-label">Membro desde</span>
                <span className="meta-value">{userStats?.memberSince}</span>
              </div>
            </div>
          </div>
          <div className="profile-actions">
            {currentUser && currentUser.id === userProfile.id && (
              <button className="btn-secondary" onClick={openEditProfile}>Editar Perfil</button>
            )}

            {currentUser && currentUser.id !== userProfile.id && (
              <button className={`btn-primary ${isFollowing ? 'following' : ''}`} onClick={toggleFollowUser}>
                {isFollowing ? 'Seguindo' : 'Seguir'}
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="profile-stats">
          <motion.div 
            className="stat-card"
            whileHover={{ scale: 1.05 }}
          >
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <span className="stat-number">{userStats?.totalCapsules}</span>
              <span className="stat-label">Cápsulas Públicas</span>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card"
            whileHover={{ scale: 1.05 }}
          >
            <div className="stat-icon">🔓</div>
            <div className="stat-content">
              <span className="stat-number">{userStats?.unlockedCapsules}</span>
              <span className="stat-label">Desbloqueadas</span>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card"
            whileHover={{ scale: 1.05 }}
          >
            <div className="stat-icon">👁️</div>
            <div className="stat-content">
              <span className="stat-number">{userStats?.totalViews}</span>
              <span className="stat-label">Visualizações</span>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card"
            whileHover={{ scale: 1.05 }}
          >
            <div className="stat-icon">❤️</div>
            <div className="stat-content">
              <span className="stat-number">{userStats?.totalLikes}</span>
              <span className="stat-label">Curtidas</span>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card"
            whileHover={{ scale: 1.05 }}
          >
            <div className="stat-icon">💬</div>
            <div className="stat-content">
              <span className="stat-number">{userStats?.totalComments}</span>
              <span className="stat-label">Comentários</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Filtros e Controles */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="controls-section"
      >
        <div className="filter-controls">
          <div className="filter-group">
            <label>Filtrar:</label>
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                Todas
              </button>
              <button 
                className={`filter-btn ${filterType === 'unlocked' ? 'active' : ''}`}
                onClick={() => setFilterType('unlocked')}
              >
                Desbloqueadas
              </button>
              <button 
                className={`filter-btn ${filterType === 'locked' ? 'active' : ''}`}
                onClick={() => setFilterType('locked')}
              >
                Bloqueadas
              </button>
            </div>
          </div>

          <div className="sort-group">
            <label>Ordenar por:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="recent">Recentes</option>
              <option value="popular">Populares</option>
              <option value="trending">Em Tendência</option>
            </select>
          </div>
        </div>

        <div className="results-info">
          Mostrando {displayedCapsules.length} cápsula{displayedCapsules.length !== 1 ? 's' : ''}
        </div>
      </motion.div>

      {/* Grid de Cápsulas */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="capsules-grid"
      >
        <AnimatePresence>
          {displayedCapsules.length > 0 ? (
            displayedCapsules.map((capsule, index) => (
              <motion.div
                key={capsule.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="capsule-card"
                onClick={() => setSelectedCapsule(capsule)}
                style={{ cursor: 'pointer' }}
              >
                <div className="capsule-header">
                  <div 
                    className="capsule-color"
                    style={{ backgroundColor: capsule.color || '#6366f1' }}
                  />
                  <div className="capsule-title-badge">
                    <h3>{capsule.title}</h3>
                    <span className={`status-badge ${capsule.isUnlocked ? 'unlocked' : 'locked'}`}>
                      {capsule.isUnlocked ? '🔓' : '🔒'}
                    </span>
                  </div>
                </div>

                <p className="capsule-preview">
                  {capsule.content.substring(0, 80)}...
                </p>

                <div className="capsule-meta">
                  <span>📅 {format(new Date(capsule.unlockDate), 'dd MMM', { locale: ptBR })}</span>
                  <span>👁️ {capsule.viewCount || 0}</span>
                  <span>❤️ {capsule.likeCount || 0}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(capsule.id); }}
                    className={`fav-btn ${(capsule.isFavorited || capsule.isFavorite) ? 'active' : ''}`}
                  >
                    {(capsule.isFavorited || capsule.isFavorite) ? '★' : '☆'}
                  </button>
                </div>

                <motion.div 
                  className="view-button"
                  whileHover={{ x: 5 }}
                >
                  Ver Detalhes →
                </motion.div>
              </motion.div>
            ))
          ) : (
            <div className="empty-state">
              <p>Este usuário ainda não tem cápsulas públicas</p>
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Modal de Detalhe da Cápsula */}
      <AnimatePresence>
        {selectedCapsule && (
          <CapsuleDetailModal 
            capsule={selectedCapsule}
            onClose={() => setSelectedCapsule(null)}
          />
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfile && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEditProfile(false)}>
            <motion.div className="capsule-modal" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowEditProfile(false)}>✕</button>
              <div className="modal-content">
                <h2>Editar Perfil</h2>
                <div className="form-group">
                  <label>Avatar (URL)</label>
                  <input value={editAvatar} onChange={(e) => setEditAvatar(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Nome de usuário</label>
                  <input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Nova senha (opcional)</label>
                  <input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} />
                </div>
                <div className="form-actions">
                  <button className="chronicle-button" onClick={saveProfileEdits}>Salvar</button>
                  <button className="btn-secondary" onClick={() => setShowEditProfile(false)}>Cancelar</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Componente Modal para detalhe da cápsula
function CapsuleDetailModal({ capsule, onClose }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(capsule.likeCount || 0);
  const [isFavorited, setIsFavorited] = useState(capsule.isFavorited || capsule.isFavorite || false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await commentAPI.getAll(capsule.id);
        setComments(res.data.comments || []);
      } catch (error) {
        console.error('Error loading comments:', error);
      }

      try {
        const likedRes = await likeAPI.isLiked(capsule.id);
        setIsLiked(!!likedRes.data.liked);
        const countRes = await likeAPI.getCount(capsule.id);
        setLikeCount(countRes.data.count || 0);
      } catch (err) {
        // ignore
      }
    };

    load();
  }, [capsule.id]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await commentAPI.add(capsule.id, { content: newComment });
      const saved = res.data.comment;
      setComments(prev => [saved, ...prev]);
      setNewComment('');
      // optionally notify owner handled by backend
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleLike = async () => {
    try {
      await likeAPI.toggle(capsule.id);
      const countRes = await likeAPI.getCount(capsule.id);
      setLikeCount(countRes.data.count || 0);
      const likedRes = await likeAPI.isLiked(capsule.id);
      setIsLiked(!!likedRes.data.liked);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      setIsFavorited(prev => !prev);
      const res = await favoriteAPI.toggle(capsule.id);
      setIsFavorited(res.data.favorited);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setIsFavorited(prev => !prev);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        className="capsule-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-content">
          {/* Cabeçalho */}
          <div className="modal-header">
            <div 
              className="modal-color-bar"
              style={{ backgroundColor: capsule.color || '#6366f1' }}
            />
            <h2>{capsule.title}</h2>
            <p className="modal-date">
              Desbloqueio: {format(new Date(capsule.unlockDate), 'dd MMMM yyyy', { locale: ptBR })}
            </p>
          </div>

          {/* Conteúdo */}
          <div className="modal-body">
            <div className="capsule-content">
              <p>{capsule.content}</p>
            </div>

            {/* Interações */}
            <div className="interaction-bar">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`interaction-btn ${isLiked ? 'liked' : ''}`}
                onClick={handleLike}
              >
                <span className="icon">❤️</span>
                <span className="count">{likeCount}</span>
              </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`interaction-btn ${(isFavorited) ? 'favorited' : ''}`}
                  onClick={handleToggleFavorite}
                >
                  <span className="icon">★</span>
                </motion.button>

              <div className="interaction-separator" />

              <div className="comment-count">
                💬 {comments.length} comentários
              </div>
            </div>
          </div>

          {/* Comentários */}
          <div className="comments-section">
            <h3>Comentários</h3>

            <div className="comment-input">
              <input
                type="text"
                placeholder="Deixe seu comentário..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                className="comment-field"
              />
              <button 
                onClick={handleAddComment}
                className="comment-submit"
              >
                Enviar
              </button>
            </div>

            <div className="comments-list">
              <AnimatePresence>
                {comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="comment-item"
                  >
                    <img 
                      src={comment.avatar} 
                      alt={comment.user}
                      className="comment-avatar"
                    />
                    <div className="comment-content">
                      <div className="comment-header">
                        <strong>{comment.user}</strong>
                        <span className="comment-time">agora</span>
                      </div>
                      <p className="comment-text">{comment.text}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {comments.length === 0 && (
                <p className="no-comments">Nenhum comentário ainda. Seja o primeiro!</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default UserProfile;
