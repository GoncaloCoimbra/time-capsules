import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale'; // Mudado de ptBR para pt (Portugal)
import { capsuleAPI, communityAPI, favoriteAPI, commentAPI, likeAPI, followAPI, notificationAPI, authAPI } from '../services/capsuleService';
import './UserProfile.css';

function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  const [userProfile, setUserProfile] = useState(null);
  const [publicCapsules, setPublicCapsules] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [selectedCapsule, setSelectedCapsule] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user: currentUser, updateUser } = useAuth();
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  // Estados para edição de perfil
  const [isFollowing, setIsFollowing] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const fileInputRef = useRef(null);
  const [avatarKey, setAvatarKey] = useState(Date.now());

  // Chave para localStorage
  const AVATAR_STORAGE_KEY = `user_avatar_${userId}`;

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  // Função para obter avatar de forma inteligente
  const getStoredAvatar = () => {
    // 1. Primeiro tenta do localStorage
    const storedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);
    if (storedAvatar) return storedAvatar;
    
    // 2. Depois do contexto de autenticação
    if (currentUser && currentUser.id === userId && currentUser.avatar) {
      return currentUser.avatar;
    }
    
    // 3. Se não houver, retorna null para usar o padrão
    return null;
  };

  // Função para guardar avatar no localStorage
  const saveAvatarToStorage = (avatarUrl) => {
    if (avatarUrl) {
      localStorage.setItem(AVATAR_STORAGE_KEY, avatarUrl);
    }
  };

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
        
        // Obter avatar inteligentemente
        const storedAvatar = getStoredAvatar();
        const userAvatar = storedAvatar || 
                         creator?.avatar || 
                         `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
        
        // Se encontrámos um avatar no servidor e não temos no storage, guarda
        if (creator?.avatar && !storedAvatar) {
          saveAvatarToStorage(creator.avatar);
        }
        
        const userData = {
          id: userId,
          username: creator?.username || 'Utilizador Anónimo',
          email: creator?.email,
          createdAt: creator?.createdAt,
          avatar: userAvatar,
          bio: creator?.bio || 'Colecionador de cápsulas temporais'
        };
        
        setUserProfile(userData);
        setAvatarPreview(userAvatar);

        // Calcular estatísticas
        const stats = {
          totalCapsules: capsules.length,
          unlockedCapsules: capsules.filter(c => c.isUnlocked).length,
          lockedCapsules: capsules.filter(c => !c.isUnlocked).length,
          totalViews: capsules.reduce((sum, c) => sum + (c.viewCount || 0), 0),
          totalLikes: capsules.reduce((sum, c) => sum + (c.likeCount || 0), 0),
          totalComments: capsules.reduce((sum, c) => sum + (c.commentCount || 0), 0),
          memberSince: format(new Date(creator?.createdAt), 'MMMM yyyy', { locale: pt })
        };
        
        setUserStats(stats);
      } else {
        // Se o utilizador não tem cápsulas, usar informações básicas
        try {
          const storedAvatar = getStoredAvatar();
          const userAvatar = storedAvatar || 
                           `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
          
          const userData = {
            id: userId,
            username: 'Utilizador',
            avatar: userAvatar,
            bio: 'Colecionador de cápsulas temporais',
            createdAt: new Date()
          };
          
          setUserProfile(userData);
          setAvatarPreview(userAvatar);
          
          setUserStats({
            totalCapsules: 0,
            unlockedCapsules: 0,
            lockedCapsules: 0,
            totalViews: 0,
            totalLikes: 0,
            totalComments: 0,
            memberSince: format(new Date(), 'MMMM yyyy', { locale: pt })
          });
        } catch (error) {
          console.error('Erro ao carregar informações do utilizador:', error);
        }
      }

      // Verificar status de seguir
      if (currentUser) {
        try {
          const followersRes = await followAPI.getFollowers(userId);
          const followers = followersRes.data.followers || [];
          const isFollowing = followers.some(f => f.followerId === currentUser.id || f.followerId === currentUser.userId);
          setIsFollowing(!!isFollowing);
        } catch (err) {
          // ignorar
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      setLoading(false);
    }
  };

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
    // Usar os dados mais recentes do perfil para preencher o formulário
    if (currentUser && currentUser.id === userId) {
      setEditUsername(userProfile?.username || currentUser.username || '');
      setEditAvatar(userProfile?.avatar || currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.id}`);
      setEditBio(userProfile?.bio || currentUser.bio || '');
      setEditPassword('');
      setAvatarPreview(userProfile?.avatar || currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.id}`);
      setShowEditProfile(true);
    }
  };

  const handleAvatarChange = (e) => {
    const value = e.target.value;
    setEditAvatar(value);
    setAvatarPreview(value);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Verificar se o ficheiro é uma imagem
      if (!file.type.startsWith('image/')) {
        alert('Por favor, seleciona um ficheiro de imagem válido.');
        return;
      }

      // Verificar o tamanho do ficheiro (limite de 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter menos de 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setEditAvatar(base64String);
        setAvatarPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateRandomAvatar = () => {
    // Gera uma string aleatória para usar como seed
    const randomSeed = Math.random().toString(36).substring(2, 15);
    // Cria URL da API DiceBear com seed aleatório
    const randomAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`;
    setEditAvatar(randomAvatar);
    setAvatarPreview(randomAvatar);
  };

  const saveProfileEdits = async () => {
    if (!currentUser || currentUser.id !== userId) return;
    
    try {
      setIsSaving(true);
      
      // Preparar payload JSON
      const payload = { 
        username: editUsername.trim(), 
        bio: editBio.trim() 
      };
      
      // Adicionar avatar se existir (pode ser base64 ou URL)
      if (editAvatar && editAvatar.trim()) {
        payload.avatar = editAvatar.trim();
      }
      
      // Adicionar password se fornecida
      if (editPassword.trim()) {
        if (editPassword.length < 6) {
          alert('A password deve ter no mínimo 6 caracteres.');
          setIsSaving(false);
          return;
        }
        payload.password = editPassword;
      }
      
      // Validar campos obrigatórios
      if (!editUsername.trim()) {
        alert('O nome de utilizador é obrigatório.');
        setIsSaving(false);
        return;
      }
      
      // Chamar API de atualização de perfil
      const res = await authAPI.updateProfile(payload);
      
      if (res.data && res.data.user) {
        const updatedUser = res.data.user;
        
        // Determinar o novo avatar
        const newAvatar = updatedUser.avatar || editAvatar;
        
        // 1. Guardar no localStorage
        saveAvatarToStorage(newAvatar);
        
        // 2. Atualizar o estado local
        const updatedProfile = {
          ...userProfile,
          username: updatedUser.username || editUsername.trim(),
          avatar: newAvatar,
          bio: updatedUser.bio || editBio.trim()
        };
        
        setUserProfile(updatedProfile);
        setAvatarPreview(newAvatar);
        
        // 3. Atualizar o contexto de autenticação
        if (updateUser) {
          updateUser({
            ...currentUser,
            username: updatedUser.username || editUsername.trim(),
            avatar: newAvatar,
            bio: updatedUser.bio || editBio.trim()
          });
        }
        
        // 4. Forçar atualização do avatar (cache busting)
        setAvatarKey(Date.now());
        
        // 5. Fechar o modal
        setShowEditProfile(false);
        
        // 6. Mostrar mensagem de sucesso
        alert('Perfil atualizado com sucesso!');
        
      } else {
        throw new Error('Resposta da API inválida');
      }
      
    } catch (error) {
      console.error('Erro completo ao atualizar perfil:', error);
      alert(`Erro ao atualizar perfil: ${error.response?.data?.message || error.message || 'Verifica os dados e tenta novamente.'}`);
    } finally {
      setIsSaving(false);
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

  // Função para gerar URL do avatar com cache busting
  const getAvatarUrl = (avatar) => {
    if (!avatar) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile.id}`;
    
    // Se for base64, retorna direto
    if (avatar.startsWith('data:image')) {
      return avatar;
    }
    
    // Se for URL externa, adiciona timestamp para evitar cache
    const separator = avatar.includes('?') ? '&' : '?';
    return `${avatar}${separator}_=${avatarKey}`;
  };

  if (loading) {
    return (
      <div className="user-profile-container loading">
        <div className="loading-spinner">A carregar perfil...</div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="user-profile-container error">
        <div className="error-message">
          <h2>Utilizador não encontrado</h2>
          <button onClick={() => navigate('/dashboard')}>Voltar para Dashboard</button>
        </div>
      </div>
    );
  }

  const displayedCapsules = getFilteredAndSortedCapsules();

  return (
    <>
      <div className="user-profile-container">
        {/* Botão para voltar ao dashboard */}
        <button className="dashboard-back-btn" onClick={() => navigate('/dashboard')}>
          ← Voltar para Dashboard
        </button>

        {/* Cabeçalho do Perfil */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="profile-header"
        >
          <div className="profile-card">
            <div className="profile-banner" style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
            }}>
              <img 
                key={`avatar-${avatarKey}`}
                src={getAvatarUrl(userProfile.avatar)} 
                alt={userProfile.username}
                className="profile-avatar"
                onError={(e) => {
                  // Se a imagem falhar, usa avatar padrão e atualiza storage
                  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile.id}`;
                  e.target.src = defaultAvatar;
                  
                  // Atualizar estados
                  setUserProfile(prev => ({ 
                    ...prev, 
                    avatar: defaultAvatar 
                  }));
                  setAvatarPreview(defaultAvatar);
                  
                  // Atualizar localStorage
                  saveAvatarToStorage(defaultAvatar);
                }}
              />
            </div>

            <div className="profile-info">
              <h1>{userProfile.username}</h1>
              <p className="profile-bio">{userProfile.bio}</p>
              
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
                  {isFollowing ? 'A Seguir' : 'Seguir'}
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
              <div className="stat-icon"></div>
              <div className="stat-content">
                <span className="stat-number">{userStats?.totalViews}</span>
                <span className="stat-label">Visualizações</span>
              </div>
            </motion.div>

            <motion.div 
              className="stat-card"
              whileHover={{ scale: 1.05 }}
            >
              <div className="stat-icon"></div>
              <div className="stat-content">
                <span className="stat-number">{userStats?.totalLikes}</span>
                <span className="stat-label">Gostos</span>
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
                        {capsule.isUnlocked ? '🔓' : ''}
                      </span>
                    </div>
                  </div>

                  <p className="capsule-preview">
                    {capsule.content.substring(0, 80)}...
                  </p>

                  <div className="capsule-meta">
                    <span>📅 {format(new Date(capsule.unlockDate), 'dd MMM', { locale: pt })}</span>
                    <span> {capsule.viewCount || 0}</span>
                    <span> {capsule.likeCount || 0}</span>
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
                <p>Este utilizador ainda não tem cápsulas públicas</p>
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
            <motion.div 
              className="modal-overlay" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowEditProfile(false)}
            >
              <motion.div 
                className="capsule-modal profile-edit-modal" 
                initial={{ scale: 0.95 }} 
                animate={{ scale: 1 }} 
                exit={{ scale: 0.95 }} 
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h2>Editar Perfil</h2>
                  <button className="modal-close" onClick={() => setShowEditProfile(false)}>✕</button>
                </div>
                
                <div className="modal-content">
                  {/* Seção de Avatar */}
                  <div className="avatar-section">
                    <div className="avatar-preview-container">
                      <div className="avatar-preview">
                        <img 
                          src={avatarPreview} 
                          alt="Preview do Avatar" 
                          className="avatar-image"
                          onError={(e) => {
                            const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.id || 'user'}`;
                            e.target.src = defaultAvatar;
                            setAvatarPreview(defaultAvatar);
                            setEditAvatar(defaultAvatar);
                          }}
                        />
                      </div>
                      <div className="avatar-actions">
                        <button 
                          type="button"
                          className="btn-upload"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          📷 Carregar Foto
                        </button>
                        <button 
                          type="button"
                          className="btn-random"
                          onClick={generateRandomAvatar}
                        >
                          🎲 Avatar Aleatório
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          style={{ display: 'none' }}
                          accept="image/*"
                          onChange={handleFileUpload}
                        />
                      </div>
                    </div>
                    
                    <div className="avatar-url-input">
                      <label>Ou usa uma URL:</label>
                      <input 
                        type="text" 
                        value={editAvatar} 
                        onChange={handleAvatarChange}
                        placeholder="https://exemplo.com/tua-foto.jpg"
                      />
                    </div>
                  </div>

                  {/* Formulário de Informações */}
                  <div className="form-group">
                    <label>Nome de utilizador *</label>
                    <input 
                      type="text" 
                      value={editUsername} 
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="O teu nome de utilizador"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Bio</label>
                    <textarea 
                      value={editBio} 
                      onChange={(e) => setEditBio(e.target.value)}
                      rows="3"
                      maxLength="200"
                      placeholder="Conta um pouco sobre ti..."
                    />
                    <div className="char-count">{editBio.length}/200</div>
                  </div>
                  
                  <div className="form-group">
                    <label>Nova password (opcional)</label>
                    <input 
                      type="password" 
                      value={editPassword} 
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                    />
                    <small>Deixa em branco para manter a password atual</small>
                  </div>
                  
                  <div className="form-actions">
                    <button 
                      className="chronicle-button" 
                      onClick={saveProfileEdits}
                      disabled={isSaving || !editUsername.trim()}
                    >
                      {isSaving ? (
                        <>
                          <span className="spinner"></span>
                          A guardar...
                        </>
                      ) : 'Guardar Alterações'}
                    </button>
                    <button 
                      className="btn-secondary" 
                      onClick={() => setShowEditProfile(false)}
                      disabled={isSaving}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

// Componente Modal para detalhe da cápsula (atualizado para Português de Portugal)
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
        <div className="modal-header">
          <h2>Detalhes da Cápsula</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-content">
          {/* Cabeçalho */}
          <div className="modal-header">
            <div 
              className="modal-color-bar"
              style={{ backgroundColor: capsule.color || '#6366f1' }}
            />
            <h2>{capsule.title}</h2>
            <p className="modal-date">
              Desbloqueio: {format(new Date(capsule.unlockDate), 'dd MMMM yyyy', { locale: pt })}
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
                <span className="icon"></span>
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
                placeholder="Deixa o teu comentário..."
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
                <p className="no-comments">Nenhum comentário ainda. Sê o primeiro!</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default UserProfile;