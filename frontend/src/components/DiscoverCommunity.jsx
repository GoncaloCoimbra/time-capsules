import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { communityAPI } from '../services/capsuleService';
import '../styles/discoverCommunity.css';

function DiscoverCommunity() {
  const navigate = useNavigate();
  const [explorers, setExplorers] = useState([]);
  const [filteredExplorers, setFilteredExplorers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [loading, setLoading] = useState(true);
  const [trendingCapsules, setTrendingCapsules] = useState([]);

  useEffect(() => {
    loadCommunity();
    loadTrending();
  }, []);

  const loadTrending = async () => {
    try {
      // Buscar as cápsulas mais vistas (top trending) via explorePublic
      const res = await communityAPI.explorePublic({ sort: 'trending', limit: 20 });
      const capsules = res.data?.capsules || [];
      console.log('Trending API response:', res.data);
      setTrendingCapsules(capsules);

      // If nothing found, fetch recent public capsules as a fallback
      if (!capsules || capsules.length === 0) {
        console.log('Nenhuma cápsula trending pública/desbloqueada encontrada, buscando últimas públicas como fallback');
        const fallback = await communityAPI.explorePublic({ sort: 'recent', limit: 10 });
        setTrendingCapsules(fallback.data?.capsules || []);
      }
    } catch (err) {
      console.error('Erro ao carregar trending:', err);
    }
  };

  useEffect(() => {
    filterAndSort();
  }, [explorers, searchTerm, sortBy]);

  const loadCommunity = async () => {
    try {
      setLoading(true);
      const res = await communityAPI.explorePublic({
        limit: 100
      });
      
      // Agrupar cápsulas por usuário - CORRIGIDO para usar 'creator' ao invés de 'User'
      const userMap = {};
      (res.data.capsules || []).forEach(capsule => {
        // CORREÇÃO: usar creatorId ao invés de userId
        const userId = capsule.creatorId || capsule.creator?.id;
        if (!userId) return;
        
        if (!userMap[userId]) {
          userMap[userId] = {
            userId,
            // CORREÇÃO: usar creator ao invés de User
            username: capsule.creator?.username || capsule.metadata?.author || 'Usuário Anônimo',
            avatar: capsule.creator?.avatar || capsule.metadata?.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
            bio: capsule.creator?.bio || 'Colecionador de cápsulas temporais',
            capsules: []
          };
        }
        userMap[userId].capsules.push(capsule);
      });

      const explorersList = Object.values(userMap);
      console.log('Exploradores carregados:', explorersList);
      setExplorers(explorersList);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar comunidade:', error);
      setLoading(false);
    }
  };

  const handleVote = async (capsuleId) => {
    // optimistic UI: increase local count
    setTrendingCapsules(prev => prev.map(c => c.id === capsuleId ? { ...c, votes: (c.votes || 0) + 1, _optimistic: true } : c));
    try {
      const res = await communityAPI.vote(capsuleId);
      const votes = res.data?.votes ?? null;
      const voted = typeof res.data?.voted === 'boolean' ? res.data.voted : true;
      if (votes !== null) {
        setTrendingCapsules(prev => prev.map(c => c.id === capsuleId ? { ...c, votes, voted, _optimistic: false } : c));
      } else {
        setTrendingCapsules(prev => prev.map(c => c.id === capsuleId ? { ...c, _optimistic: false } : c));
      }
    } catch (err) {
      console.error('Erro ao votar:', err);
      // revert optimistic
      setTrendingCapsules(prev => prev.map(c => c.id === capsuleId ? { ...c, votes: Math.max((c.votes || 1) - 1, 0), _optimistic: false } : c));
    }
  };

  const filterAndSort = () => {
    let filtered = [...explorers];

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(explorer =>
        explorer.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        explorer.bio.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar
    if (sortBy === 'popular') {
      filtered.sort((a, b) => b.capsules.length - a.capsules.length);
    } else if (sortBy === 'trending') {
      filtered.sort((a, b) => {
        const aViews = a.capsules.reduce((sum, c) => sum + (c.viewCount || 0), 0);
        const bViews = b.capsules.reduce((sum, c) => sum + (c.viewCount || 0), 0);
        return bViews - aViews;
      });
    } else {
      filtered.sort((a, b) => {
        const aDate = a.capsules[0]?.createdAt ? new Date(a.capsules[0].createdAt) : new Date(0);
        const bDate = b.capsules[0]?.createdAt ? new Date(b.capsules[0].createdAt) : new Date(0);
        return bDate - aDate;
      });
    }

    setFilteredExplorers(filtered);
  };

  return (
    <div className="discover-community">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="discover-header"
      >
        <div className="header-content">
          <h2>🌍 Explore a Comunidade</h2>
          <p>Descubra cápsulas temporais de outros usuários e conecte-se com exploradores do tempo</p>
        </div>

        <div className="discover-controls">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="chronicle-button" onClick={loadCommunity}>🔄 Atualizar</button>
            
          </div>
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Procure por usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

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
      </motion.div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Carregando exploradores do tempo...</p>
        </div>
      ) : filteredExplorers.length > 0 ? (
        <>
    

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="explorers-grid"
        >
          <AnimatePresence>
            {filteredExplorers.map((explorer, index) => (
              <motion.div
                key={explorer.userId}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="explorer-card"
              >
                <div className="explorer-header-bg" />

                <div className="explorer-avatar-container">
                  <img
                    src={explorer.avatar}
                    alt={explorer.username}
                    className="explorer-avatar"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${explorer.userId}`;
                    }}
                  />
                  <div className="activity-indicator" />
                </div>

                <div className="explorer-info">
                  <h3>{explorer.username}</h3>
                  <p className="explorer-bio">{explorer.bio}</p>

                  <div className="explorer-stats">
                    <div className="stat">
                      <span className="stat-number">{explorer.capsules.length}</span>
                      <span className="stat-label">Cápsulas</span>
                    </div>
                    <div className="stat">
                      <span className="stat-number">
                        {explorer.capsules.reduce((sum, c) => sum + (c.viewCount || 0), 0)}
                      </span>
                      <span className="stat-label">Views</span>
                    </div>
                    <div className="stat">
                      <span className="stat-number">
                        {explorer.capsules.filter(c => c.isUnlocked).length}
                      </span>
                      <span className="stat-label">Abertas</span>
                    </div>
                  </div>

                  <div className="recent-capsules">
                    <p className="recent-label">Cápsulas Recentes:</p>
                    <div className="capsule-previews">
                      {explorer.capsules.slice(0, 3).map((capsule) => (
                        <motion.div
                          key={capsule.id}
                          className="preview-badge"
                          title={capsule.title}
                          whileHover={{ scale: 1.1 }}
                        >
                          <span className="badge-status">
                            {capsule.isUnlocked ? '🔓' : '🔒'}
                          </span>
                        </motion.div>
                      ))}
                      {explorer.capsules.length > 3 && (
                        <div className="preview-more">
                          +{explorer.capsules.length - 3}
                        </div>
                      )}
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="view-profile-btn"
                    onClick={() => navigate(`/profile/${explorer.userId}`)}
                  >
                    Ver Perfil →
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        </>
      ) : (
        <div className="empty-state">
          <p>🔍 Nenhum explorador encontrado</p>
          <p className="empty-subtext">Tente ajustar sua busca</p>
        </div>
      )}
    </div>
  );
}

export default DiscoverCommunity;