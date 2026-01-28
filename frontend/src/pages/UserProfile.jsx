import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { 
  communityAPI, 
  favoriteAPI, 
  commentAPI, 
  likeAPI, 
  followAPI, 
  authAPI 
} from '../services/capsuleService';
import PrivacySettings from '../components/PrivacySettings';
import './UserProfile.css';

function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  const [userProfile, setUserProfile] = useState(null);
  const [publicCapsules, setPublicCapsules] = useState([]);
  const [favoriteCapsules, setFavoriteCapsules] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [selectedCapsule, setSelectedCapsule] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user: currentUser, updateUser, refreshUserFromServer } = useAuth();
  
  const [activeTab, setActiveTab] = useState('capsules');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

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

  useEffect(() => {
    loadUserProfile();
  }, [userId, currentUser]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      const isOwnProfile = currentUser && currentUser.id === userId;
      
      if (isOwnProfile) {
        const userData = {
          id: currentUser.id,
          username: currentUser.username || 'Utilizador',
          email: currentUser.email,
          createdAt: currentUser.createdAt || new Date(),
          avatar: currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.id}`,
          bio: currentUser.bio || 'Colecionador de cápsulas temporais'
        };
        
        setUserProfile(userData);
        setAvatarPreview(userData.avatar);
      }
      
      const capsulesRes = await communityAPI.explorePublic({
        creator: userId,
        limit: 100
      });
      
      const capsules = capsulesRes.data.capsules || [];
      setPublicCapsules(capsules);

      if (!isOwnProfile && capsules.length > 0) {
        const creator = capsules[0].User || capsules[0].creator;
        
        const userData = {
          id: userId,
          username: creator?.username || 'Utilizador Anónimo',
          email: creator?.email,
          createdAt: creator?.createdAt,
          avatar: creator?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
          bio: creator?.bio || 'Colecionador de cápsulas temporais'
        };
        
        setUserProfile(userData);
        setAvatarPreview(userData.avatar);
      } else if (!isOwnProfile && capsules.length === 0) {
        const userData = {
          id: userId,
          username: 'Utilizador',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
          bio: 'Colecionador de cápsulas temporais',
          createdAt: new Date()
        };
        
        setUserProfile(userData);
        setAvatarPreview(userData.avatar);
      }

      const stats = {
        totalCapsules: capsules.length,
        unlockedCapsules: capsules.filter(c => c.isUnlocked).length,
        lockedCapsules: capsules.filter(c => !c.isUnlocked).length,
        totalViews: capsules.reduce((sum, c) => sum + (c.viewCount || 0), 0),
        totalLikes: capsules.reduce((sum, c) => sum + (c.likeCount || 0), 0),
        totalComments: capsules.reduce((sum, c) => sum + (c.commentCount || 0), 0),
        memberSince: format(
          new Date(userProfile?.createdAt || currentUser?.createdAt || new Date()), 
          'MMMM yyyy', 
          { locale: pt }
        )
      };
      
      setUserStats(stats);

      try {
        const favRes = await favoriteAPI.listByUser(userId);
        const favs = favRes.data.favorites || [];
        const favoriteCapsulesData = favs.map(fav => ({
          ...fav.capsule,
          isFavorite: true,
          favoritedAt: fav.createdAt
        }));
        setFavoriteCapsules(favoriteCapsulesData);
      } catch (err) {
        console.error('Erro ao carregar favoritos:', err);
      }

      try {
        const followersRes = await followAPI.getFollowers(userId);
        const followersData = followersRes.data.followers || [];
        const formattedFollowers = followersData.map(f => ({
          id: f.follower?.id || f.followerId,
          username: f.follower?.username || 'Utilizador',
          avatar: f.follower?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.followerId}`,
          bio: f.follower?.bio || 'Colecionador de cápsulas',
          followedAt: f.createdAt
        }));
        setFollowers(formattedFollowers);

        if (currentUser) {
          const isUserFollowing = formattedFollowers.some(f => 
            f.id === currentUser.id || f.id === currentUser.userId
          );
          setIsFollowing(!!isUserFollowing);
        }
      } catch (err) {
        console.error('Erro ao carregar seguidores:', err);
      }

      try {
        const followingRes = await followAPI.getFollowing(userId);
        const followingData = followingRes.data.following || [];
        const formattedFollowing = followingData.map(f => ({
          id: f.following?.id || f.followingId,
          username: f.following?.username || 'Utilizador',
          avatar: f.following?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.followingId}`,
          bio: f.following?.bio || 'Colecionador de cápsulas',
          followedAt: f.createdAt
        }));
        setFollowing(formattedFollowing);
      } catch (err) {
        console.error('Erro ao carregar following:', err);
      }

      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      
      const fallbackData = {
        id: userId,
        username: currentUser?.username || 'Utilizador',
        avatar: currentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        bio: currentUser?.bio || 'Colecionador de cápsulas temporais',
        createdAt: currentUser?.createdAt || new Date()
      };
      
      setUserProfile(fallbackData);
      setAvatarPreview(fallbackData.avatar);
      setUserStats({
        totalCapsules: 0,
        unlockedCapsules: 0,
        lockedCapsules: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        memberSince: format(new Date(), 'MMMM yyyy', { locale: pt })
      });

      setLoading(false);
    }
  };

  const toggleFollowUser = async () => {
    if (!currentUser) return navigate('/login');
    try {
      const res = await followAPI.toggle(userId);
      setIsFollowing(res.data.following);
      
      const followersRes = await followAPI.getFollowers(userId);
      const followersData = followersRes.data.followers || [];
      const formattedFollowers = followersData.map(f => ({
        id: f.follower?.id || f.followerId,
        username: f.follower?.username || 'Utilizador',
        avatar: f.follower?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.followerId}`,
        bio: f.follower?.bio || 'Colecionador de cápsulas',
        followedAt: f.createdAt
      }));
      setFollowers(formattedFollowers);
      
      toast.success(res.data.following ? '✅ A seguir!' : '❌ Deixou de seguir');
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Erro ao seguir/deixar de seguir');
    }
  };

  const handleFollowUser = async (targetUserId) => {
    if (!currentUser) return navigate('/login');
    try {
      const res = await followAPI.toggle(targetUserId);
      
      if (res.data.following) {
        const userToAdd = followers.find(f => f.id === targetUserId) || 
                         following.find(f => f.id === targetUserId);
        if (userToAdd) {
          setFollowing(prev => [...prev, userToAdd]);
        }
      } else {
        setFollowing(prev => prev.filter(f => f.id !== targetUserId));
      }
      
      toast.success(res.data.following ? '✅ Agora estás a seguir!' : '❌ Deixaste de seguir');
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Erro ao seguir utilizador');
    }
  };

  const openEditProfile = () => {
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
      if (!file.type.startsWith('image/')) {
        alert('Por favor, seleciona um ficheiro de imagem válido.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter menos de 5MB.');
        return;
      }

      // Ler e comprimir a imagem
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Criar canvas para redimensionar a imagem
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Dimensões máximas: 256x256 para avatar
          const maxSize = 256;
          let width = img.width;
          let height = img.height;
          
          // Manter proporções
          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          // Converter para JPEG comprimido
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          
          // Validar tamanho do base64
          if (compressedBase64.length > 1024 * 1024) {
            // Se ainda for maior que 1MB, usar qualidade menor
            const veryCompressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            setEditAvatar(veryCompressedBase64);
            setAvatarPreview(veryCompressedBase64);
          } else {
            setEditAvatar(compressedBase64);
            setAvatarPreview(compressedBase64);
          }
        };
        img.src = event.target.result;
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
        bio: editBio.trim() 
      };
      
      if (editAvatar && editAvatar.trim()) {
        payload.avatar = editAvatar.trim();
      }
      
      if (editPassword.trim()) {
        if (editPassword.length < 6) {
          alert('A password deve ter no mínimo 6 caracteres.');
          setIsSaving(false);
          return;
        }
        payload.password = editPassword;
      }
      
      if (!editUsername.trim()) {
        alert('O nome de utilizador é obrigatório.');
        setIsSaving(false);
        return;
      }
      
      console.log('📤 Enviando atualização de perfil...', { 
        username: payload.username, 
        bio: payload.bio, 
        avatarSize: payload.avatar ? (payload.avatar.length / 1024).toFixed(2) + 'KB' : 'não' 
      });
      
      const res = await authAPI.updateProfile(payload);
      
      if (res.data && res.data.user) {
        const updatedUser = res.data.user;
        
        const userData = {
          id: currentUser.id,
          email: currentUser.email,
          username: updatedUser.username || editUsername.trim(),
          avatar: updatedUser.avatar || editAvatar.trim(),
          bio: updatedUser.bio || editBio.trim(),
          createdAt: currentUser.createdAt
        };
        
        // 1️⃣ Atualiza o contexto de autenticação PRIMEIRO
        updateUser(userData);
        
        // 2️⃣ Atualiza o perfil local do utilizador
        setUserProfile(userData);
        setAvatarPreview(userData.avatar);
        setAvatarKey(Date.now()); // Força re-render da imagem
        setShowEditProfile(false);
        
        toast.success('✅ Perfil atualizado com sucesso!');
        
        // 3️⃣ Sincroniza com o servidor para trazer dados frescos
        setTimeout(async () => {
          try {
            await refreshUserFromServer();
            console.log('✅ Avatar sincronizado com sucesso após guardar');
          } catch (err) {
            console.error('⚠️ Erro ao sincronizar:', err);
          }
        }, 500);
        
      } else {
        throw new Error('Resposta da API inválida');
      }
      
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error);
      const status = error?.response?.status;
      const message = error?.response?.data?.message || error.message || 'Verifica os dados e tenta novamente.';

      if (status === 401) {
        toast.error('Sessão expirada. Faça login novamente.');
        navigate('/login');
        return;
      }

      if (status === 413) {
        toast.error('Ficheiro de imagem demasiado grande. Tenta uma imagem menor.');
        return;
      }

      toast.error(`Erro: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFavorite = async (capsuleId) => {
    try {
      setPublicCapsules(prev => prev.map(c => 
        c.id === capsuleId ? { ...c, isFavorited: !c.isFavorited } : c
      ));
      
      setFavoriteCapsules(prev => prev.filter(c => c.id !== capsuleId));
      
      const res = await favoriteAPI.toggle(capsuleId);
      const isFavorited = res.data.favorited;
      
      const favRes = await favoriteAPI.listByUser(userId);
      const favs = favRes.data.favorites || [];
      const favoriteCapsulesData = favs.map(fav => ({
        ...fav.capsule,
        isFavorite: true,
        favoritedAt: fav.createdAt
      }));
      setFavoriteCapsules(favoriteCapsulesData);
      
      toast.success(isFavorited ? '⭐ Adicionado aos favoritos!' : '❌ Removido dos favoritos');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Erro ao atualizar favoritos');
    }
  };

  const getFilteredAndSortedCapsules = () => {
    let filtered = [...publicCapsules];

    if (filterType === 'unlocked') {
      filtered = filtered.filter(c => c.isUnlocked);
    } else if (filterType === 'locked') {
      filtered = filtered.filter(c => !c.isUnlocked);
    }

    if (sortBy === 'popular') {
      filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    } else if (sortBy === 'trending') {
      filtered.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
    } else {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return filtered;
  };

  const getAvatarUrl = (avatar) => {
    if (!avatar) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile?.id || currentUser?.id || 'user'}`;
    
    if (avatar.startsWith('data:image')) {
      return avatar;
    }
    
    const separator = avatar.includes('?') ? '&' : '?';
    return `${avatar}${separator}_=${avatarKey}`;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'capsules':
        return (
          <motion.div
            key="capsules"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="controls-section">
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
                Mostrando {getFilteredAndSortedCapsules().length} cápsula{getFilteredAndSortedCapsules().length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="capsules-grid">
              {getFilteredAndSortedCapsules().length > 0 ? (
                getFilteredAndSortedCapsules().map((capsule, index) => (
                  <CapsuleCard 
                    key={capsule.id}
                    capsule={capsule}
                    index={index}
                    onToggleFavorite={toggleFavorite}
                    onView={setSelectedCapsule}
                    isOwner={currentUser && currentUser.id === userId}
                  />
                ))
              ) : (
                <div className="empty-state">
                  <p>Este utilizador ainda não tem cápsulas públicas</p>
                </div>
              )}
            </div>
          </motion.div>
        );

      case 'favorites':
        return (
          <motion.div
            key="favorites"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="favorites-header">
              <h3>⭐ Cápsulas Favoritas</h3>
              <p>{favoriteCapsules.length} cápsula{favoriteCapsules.length !== 1 ? 's' : ''} guardada{favoriteCapsules.length !== 1 ? 's' : ''}</p>
            </div>
            
            <div className="capsules-grid">
              {favoriteCapsules.length > 0 ? (
                favoriteCapsules.map((capsule, index) => (
                  <CapsuleCard 
                    key={capsule.id || index}
                    capsule={capsule}
                    index={index}
                    onToggleFavorite={toggleFavorite}
                    onView={setSelectedCapsule}
                    isOwner={currentUser && currentUser.id === userId}
                    isFavorite={true}
                  />
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">⭐</div>
                  <h4>Ainda não tens favoritos</h4>
                  <p>Guarda cápsulas que gostes para as encontrares facilmente mais tarde!</p>
                </div>
              )}
            </div>
          </motion.div>
        );

      case 'followers':
        return (
          <motion.div
            key="followers"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="followers-header">
              <h3>👥 Seguidores</h3>
              <p>{followers.length} pessoa{followers.length !== 1 ? 's' : ''} segue{followers.length !== 1 ? 'm' : ''} este perfil</p>
            </div>
            
            <div className="users-grid">
              {followers.length > 0 ? (
                followers.map((follower, index) => (
                  <UserCard 
                    key={follower.id || index}
                    user={follower}
                    index={index}
                    currentUserId={currentUser?.id}
                    onFollow={handleFollowUser}
                    isFollowing={following.some(f => f.id === follower.id)}
                    showFollowButton={currentUser && currentUser.id !== follower.id}
                  />
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">👥</div>
                  <h4>Ainda não tens seguidores</h4>
                  <p>Partilha o teu perfil para começares a ganhar seguidores!</p>
                </div>
              )}
            </div>
          </motion.div>
        );

      case 'following':
        return (
          <motion.div
            key="following"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="following-header">
              <h3>➡️ A Seguir</h3>
              <p>A seguir a {following.length} pessoa{following.length !== 1 ? 's' : ''}</p>
            </div>
            
            <div className="users-grid">
              {following.length > 0 ? (
                following.map((followedUser, index) => (
                  <UserCard 
                    key={followedUser.id || index}
                    user={followedUser}
                    index={index}
                    currentUserId={currentUser?.id}
                    onFollow={handleFollowUser}
                    isFollowing={true}
                    showFollowButton={currentUser && currentUser.id !== followedUser.id}
                  />
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">➡️</div>
                  <h4>Ainda não segues ninguém</h4>
                  <p>Começa a seguir outros utilizadores para veres as suas cápsulas!</p>
                </div>
              )}
            </div>
          </motion.div>
        );

      case 'settings':
        return (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <PrivacySettings 
              userId={userId}
              currentUser={currentUser}
              onSettingsChange={() => {
                // Recarrega o perfil após mudanças de privacidade
                loadUserProfile();
              }}
            />
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="user-profile-container loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          A carregar perfil...
        </div>
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

  return (
    <>
      <div className="user-profile-container">
        <button className="dashboard-back-btn" onClick={() => navigate('/dashboard')}>
          ← Voltar para Dashboard
        </button>

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
                  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile.id}`;
                  e.target.src = defaultAvatar;
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
                <div className="meta-item">
                  <span className="meta-label">Seguidores</span>
                  <span className="meta-value">{followers.length}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">A seguir</span>
                  <span className="meta-value">{following.length}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Cápsulas</span>
                  <span className="meta-value">{publicCapsules.length}</span>
                </div>
              </div>
            </div>

            <div className="profile-actions">
              {currentUser && currentUser.id === userProfile.id && (
                <button className="btn-secondary" onClick={openEditProfile}>Editar Perfil</button>
              )}

              {currentUser && currentUser.id !== userProfile.id && (
                <button className={`btn-primary ${isFollowing ? 'following' : ''}`} onClick={toggleFollowUser}>
                  {isFollowing ? '✅ A Seguir' : '➕ Seguir'}
                </button>
              )}
            </div>
          </div>
        </motion.div>

        <div className="profile-tabs">
          <button 
            className={`tab-btn ${activeTab === 'capsules' ? 'active' : ''}`}
            onClick={() => setActiveTab('capsules')}
          >
            📦 Cápsulas
          </button>
          <button 
            className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            ⭐ Favoritos
          </button>
          <button 
            className={`tab-btn ${activeTab === 'followers' ? 'active' : ''}`}
            onClick={() => setActiveTab('followers')}
          >
            👥 Seguidores
          </button>
          <button 
            className={`tab-btn ${activeTab === 'following' ? 'active' : ''}`}
            onClick={() => setActiveTab('following')}
          >
            ➡️ A Seguir
          </button>

          {currentUser && currentUser.id === userProfile?.id && (
            <button 
              className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              🔒 Privacidade
            </button>
          )}
        </div>

        <div className="tab-content-wrapper">
          <AnimatePresence mode="wait">
            {renderTabContent()}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {selectedCapsule && (
            <CapsuleDetailModal 
              capsule={selectedCapsule}
              onClose={() => setSelectedCapsule(null)}
            />
          )}
        </AnimatePresence>

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

// ===== COMPONENTES AUXILIARES =====

function CapsuleCard({ capsule, index, onToggleFavorite, onView, isOwner, isFavorite = false }) {
  if (!capsule) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
      className={`capsule-card ${isFavorite ? 'favorite' : ''}`}
      onClick={() => onView(capsule)}
      style={{ cursor: 'pointer' }}
    >
      <div className="capsule-header">
        <div 
          className="capsule-color"
          style={{ backgroundColor: capsule.color || '#6366f1' }}
        />
        <div className="capsule-title-badge">
          <h3>{capsule.title}</h3>
          <div className="capsule-badges">
            {isFavorite && (
              <span className="favorite-badge" title="Favorito">
                ⭐
              </span>
            )}
            <span className={`status-badge ${capsule.isUnlocked ? 'unlocked' : 'locked'}`}>
              {capsule.isUnlocked ? '🔓' : '🔒'}
            </span>
          </div>
        </div>
      </div>

      <p className="capsule-preview">
        {capsule.content.substring(0, 100)}...
      </p>

      <div className="capsule-meta">
        <span className="meta-item">
          <span className="meta-icon">📅</span>
          {format(new Date(capsule.unlockDate), 'dd MMM', { locale: pt })}
        </span>
        <span className="meta-item">
          <span className="meta-icon">👁️</span>
          {capsule.viewCount || 0}
        </span>
        <span className="meta-item">
          <span className="meta-icon">❤️</span>
          {capsule.likeCount || 0}
        </span>
        {(isOwner || isFavorite) && (
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              onToggleFavorite(capsule.id); 
            }}
            className={`fav-btn ${capsule.isFavorited || capsule.isFavorite ? 'active' : ''}`}
            title={capsule.isFavorited || capsule.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            {capsule.isFavorited || capsule.isFavorite ? '★' : '☆'}
          </button>
        )}
      </div>

      <motion.div 
        className="view-button"
        whileHover={{ x: 5 }}
      >
        Ver Detalhes →
      </motion.div>
    </motion.div>
  );
}

function UserCard({ user, index, currentUserId, onFollow, isFollowing, showFollowButton }) {
  const navigate = useNavigate();
  
  if (!user) return null;
  
  const handleFollowClick = (e) => {
    e.stopPropagation();
    if (onFollow) {
      onFollow(user.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="user-card"
      onClick={() => navigate(`/profile/${user.id}`)}
      style={{ cursor: 'pointer' }}
    >
      <div className="user-card-header">
        <img 
          src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
          alt={user.username}
          className="user-card-avatar"
        />
        {showFollowButton && (
          <button 
            className={`user-follow-btn ${isFollowing ? 'following' : ''}`}
            onClick={handleFollowClick}
          >
            {isFollowing ? 'Seguindo' : 'Seguir'}
          </button>
        )}
      </div>
      
      <div className="user-card-info">
        <h4>{user.username || 'Utilizador'}</h4>
        <p className="user-bio">{user.bio || 'Colecionador de cápsulas'}</p>
        
        {user.followedAt && (
          <div className="followed-since">
            <span className="followed-label">Desde:</span>
            <span className="followed-date">
              {format(new Date(user.followedAt), 'dd/MM/yyyy')}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

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
      } catch (err) {}
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
      toast.success('💬 Comentário adicionado!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Erro ao adicionar comentário');
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
      toast.success(res.data.favorited ? '⭐ Adicionado aos favoritos!' : '❌ Removido dos favoritos');
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

          <div className="modal-body">
            <div className="capsule-content">
              <p>{capsule.content}</p>
            </div>

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
                className={`interaction-btn ${isFavorited ? 'favorited' : ''}`}
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