import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { communityAPI } from '../services/capsuleService';
import { useTranslation } from 'react-i18next';
import '../styles/discoverCommunity.css';
import '../styles/discoverCommunity.overrides.css';

function DiscoverCommunity() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [explorers, setExplorers] = useState([]);
  const [filteredExplorers, setFilteredExplorers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('score'); // Agora ordenar por pontuação por padrão
  const [loading, setLoading] = useState(true);
  const [trendingCapsules, setTrendingCapsules] = useState([]);
  const [activeTab, setActiveTab] = useState('leaderboard'); // Leaderboard como tab padrão
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [period, setPeriod] = useState('all'); // all, today, week, month

  useEffect(() => {
    if (activeTab === 'explorers') {
      loadCommunity();
    } else if (activeTab === 'leaderboard') {
      loadLeaderboard();
    }
    loadTrending();
  }, [activeTab, period]);

  const loadLeaderboard = async () => {
    try {
      setLoadingLeaderboard(true);
      const res = await communityAPI.getLeaderboard({ period, limit: 50 });
      console.log('🏆 Leaderboard loaded:', res.data?.leaderboard?.length || 0);
      setLeaderboard(res.data?.leaderboard || []);
      setLoadingLeaderboard(false);
    } catch (error) {
      console.error('❌ Error loading leaderboard:', error);
      setLoadingLeaderboard(false);
    }
  };

  const loadTrending = async () => {
    try {
      const res = await communityAPI.explorePublic({ sort: 'trending', limit: 20 });
      const capsules = res.data?.capsules || [];
      console.log('📊 Trending capsules loaded:', capsules.length);
      setTrendingCapsules(capsules);

      if (capsules.length === 0) {
        console.log('⚠️ No trending capsules, trying recent...');
        const fallback = await communityAPI.explorePublic({ sort: 'recent', limit: 10 });
        setTrendingCapsules(fallback.data?.capsules || []);
      }
    } catch (err) {
      console.error('❌ Error loading trending:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'explorers') {
      filterAndSort();
    }
  }, [explorers, searchTerm, sortBy, activeTab]);

  const loadCommunity = async () => {
    try {
      setLoading(true);
      const res = await communityAPI.explorePublic({
        limit: 100
      });
      
      const capsules = res.data.capsules || [];
      console.log('📦 Capsules loaded:', capsules.length);
      
      // Agrupar cápsulas por usuário e calcular pontuação
      const userMap = {};
      
      capsules.forEach(capsule => {
        // Obter dados do criador de forma consistente
        const creator = capsule.creator || capsule.User || {};
        const userId = capsule.creatorId || creator.id;
        const metadata = capsule.metadata || {};
        
        if (!userId) {
          console.warn('⚠️ Capsule without creator:', capsule.id);
          return;
        }
        
        if (!userMap[userId]) {
          userMap[userId] = {
            userId,
            username: creator.username || metadata.author || 'Usuário Anônimo',
            avatar: creator.avatar || metadata.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
            bio: creator.bio || metadata.authorBio || 'Explorador de cápsulas temporais',
            capsules: [],
            totalViews: 0,
            totalLikes: 0,
            // Calcular pontuação inicial
            score: 0
          };
        }
        
        userMap[userId].capsules.push(capsule);
        userMap[userId].totalViews += (capsule.viewCount || 0);
        userMap[userId].totalLikes += (capsule.likes || capsule.likeCount || 0);
        
        // Calcular pontuação: 10 pontos por cápsula, 1 ponto por like, 0.5 por view
        userMap[userId].score = Math.round(
          (userMap[userId].capsules.length * 10) + 
          (userMap[userId].totalLikes * 1) + 
          (userMap[userId].totalViews * 0.5)
        );
      });

      const explorersList = Object.values(userMap);
      console.log('👥 Explorers loaded:', explorersList.length);
      
      setExplorers(explorersList);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error loading community:', error);
      setLoading(false);
    }
  };

  const handleVote = async (capsuleId) => {
    // Optimistic UI update
    setTrendingCapsules(prev => prev.map(c => 
      c.id === capsuleId 
        ? { ...c, votes: (c.votes || 0) + 1, _optimistic: true } 
        : c
    ));
    
    try {
      const res = await communityAPI.vote(capsuleId);
      const votes = res.data?.votes ?? 0;
      const voted = res.data?.voted ?? true;
      
      setTrendingCapsules(prev => prev.map(c => 
        c.id === capsuleId 
          ? { ...c, votes, voted, _optimistic: false } 
          : c
      ));
      
      // Atualizar leaderboard após voto
      if (activeTab === 'leaderboard') {
        loadLeaderboard();
      }
    } catch (err) {
      console.error('❌ Error voting:', err);
      // Revert optimistic update
      setTrendingCapsules(prev => prev.map(c => 
        c.id === capsuleId 
          ? { ...c, votes: Math.max((c.votes || 1) - 1, 0), _optimistic: false } 
          : c
      ));
    }
  };

  const filterAndSort = () => {
    let filtered = [...explorers];

    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(explorer =>
        explorer.username.toLowerCase().includes(term) ||
        explorer.bio.toLowerCase().includes(term)
      );
    }

    // Ordenar
    if (sortBy === 'popular') {
      filtered.sort((a, b) => b.capsules.length - a.capsules.length);
    } else if (sortBy === 'trending') {
      filtered.sort((a, b) => b.totalViews - a.totalViews);
    } else if (sortBy === 'score') {
      filtered.sort((a, b) => b.score - a.score);
    } else {
      // Recent: ordenar pela cápsula mais recente
      filtered.sort((a, b) => {
        const aDate = a.capsules[0]?.createdAt ? new Date(a.capsules[0].createdAt) : new Date(0);
        const bDate = b.capsules[0]?.createdAt ? new Date(b.capsules[0].createdAt) : new Date(0);
        return bDate - aDate;
      });
    }

    setFilteredExplorers(filtered);
  };

  const renderExplorers = () => {
    return (
      <>
        <div className="discover-controls">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="chronicle-button" onClick={loadCommunity}>
              🔄 {t('common.refresh', 'Atualizar')}
            </button>
          </div>
          
          <div className="search-box">
            <input
              type="text"
              placeholder={t('community.searchPlaceholder', '🔍 Procure por usuários...')}
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
            <option value="score">{t('community.byScore', 'Por Pontuação')}</option>
            <option value="recent">{t('common.recent', 'Recentes')}</option>
            <option value="popular">{t('common.popular', 'Populares')}</option>
            <option value="trending">{t('common.trending', 'Em Tendência')}</option>
          </select>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>{t('community.loadingExplorers', 'Carregando exploradores do tempo...')}</p>
          </div>
        ) : filteredExplorers.length > 0 ? (
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

                    {/* Sistema de Pontuação */}
                    <div className="score-badge">
                      <span className="score-icon">🏆</span>
                      <span className="score-value">{explorer.score}</span>
                      <span className="score-label">pontos</span>
                    </div>

                    <div className="explorer-stats">
                      <div className="stat">
                        <span className="stat-number">{explorer.capsules.length}</span>
                        <span className="stat-label">{t('dashboard.capsules', 'Cápsulas')}</span>
                        <span className="stat-points">+{explorer.capsules.length * 10}pts</span>
                      </div>
                      <div className="stat">
                        <span className="stat-number">{explorer.totalLikes}</span>
                        <span className="stat-label">{t('dashboard.likes', 'Likes')}</span>
                        <span className="stat-points">+{explorer.totalLikes}pts</span>
                      </div>
                      <div className="stat">
                        <span className="stat-number">{explorer.totalViews}</span>
                        <span className="stat-label">{t('dashboard.views', 'Views')}</span>
                        <span className="stat-points">+{Math.round(explorer.totalViews * 0.5)}pts</span>
                      </div>
                    </div>

                    <div className="recent-capsules">
                      <p className="recent-label">{t('community.recentCapsules', 'Cápsulas Recentes:')}</p>
                      <div className="capsule-previews">
                        {explorer.capsules.slice(0, 3).map((capsule) => (
                          <motion.div
                            key={capsule.id}
                            className="preview-badge"
                            title={capsule.title}
                            whileHover={{ scale: 1.1 }}
                            onClick={() => navigate(`/reveal/${capsule.id}`)}
                            style={{ cursor: 'pointer' }}
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
                      {t('common.viewProfile', 'Ver Perfil')} →
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="empty-state">
            <p>🔍 {t('community.noExplorers', 'Nenhum explorador encontrado')}</p>
            <p className="empty-subtext">{t('community.adjustSearch', 'Tenta ajustar a tua pesquisa')}</p>
          </div>
        )}
      </>
    );
  };

  const renderLeaderboard = () => {
    return (
      <>
        <div className="leaderboard-controls">
          <div className="period-selector">
            <button 
              className={`period-btn ${period === 'all' ? 'active' : ''}`}
              onClick={() => setPeriod('all')}
            >
              Todos os Tempos
            </button>
            <button 
              className={`period-btn ${period === 'month' ? 'active' : ''}`}
              onClick={() => setPeriod('month')}
            >
              Este Mês
            </button>
            <button 
              className={`period-btn ${period === 'week' ? 'active' : ''}`}
              onClick={() => setPeriod('week')}
            >
              Esta Semana
            </button>
            <button 
              className={`period-btn ${period === 'today' ? 'active' : ''}`}
              onClick={() => setPeriod('today')}
            >
              Hoje
            </button>
          </div>
          
          <button className="chronicle-button" onClick={loadLeaderboard}>
            🔄 {t('common.refresh', 'Atualizar')}
          </button>
        </div>

        {loadingLeaderboard ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>{t('community.loadingLeaderboard', 'Carregando leaderboard...')}</p>
          </div>
        ) : leaderboard.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="leaderboard-container"
          >
            {/* Top 3 Pódio */}
            <div className="podium">
              {leaderboard.slice(0, 3).map((user, index) => (
                <motion.div
                  key={user.userId}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.2 }}
                  className={`podium-place place-${index + 1}`}
                  onClick={() => navigate(`/profile/${user.userId}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="podium-rank">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="podium-avatar"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.userId}`;
                    }}
                  />
                  <h4 className="podium-username">{user.username}</h4>
                  <div className="podium-score">{user.score} pts</div>
                  <div className="podium-stats">
                    <span>{user.totalCapsules} cápsulas</span>
                    <span>•</span>
                    <span>{user.totalLikes} likes</span>
                    <span>•</span>
                    <span>{user.totalViews} views</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Resto do Leaderboard */}
            <div className="leaderboard-list">
              {leaderboard.slice(3).map((user, index) => (
                <motion.div
                  key={user.userId}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: (index + 3) * 0.05 }}
                  className="leaderboard-item"
                  onClick={() => navigate(`/profile/${user.userId}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="leaderboard-rank">
                    <span className="rank-number">#{index + 4}</span>
                  </div>
                  
                  <div className="leaderboard-user">
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="leaderboard-avatar"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.userId}`;
                      }}
                    />
                    <div className="user-details">
                      <h4>{user.username}</h4>
                      <p className="user-bio">{user.bio}</p>
                    </div>
                  </div>
                  
                  <div className="leaderboard-stats">
                    <div className="stat-item">
                      <span className="stat-value">{user.totalCapsules}</span>
                      <span className="stat-label">Cápsulas</span>
                      <span className="stat-points">+{user.totalCapsules * 10} pts</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{user.totalLikes}</span>
                      <span className="stat-label">Likes</span>
                      <span className="stat-points">+{user.totalLikes} pts</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{user.totalViews}</span>
                      <span className="stat-label">Views</span>
                      <span className="stat-points">+{Math.round(user.totalViews * 0.5)} pts</span>
                    </div>
                  </div>
                  
                  <div className="leaderboard-score">
                    <div className="score-total">{user.score}</div>
                    <div className="score-label">pontos</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="empty-state">
            <p>🏆 {t('community.noLeaderboard', 'Nenhum dado de leaderboard disponível')}</p>
            <p className="empty-subtext">Crie cápsulas públicas para aparecer no ranking!</p>
          </div>
        )}
        
        {/* Sistema de Pontuação - Explicação */}
        <div className="scoring-system-info">
          <h3>📊 Sistema de Pontuação</h3>
          <div className="scoring-rules">
            <div className="rule">
              <span className="rule-points">+10 pontos</span>
              <span className="rule-desc">por cada cápsula pública criada</span>
            </div>
            <div className="rule">
              <span className="rule-points">+1 ponto</span>
              <span className="rule-desc">por cada like recebido</span>
            </div>
            <div className="rule">
              <span className="rule-points">+0.5 pontos</span>
              <span className="rule-desc">por cada visualização</span>
            </div>
          </div>
          <p className="scoring-note">
            <strong>Nota:</strong> Apenas cápsulas públicas contam para a pontuação. 
            Cápsulas privadas não são visíveis na comunidade.
          </p>
        </div>
      </>
    );
  };

  return (
    <div className="discover-community">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="discover-header"
      >
        <div className="header-content">
          <h2>🌍 {t('community.exploreTitle', 'Explore a Comunidade')}</h2>
          <p>{t('community.exploreDescription', 'Descubra cápsulas temporais de outros usuários e conecte-se com exploradores do tempo')}</p>
        </div>

        <div className="tabs">
          <button
            className={`tab-button ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            🏆 {t('community.leaderboard', 'Leaderboard')}
          </button>
          <button
            className={`tab-button ${activeTab === 'explorers' ? 'active' : ''}`}
            onClick={() => setActiveTab('explorers')}
          >
            👥 {t('community.explorers', 'Exploradores')}
          </button>
        </div>
      </motion.div>

      {activeTab === 'explorers' ? renderExplorers() : renderLeaderboard()}
    </div>
  );
}

export default DiscoverCommunity;