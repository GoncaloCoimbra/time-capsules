import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { capsuleAPI, communityAPI, favoriteAPI, commentAPI, likeAPI, followAPI, notificationAPI, authAPI } from '../services/capsuleService';

function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  const [userProfile, setUserProfile] = useState(null);
  const [publicCapsules, setPublicCapsules] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [selectedCapsule, setSelectedCapsule] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
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
        const userData = {
          id: userId,
          username: creator?.username || 'Usuário Anônimo',
          email: creator?.email,
          createdAt: creator?.createdAt,
          avatar: creator?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
          bio: creator?.bio || 'Colecionador de cápsulas temporais'
        };
        setUserProfile(userData);
        setAvatarPreview(userData.avatar);

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
      } else {
        // Se o usuário não tem cápsulas, buscar informações básicas
        try {
          const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
          const userData = {
            id: userId,
            username: 'Usuário',
            avatar: defaultAvatar,
            bio: 'Colecionador de cápsulas temporais',
            createdAt: new Date()
          };
          setUserProfile(userData);
          setAvatarPreview(defaultAvatar);
          
          setUserStats({
            totalCapsules: 0,
            unlockedCapsules: 0,
            lockedCapsules: 0,
            totalViews: 0,
            totalLikes: 0,
            totalComments: 0,
            memberSince: format(new Date(), 'MMMM yyyy', { locale: ptBR })
          });
        } catch (error) {
          console.error('Erro ao carregar informações do usuário:', error);
        }
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
    // Usar os dados do contexto de autenticação para preencher o formulário
    if (currentUser && currentUser.id === userId) {
      setEditUsername(currentUser.username || '');
      setEditAvatar(currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.id}`);
      setEditBio(currentUser.bio || '');
      setEditPassword('');
      setAvatarPreview(currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.id}`);
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
      // Verificar se o arquivo é uma imagem
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione um arquivo de imagem válido.');
        return;
      }

      // Verificar o tamanho do arquivo (limite de 5MB)
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
    const randomSeed = Math.random().toString(36).substring(2, 15);
    const randomAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`;
    setEditAvatar(randomAvatar);
    setAvatarPreview(randomAvatar);
  };

  const saveProfileEdits = async () => {
    if (!currentUser || currentUser.id !== userId) return;
    
    try {
      setIsSaving(true);
      const payload = { 
        username: editUsername.trim(), 
        avatar: editAvatar.trim(), 
        bio: editBio.trim() 
      };
      
      // Validar campos obrigatórios
      if (!payload.username) {
        alert('O nome de usuário é obrigatório.');
        return;
      }

      if (editPassword.trim()) {
        if (editPassword.length < 6) {
          alert('A senha deve ter no mínimo 6 caracteres.');
          return;
        }
        payload.password = editPassword;
      }
      
      const res = await authAPI.updateProfile(payload);
      
      // Atualizar o estado local
      setUserProfile(prev => ({ 
        ...prev, 
        username: res.data.user.username,
        avatar: res.data.user.avatar,
        bio: res.data.user.bio
      }));
      
      // Atualizar o contexto de autenticação
      const updatedUser = { ...currentUser, ...res.data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Fechar o modal primeiro
      setShowEditProfile(false);
      
      // Mostrar mensagem de sucesso
      alert('Perfil atualizado com sucesso!');
      
      // Recarregar os dados do perfil
      loadUserProfile();
      
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Erro ao atualizar perfil. Verifique os dados e tente novamente.');
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
    <>
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

        {/* Edit Profile Modal - MELHORADO */}
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
                <button className="modal-close" onClick={() => setShowEditProfile(false)}>✕</button>
                <div className="modal-content">
                  <h2>Editar Perfil</h2>
                  
                  {/* Seção de Avatar */}
                  <div className="avatar-section">
                    <div className="avatar-preview-container">
                      <div className="avatar-preview">
                        <img 
                          src={avatarPreview} 
                          alt="Preview do Avatar" 
                          className="avatar-image"
                          onError={(e) => {
                            e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.id || 'user'}`;
                            setAvatarPreview(e.target.src);
                            setEditAvatar(e.target.src);
                          }}
                        />
                      </div>
                      <div className="avatar-actions">
                        <button 
                          type="button"
                          className="btn-upload"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          📷 Upload de Foto
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
                      <label>Ou use uma URL:</label>
                      <input 
                        type="text" 
                        value={editAvatar} 
                        onChange={handleAvatarChange}
                        placeholder="https://exemplo.com/sua-foto.jpg"
                      />
                    </div>
                  </div>

                  {/* Formulário de Informações */}
                  <div className="form-group">
                    <label>Nome de usuário *</label>
                    <input 
                      type="text" 
                      value={editUsername} 
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="Seu nome de usuário"
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
                      placeholder="Conte um pouco sobre você..."
                    />
                    <div className="char-count">{editBio.length}/200</div>
                  </div>
                  
                  <div className="form-group">
                    <label>Nova senha (opcional)</label>
                    <input 
                      type="password" 
                      value={editPassword} 
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                    />
                    <small>Deixe em branco para manter a senha atual</small>
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
                          Salvando...
                        </>
                      ) : 'Salvar Alterações'}
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

      <style>{`
        /* Estilos Gerais */
        .user-profile-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #f1f5f9;
        }
        
        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
        }
        
        .loading-spinner {
          color: #e2b714;
          font-size: 18px;
        }
        
        .error {
          text-align: center;
          padding: 60px 20px;
        }
        
        .error-message h2 {
          color: #ef4444;
          margin-bottom: 20px;
        }
        
        /* Cabeçalho do Perfil */
        .profile-header {
          position: relative;
        }
        
        .back-btn {
          position: absolute;
          top: 0;
          left: 0;
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid #334155;
          color: #94a3b8;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .back-btn:hover {
          border-color: #e2b714;
          color: #e2b714;
        }
        
        .profile-card {
          background: rgba(15, 15, 25, 0.6);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          border: 1px solid rgba(226, 183, 20, 0.15);
          margin-top: 40px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }
        
        .profile-banner {
          height: 200px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .profile-avatar {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          border: 4px solid #e2b714;
          position: absolute;
          bottom: -75px;
          background: #1e293b;
          object-fit: cover;
        }
        
        .profile-info {
          padding: 90px 30px 30px;
          text-align: center;
        }
        
        .profile-info h1 {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 12px 0;
          color: #f1f5f9;
        }
        
        .profile-bio {
          color: #94a3b8;
          font-size: 16px;
          margin: 0 0 20px 0;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .profile-meta {
          display: flex;
          justify-content: center;
          gap: 30px;
          margin-top: 20px;
        }
        
        .meta-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .meta-label {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .meta-value {
          font-size: 14px;
          color: #e2b714;
          font-weight: 600;
        }
        
        .profile-actions {
          padding: 0 30px 30px;
          display: flex;
          justify-content: center;
          gap: 15px;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #e2b714 0%, #1f7a8c 100%);
          border: none;
          border-radius: 12px;
          color: white;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(226, 183, 20, 0.3);
        }
        
        .btn-primary.following {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }
        
        .btn-secondary {
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid #334155;
          border-radius: 12px;
          color: #cbd5e1;
          padding: 12px 24px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .btn-secondary:hover {
          border-color: #475569;
          background: rgba(30, 41, 59, 0.8);
        }
        
        /* Stats Grid */
        .profile-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-top: 30px;
        }
        
        .stat-card {
          background: rgba(30, 41, 59, 0.3);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid rgba(226, 183, 20, 0.1);
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .stat-icon {
          font-size: 32px;
          color: #e2b714;
        }
        
        .stat-content {
          display: flex;
          flex-direction: column;
        }
        
        .stat-number {
          font-family: 'Orbitron', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 4px;
        }
        
        .stat-label {
          font-size: 14px;
          color: #94a3b8;
        }
        
        /* Filtros e Controles */
        .controls-section {
          margin: 40px 0 30px;
          background: rgba(15, 15, 25, 0.6);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid rgba(226, 183, 20, 0.1);
        }
        
        .filter-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }
        
        .filter-group, .sort-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .filter-group label, .sort-group label {
          font-size: 14px;
          color: #cbd5e1;
          font-weight: 500;
        }
        
        .filter-buttons {
          display: flex;
          gap: 8px;
        }
        
        .filter-btn {
          padding: 8px 16px;
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid #334155;
          border-radius: 8px;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
        }
        
        .filter-btn.active {
          background: rgba(226, 183, 20, 0.2);
          border-color: #e2b714;
          color: #e2b714;
        }
        
        .sort-select {
          padding: 8px 16px;
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid #334155;
          border-radius: 8px;
          color: #f1f5f9;
          font-size: 14px;
          cursor: pointer;
        }
        
        .results-info {
          text-align: center;
          margin-top: 20px;
          color: #94a3b8;
          font-size: 14px;
        }
        
        /* Grid de Cápsulas */
        .capsules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        
        .capsule-card {
          background: rgba(30, 41, 59, 0.3);
          border-radius: 16px;
          padding: 20px;
          border: 1px solid rgba(226, 183, 20, 0.1);
          transition: all 0.3s ease;
        }
        
        .capsule-card:hover {
          transform: translateY(-4px);
          border-color: rgba(226, 183, 20, 0.3);
          box-shadow: 0 10px 30px rgba(226, 183, 20, 0.1);
        }
        
        .capsule-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .capsule-color {
          width: 40px;
          height: 40px;
          border-radius: 8px;
        }
        
        .capsule-title-badge {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .capsule-title-badge h3 {
          margin: 0;
          font-size: 16px;
          color: #f1f5f9;
        }
        
        .status-badge {
          font-size: 20px;
        }
        
        .status-badge.unlocked {
          color: #34d399;
        }
        
        .status-badge.locked {
          color: #f59e0b;
        }
        
        .capsule-preview {
          font-size: 14px;
          color: #cbd5e1;
          line-height: 1.6;
          margin-bottom: 16px;
        }
        
        .capsule-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #94a3b8;
          font-size: 12px;
        }
        
        .fav-btn {
          background: none;
          border: none;
          font-size: 20px;
          color: #475569;
          cursor: pointer;
          padding: 4px;
          transition: all 0.2s ease;
        }
        
        .fav-btn.active {
          color: #f59e0b;
        }
        
        .view-button {
          margin-top: 16px;
          padding: 8px 16px;
          background: rgba(226, 183, 20, 0.1);
          border-radius: 8px;
          color: #e2b714;
          font-size: 14px;
          text-align: center;
        }
        
        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 20px;
          color: #94a3b8;
          font-size: 16px;
        }
        
        /* Modals */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        
        .capsule-modal {
          background: rgba(15, 15, 25, 0.9);
          border-radius: 20px;
          border: 1px solid rgba(226, 183, 20, 0.2);
          max-width: 90%;
          max-height: 90%;
          overflow: auto;
          position: relative;
        }
        
        .modal-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid #334155;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 20px;
          color: #94a3b8;
          transition: all 0.2s ease;
          z-index: 1001;
        }
        
        .modal-close:hover {
          color: #e2b714;
          border-color: #e2b714;
        }
        
        .modal-content {
          padding: 40px;
          color: #f1f5f9;
        }
        
        /* Modal de Edição de Perfil */
        .profile-edit-modal {
          max-width: 500px;
          width: 90%;
        }
        
        .profile-edit-modal .modal-content {
          padding: 30px;
        }
        
        /* Seção de Avatar */
        .avatar-section {
          margin-bottom: 25px;
        }
        
        .avatar-preview-container {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 15px;
        }
        
        .avatar-preview {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          overflow: hidden;
          border: 3px solid #e2b714;
          background: #f1f5f9;
          flex-shrink: 0;
        }
        
        .avatar-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .avatar-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }
        
        .btn-upload, .btn-random {
          padding: 10px 15px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .btn-upload {
          background: #3b82f6;
          color: white;
        }
        
        .btn-upload:hover {
          background: #2563eb;
        }
        
        .btn-random {
          background: #8b5cf6;
          color: white;
        }
        
        .btn-random:hover {
          background: #7c3aed;
        }
        
        .avatar-url-input {
          margin-top: 15px;
        }
        
        .avatar-url-input label {
          display: block;
          margin-bottom: 8px;
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
        }
        
        .avatar-url-input input {
          width: 100%;
          padding: 10px 15px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.3s ease;
          background: white;
          color: #1e293b;
        }
        
        .avatar-url-input input:focus {
          outline: none;
          border-color: #e2b714;
        }
        
        /* Formulário */
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #cbd5e1;
          font-weight: 500;
          font-size: 14px;
        }
        
        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 12px 15px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.3s ease;
          background: white;
          color: #1e293b;
        }
        
        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #e2b714;
          box-shadow: 0 0 0 3px rgba(226, 183, 20, 0.1);
        }
        
        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }
        
        .form-group small {
          display: block;
          margin-top: 5px;
          color: #64748b;
          font-size: 12px;
        }
        
        .char-count {
          text-align: right;
          margin-top: 5px;
          color: #64748b;
          font-size: 12px;
        }
        
        /* Ações do Formulário */
        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 30px;
        }
        
        .chronicle-button {
          flex: 1;
          padding: 12px 20px;
          background: linear-gradient(135deg, #e2b714 0%, #1f7a8c 100%);
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .chronicle-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(226, 183, 20, 0.3);
        }
        
        .chronicle-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .btn-secondary {
          flex: 1;
          padding: 12px 20px;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          color: #475569;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .btn-secondary:hover:not(:disabled) {
          background: #e2e8f0;
        }
        
        .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        /* Spinner */
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* Responsividade */
        @media (max-width: 768px) {
          .profile-avatar {
            width: 120px;
            height: 120px;
            bottom: -60px;
          }
          
          .profile-info {
            padding: 70px 20px 20px;
          }
          
          .profile-info h1 {
            font-size: 24px;
          }
          
          .profile-stats {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .filter-controls {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .filter-group, .sort-group {
            width: 100%;
          }
          
          .filter-buttons {
            flex-wrap: wrap;
          }
          
          .capsules-grid {
            grid-template-columns: 1fr;
          }
          
          .avatar-preview-container {
            flex-direction: column;
            text-align: center;
          }
          
          .avatar-actions {
            width: 100%;
          }
          
          .form-actions {
            flex-direction: column;
          }
        }
        
        @media (max-width: 480px) {
          .profile-stats {
            grid-template-columns: 1fr;
          }
          
          .profile-meta {
            flex-direction: column;
            gap: 15px;
          }
        }
      `}</style>
    </>
  );
}

// Componente Modal para detalhe da cápsula (mantido igual)
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