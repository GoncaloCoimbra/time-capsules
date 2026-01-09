import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area
} from 'recharts';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { capsuleAPI, categoryAPI, tagAPI, communityAPI, commentAPI, likeAPI, favoriteAPI, notificationAPI } from '../services/capsuleService';
import TimelineView from '../components/TimelineView';
import Achievements from '../components/Achievements';
import DiscoverCommunity from '../components/DiscoverCommunity';

function Dashboard() {
  const [capsules, setCapsules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [communityStats, setCommunityStats] = useState(null);
  const [filteredCapsules, setFilteredCapsules] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showTagForm, setShowTagForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activityFeed, setActivityFeed] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [trendingTech, setTrendingTech] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isPrivate, setIsPrivate] = useState(true);
  const [color, setColor] = useState('#e2b714');
  const [reminder, setReminder] = useState(0);
  const [techStack, setTechStack] = useState([]);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [language, setLanguage] = useState('javascript');
  
  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState('#e2b714');
  const [tagName, setTagName] = useState('');
  
  // UI states
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('date');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('capsules');
  const [selectedCapsule, setSelectedCapsule] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [timeTravelDate, setTimeTravelDate] = useState('');
  const [timeTravelResults, setTimeTravelResults] = useState([]);
  const [showTimeTravel, setShowTimeTravel] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [achievements, setAchievements] = useState([]);
  
  // Delete confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [capsuleToDelete, setCapsuleToDelete] = useState(null);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const secondHandRef = useRef(null);

  // Atualizar tempo em tempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Efeito de partículas para o fundo
  useEffect(() => {
    const particlesContainer = document.querySelector('.dashboard-particles');
    if (!particlesContainer) return;

    const particleCount = window.innerWidth < 768 ? 30 : 60;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'time-particle';
      
      const posX = Math.random() * 100;
      const posY = Math.random() * 100;
      const size = Math.random() * 4 + 1;
      const isGold = Math.random() > 0.5;
      const color = isGold ? '#e2b714' : '#1f7a8c';
      const opacity = Math.random() * 0.3 + 0.1;
      const duration = Math.random() * 20 + 10;
      const delay = Math.random() * 5;
      
      particle.style.cssText = `
        left: ${posX}%;
        top: ${posY}%;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        opacity: ${opacity};
        animation: floatParticle ${duration}s ease-in-out ${delay}s infinite;
      `;
      
      particlesContainer.appendChild(particle);
      particles.push(particle);
    }

    return () => {
      particles.forEach(p => p.remove());
    };
  }, []);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load user's capsules
        const capsulesRes = await capsuleAPI.getAll();
        setCapsules(capsulesRes.data.capsules || []);
        
        // Load categories
        const categoriesRes = await categoryAPI.getAll();
        setCategories(categoriesRes.data.categories || []);
        
        // Load tags
        const tagsRes = await tagAPI.getAll();
        setTags(tagsRes.data.tags || []);
        
        // Load statistics
        const statsRes = await capsuleAPI.getStatistics();
        setStatistics(statsRes.data.statistics);
        
        // Load community stats
        const communityStatsRes = await communityAPI.getStats();
        setCommunityStats(communityStatsRes.data);
        
        // Load leaderboard
        const leaderboardRes = await communityAPI.getLeaderboard({ type: 'capsules' });
        setLeaderboard(leaderboardRes.data.leaderboard || []);
        
        // Load trending techs
        const trendingRes = await communityAPI.getTrendingTechs();
        setTrendingTech(trendingRes.data.trending || []);

        // Load notifications
        try {
          const notifRes = await notificationAPI.list();
          setNotifications(notifRes.data.notifications || []);
        } catch (err) {
          // ignore
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  useEffect(() => {
    filterAndSortCapsules();
  }, [capsules, filter, searchTerm, sortBy, showFavoritesOnly]);

  const filterAndSortCapsules = () => {
    let filtered = [...capsules];
    if (showFavoritesOnly) filtered = filtered.filter(c => c.isFavorite);
    if (filter === 'locked') filtered = filtered.filter(c => !c.isUnlocked);
    else if (filter === 'unlocked') filtered = filtered.filter(c => c.isUnlocked);
    
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      if (sortBy === 'date') return new Date(b.createdAt) - new Date(a.createdAt);
      else if (sortBy === 'unlock') return new Date(a.unlockDate) - new Date(b.unlockDate);
      else if (sortBy === 'views') return b.viewCount - a.viewCount;
      return 0;
    });

    setFilteredCapsules(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const capsuleData = {
        title,
        content,
        unlockDate,
        categoryId: categoryId || null,
        isPrivate,
        color,
        reminder,
        tags: selectedTags
      };

      if (editingId) {
        await capsuleAPI.update(editingId, capsuleData);
      } else {
        await capsuleAPI.create(capsuleData);
      }
      
      // Reload capsules
      const res = await capsuleAPI.getAll();
      setCapsules(res.data.capsules || []);
      
      resetForm();
    } catch (error) {
      console.error('Error saving capsule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      await categoryAPI.create({ name: categoryName, color: categoryColor });
      const res = await categoryAPI.getAll();
      setCategories(res.data.categories || []);
      setCategoryName('');
      setShowCategoryForm(false);
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleTagSubmit = async (e) => {
    e.preventDefault();
    try {
      await tagAPI.create({ name: tagName });
      const res = await tagAPI.getAll();
      setTags(res.data.tags || []);
      setTagName('');
      setShowTagForm(false);
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  const handleEdit = (capsule) => {
    setEditingId(capsule.id);
    setTitle(capsule.title);
    setContent(capsule.content);
    setUnlockDate(new Date(capsule.unlockDate).toISOString().slice(0, 16));
    setCategoryId(capsule.category?.id || '');
    setSelectedTags(capsule.tags ? capsule.tags.map(t => t.id) : []);
    setIsPrivate(capsule.isPrivate);
    setColor(capsule.color || '#e2b714');
    setTechStack(capsule.techStack || []);
    setCodeSnippet(capsule.codeSnippet || '');
    setShowForm(true);
  };

  const confirmDelete = (capsuleId, capsuleTitle) => {
    setCapsuleToDelete({ id: capsuleId, title: capsuleTitle });
    setShowDeleteConfirm(true);
  };

  const handleDelete = (capsuleId) => {
    setCapsules(prev => prev.filter(c => c.id !== capsuleId));
    setShowDeleteConfirm(false);
    setCapsuleToDelete(null);
    if (selectedCapsule?.id === capsuleId) setSelectedCapsule(null);
  };

  const toggleFavorite = async (id) => {
    try {
      // optimistic UI
      setCapsules(prev => prev.map(c => 
        c.id === id ? { ...c, isFavorited: !c.isFavorited } : c
      ));

      const res = await favoriteAPI.toggle(id);
      const fav = res.data.favorited;

      setCapsules(prev => prev.map(c => 
        c.id === id ? { ...c, isFavorited: fav } : c
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // revert optimistic change
      setCapsules(prev => prev.map(c => 
        c.id === id ? { ...c, isFavorited: !(c.isFavorited) } : c
      ));
    }
  };

  const addComment = async (capsuleId, text) => {
    if (!text.trim()) return;
    try {
      const res = await commentAPI.add(capsuleId, { content: text });
      const saved = res.data.comment;
      setCapsules(prev => prev.map(c => 
        c.id === capsuleId 
          ? { 
              ...c, 
              comments: [...(c.comments || []), saved],
              viewCount: (c.viewCount || 0) + 1 
            }
          : c
      ));
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const toggleLike = async (capsuleId) => {
    try {
      await likeAPI.toggle(capsuleId);
      const countRes = await likeAPI.getCount(capsuleId);
      const count = countRes.data.count || 0;
      setCapsules(prev => prev.map(c => 
        c.id === capsuleId 
          ? { ...c, likes: count, viewCount: (c.viewCount || 0) + 1 }
          : c
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const performTimeTravel = () => {
    if (!timeTravelDate) return;
    const targetDate = new Date(timeTravelDate);
    const results = capsules.filter(capsule => {
      const unlockDate = new Date(capsule.unlockDate);
      return unlockDate <= targetDate && !capsule.isUnlocked;
    });
    setTimeTravelResults(results);
    setShowTimeTravel(true);
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setUnlockDate('');
    setCategoryId('');
    setSelectedTags([]);
    setIsPrivate(true);
    setColor('#e2b714');
    setTechStack([]);
    setCodeSnippet('');
    setShowForm(false);
    setEditingId(null);
  };

  // Nova função para navegação ao perfil
  const goToUserProfile = () => {
    if (user?.id) {
      navigate(`/profile/${user.id}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTag = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const CodeBlock = ({ code, language }) => {
    return (
      <div style={{ position: 'relative', margin: '16px 0' }}>
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'rgba(30, 41, 59, 0.8)',
          color: '#e2b714',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          {language}
        </div>
        <pre style={{
          background: 'rgba(30, 41, 59, 0.5)',
          color: '#f1f5f9',
          padding: '16px',
          borderRadius: '8px',
          overflow: 'auto',
          fontSize: '13px',
          margin: 0,
          fontFamily: 'monospace'
        }}>
          <code>{code}</code>
        </pre>
      </div>
    );
  };

  const techSuggestions = ['React', 'Vue', 'Node.js', 'Python', 'TypeScript', 'AI/ML', 'Web3', 'Blockchain'];

  return (
    <div className="time-chronicle-dashboard">
      {/* Fundo com partículas */}
      <div className="dashboard-particles"></div>
      
      {/* Relógio Analógico de Fundo */}
      <div className="dashboard-clock">
        <div className="clock-ring ring-1"></div>
        <div className="clock-ring ring-2"></div>
        
        <div className="clock-face">
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30) * Math.PI / 180;
            const radius = 42;
            const x = 50 + Math.cos(angle) * radius;
            const y = 50 + Math.sin(angle) * radius;
            
            return (
              <div 
                key={i} 
                className="hour-marker"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: `translate(-50%, -50%) rotate(${i * 30}deg)`
                }}
              >
                <div className="marker-inner">
                  <span className="hour-number" style={{ transform: `rotate(${-i * 30}deg)` }}>
                    {i === 0 ? 'XII' : i}
                  </span>
                </div>
              </div>
            );
          })}
          
          <div 
            className="clock-hand hour-hand"
            style={{
              transform: `rotate(${(currentTime.getHours() % 12) * 30 + currentTime.getMinutes() * 0.5}deg)`
            }}
          />
          
          <div 
            className="clock-hand minute-hand"
            style={{
              transform: `rotate(${currentTime.getMinutes() * 6 + currentTime.getSeconds() * 0.1}deg)`
            }}
          />
          
          <div 
            ref={secondHandRef}
            className="clock-hand second-hand"
            style={{
              transform: `rotate(${currentTime.getSeconds() * 6}deg)`
            }}
          />
          
          <div className="clock-center"></div>
        </div>
      </div>
      
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <div className="time-glyph">
            <div className="glyph-circle">
              <div className="glyph-hand hour"></div>
              <div className="glyph-hand minute"></div>
            </div>
          </div>
          <div className="header-text">
            <h1 className="chronicle-title">Time Chronicle</h1>
            <p className="chronicle-subtitle">Dashboard Temporal</p>
          </div>
        </div>
        
        <div className="header-right">
          <div className="time-display">
            <div className="digital-time">{formatTime(currentTime)}</div>
            <div className="digital-date">
              {currentTime.toLocaleDateString('pt-PT', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </div>
          </div>
          
          <div className="user-info">
            <div className="notifications">
              <button className="notif-btn" onClick={() => setActiveTab('notifications')}>
                🔔 {notifications.filter(n => !n.read).length}
              </button>
            </div>
            {/* Avatar modificado para navegar ao perfil */}
            <div className="user-avatar" onClick={goToUserProfile} style={{ cursor: 'pointer' }} title="Clique para ver perfil">
              {user?.username?.substring(0, 2).toUpperCase() || 'US'}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.username || 'User'}</span>
              <span className="user-role">Time Traveler</span>
            </div>
            <button onClick={handleLogout} className="logout-button">
              <svg viewBox="0 0 24 24">
                <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Conteúdo Principal */}
      <div className="dashboard-content">
        {/* Sidebar */}
        <div className="dashboard-sidebar">
          <nav className="sidebar-nav">
            <button 
              className={`nav-item ${activeTab === 'capsules' ? 'active' : ''}`}
              onClick={() => setActiveTab('capsules')}
            >
              <svg className="nav-icon" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/>
              </svg>
              <span>Cápsulas</span>
            </button>
            
            <button 
              className={`nav-item ${activeTab === 'statistics' ? 'active' : ''}`}
              onClick={() => setActiveTab('statistics')}
            >
              <svg className="nav-icon" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
              </svg>
              <span>Estatísticas</span>
            </button>
            
            <button 
              className={`nav-item ${activeTab === 'time-travel' ? 'active' : ''}`}
              onClick={() => setActiveTab('time-travel')}
            >
              <svg className="nav-icon" viewBox="0 0 24 24">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
              </svg>
              <span>Viagem Temporal</span>
            </button>

            <button 
              className={`nav-item ${activeTab === 'timeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              <svg className="nav-icon" viewBox="0 0 24 24">
                <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
              </svg>
              <span>Timeline</span>
            </button>
            
            <button 
              className={`nav-item ${activeTab === 'trending' ? 'active' : ''}`}
              onClick={() => setActiveTab('trending')}
            >
              <svg className="nav-icon" viewBox="0 0 24 24">
                <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
              </svg>
              <span>Trending</span>
            </button>

            <button 
              className={`nav-item ${activeTab === 'achievements' ? 'active' : ''}`}
              onClick={() => setActiveTab('achievements')}
            >
              <svg className="nav-icon" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span>Achievements</span>
            </button>

            <button 
              className={`nav-item ${activeTab === 'community' ? 'active' : ''}`}
              onClick={() => setActiveTab('community')}
            >
              <svg className="nav-icon" viewBox="0 0 24 24">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
              <span>Comunidade</span>
            </button>
          </nav>
          
          <div className="sidebar-stats">
            <div className="stat-item">
              <span className="stat-label">Cápsulas Totais</span>
              <span className="stat-value">{capsules.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Bloqueadas</span>
              <span className="stat-value">{capsules.filter(c => !c.isUnlocked).length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Desbloqueadas</span>
              <span className="stat-value">{capsules.filter(c => c.isUnlocked).length}</span>
            </div>
          </div>
        </div>
        
        {/* Área Principal */}
        <div className="dashboard-main">
          {/* Cápsulas */}
          {activeTab === 'capsules' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="chronicle-card main-card"
            >
              <div className="card-header">
                <h2>Suas Cápsulas Temporais</h2>
                <div className="card-actions">
                  <button 
                    onClick={() => { resetForm(); setShowForm(!showForm); }} 
                    className="chronicle-button"
                  >
                    {showForm ? 'Cancelar' : 'Nova Cápsula'}
                  </button>
                  <div className="search-container">
                    <svg className="search-icon" viewBox="0 0 24 24">
                      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                    <input
                      type="text"
                      placeholder="Buscar cápsulas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="chronicle-input"
                    />
                  </div>
                </div>
              </div>
              
              {/* Formulário */}
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="capsule-form"
                >
                  <h3>{editingId ? 'Editar Cápsula' : 'Criar Nova Cápsula'}</h3>
                  <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Título</label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                          className="chronicle-input"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Data de Desbloqueio</label>
                        <input
                          type="datetime-local"
                          value={unlockDate}
                          onChange={(e) => setUnlockDate(e.target.value)}
                          required
                          className="chronicle-input"
                        />
                      </div>
                      
                      <div className="form-group full-width">
                        <label>Conteúdo</label>
                        <textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          required
                          rows="4"
                          className="chronicle-input"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Categoria</label>
                        <select
                          value={categoryId}
                          onChange={(e) => setCategoryId(e.target.value)}
                          className="chronicle-input"
                        >
                          <option value="">Selecione...</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>Cor</label>
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="color-input"
                        />
                      </div>
                    </div>
                    
                    <div className="form-actions">
                      <button type="submit" className="chronicle-button" disabled={loading}>
                        {loading ? 'Salvando...' : (editingId ? 'Atualizar' : 'Criar Cápsula')}
                      </button>
                      <button type="button" onClick={resetForm} className="btn-secondary">
                        Cancelar
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
              
              {/* Lista de Cápsulas */}
              <div className="capsules-grid">
                {filteredCapsules.map((capsule) => (
                  <div 
                    key={capsule.id} 
                    className="capsule-card"
                    style={{ borderLeftColor: capsule.color }}
                    onClick={() => setSelectedCapsule(capsule)}
                  >
                    <div className="capsule-header">
                      <div className="capsule-icon">
                        {capsule.metadata?.authorAvatar}
                      </div>
                      <div className="capsule-info">
                        <h3>{capsule.title}</h3>
                        <span className="capsule-author">Por {capsule.metadata?.author}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(capsule.id); }}
                        className={`favorite-btn ${(capsule.isFavorited || capsule.isFavorite) ? 'active' : ''}`}
                      >
                        {(capsule.isFavorited || capsule.isFavorite) ? '★' : '☆'}
                      </button>
                    </div>
                    
                    <div className="capsule-tags">
                      {capsule.category && (
                        <span className="tag" style={{ background: capsule.category.color }}>
                          {capsule.category.name}
                        </span>
                      )}
                      {capsule.tags?.map(tag => (
                        <span key={tag.id} className="tag secondary">
                          {tag.name}
                        </span>
                      ))}
                      <span className={`tag ${capsule.isUnlocked ? 'unlocked' : 'locked'}`}>
                        {capsule.isUnlocked ? 'Desbloqueada' : 'Bloqueada'}
                      </span>
                    </div>
                    
                    <div className="capsule-details">
                      <div className="detail">
                        <span>Desbloqueia:</span>
                        <strong>{new Date(capsule.unlockDate).toLocaleDateString('pt-PT')}</strong>
                      </div>
                      <div className="detail">
                        <span>Visualizações:</span>
                        <strong>{capsule.viewCount}</strong>
                      </div>
                      <div className="detail">
                        <span>Likes:</span>
                        <strong>{capsule.likes || 0}</strong>
                      </div>
                    </div>
                    
                    {capsule.isUnlocked && (
                      <div className="capsule-preview">
                        <p>{capsule.content.substring(0, 100)}...</p>
                      </div>
                    )}
                    
                    <div className="capsule-actions">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(capsule); }}
                        className="btn-secondary"
                      >
                        Editar
                      </button>
                      <button
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          confirmDelete(capsule.id, capsule.title);
                        }}
                        className="btn-danger"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          
          {/* Notifications */}
          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="chronicle-card main-card">
              <h2>Notificações</h2>
              {notifications.length === 0 && <p>Sem notificações</p>}
              <ul className="notifications-list">
                {notifications.map(n => (
                  <li key={n.id} className={`notification-item ${n.read ? 'read' : 'unread'}`}>
                    <div className="notif-body">
                      <strong>{n.type}</strong>
                      <span className="notif-meta">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</span>
                      <p>{n.meta?.text || ''}</p>
                    </div>
                    <div className="notif-actions">
                      {!n.read && <button onClick={async () => { try { await notificationAPI.markRead(n.id); setNotifications(prev => prev.map(p => p.id === n.id ? { ...p, read: true } : p)); } catch (err) {} }}>Marcar lida</button>}
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Estatísticas */}
          {activeTab === 'statistics' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="chronicle-card main-card"
            >
              <h2>Estatísticas Temporais</h2>
              
              {statistics ? (
                <>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-icon">📊</div>
                      <div className="stat-content">
                        <h3>{statistics.totalCapsules}</h3>
                        <p>Cápsulas Totais</p>
                      </div>
                    </div>
                    
                    <div className="stat-card">
                      <div className="stat-icon">🔒</div>
                      <div className="stat-content">
                        <h3>{statistics.lockedCapsules}</h3>
                        <p>Bloqueadas</p>
                      </div>
                    </div>
                    
                    <div className="stat-card">
                      <div className="stat-icon">🔓</div>
                      <div className="stat-content">
                        <h3>{statistics.unlockedCapsules}</h3>
                        <p>Desbloqueadas</p>
                      </div>
                    </div>
                    
                    <div className="stat-card">
                      <div className="stat-icon"></div>
                      <div className="stat-content">
                        <h3>{statistics.totalViews}</h3>
                        <p>Visualizações</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="charts-container">
                    {statistics.capsulesByMonth && statistics.capsulesByMonth.length > 0 && (
                      <div className="chart-card">
                        <h3>Atividade Mensal</h3>
                        <ResponsiveContainer width="100%" height={200}>
                          <AreaChart data={statistics.capsulesByMonth}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" fontSize={12} />
                            <Tooltip />
                            <Area 
                              type="monotone" 
                              dataKey="count" 
                              stroke="#e2b714" 
                              fill="#e2b714" 
                              fillOpacity={0.2} 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    
                    {statistics.capsulesByCategory && statistics.capsulesByCategory.length > 0 && (
                      <div className="chart-card">
                        <h3>Distribuição por Categoria</h3>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={statistics.capsulesByCategory}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {statistics.capsulesByCategory.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  <p>Carregando estatísticas...</p>
                </div>
              )}
            </motion.div>
          )}
          
          {/* Time Travel */}
          {activeTab === 'time-travel' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="chronicle-card main-card"
            >
              <h2>Máquina do Tempo</h2>
              <p className="section-description">
                Viaje para qualquer data no futuro para pré-visualizar quais cápsulas serão desbloqueadas
              </p>
              
              <div className="time-travel-controls">
                <input
                  type="date"
                  value={timeTravelDate}
                  onChange={(e) => setTimeTravelDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="chronicle-input"
                />
                <button
                  onClick={performTimeTravel}
                  className="chronicle-button"
                >
                  Viajar no Tempo
                </button>
              </div>
              
              {showTimeTravel && (
                <div className="time-travel-results">
                  <h3>{timeTravelResults.length} cápsulas serão desbloqueadas</h3>
                  <div className="results-grid">
                    {timeTravelResults.map(capsule => (
                      <div key={capsule.id} className="result-card">
                        <h4>{capsule.title}</h4>
                        <p>Por {capsule.metadata?.author}</p>
                        <div className="result-actions">
                          <button className="btn-success">Pré-visualizar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
          
          {/* Timeline */}
          {activeTab === 'timeline' && (
            <TimelineView 
              capsules={capsules} 
              onCapsuleClick={(capsule) => {
                setSelectedCapsule(capsule);
                setActiveTab('detail');
              }}
            />
          )}

          {/* Achievements */}
          {activeTab === 'achievements' && (
            <Achievements 
              capsules={capsules}
              statistics={statistics}
            />
          )}

          {/* Community */}
          {activeTab === 'community' && (
            <DiscoverCommunity />
          )}
          
          {/* Trending */}
          {activeTab === 'trending' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="chronicle-card main-card"
            >
              <h2>Tecnologias em Tendência</h2>
              
              <div className="trending-grid">
                {trendingTech.map((tech, index) => (
                  <div key={index} className="trend-card">
                    <div className="trend-header">
                      <h3>{tech.name}</h3>
                      <span className={`trend-growth ${tech.growth > 0 ? 'positive' : 'negative'}`}>
                        {tech.growth > 0 ? '+' : ''}{tech.growth}%
                      </span>
                    </div>
                    <p>{tech.mentions} menções em cápsulas</p>
                    <div className="trend-bar">
                      <div 
                        className="trend-fill"
                        style={{ width: `${Math.min(tech.growth, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="leaderboard-section">
                <h3>Top Contribuidores</h3>
                <div className="leaderboard">
                  {leaderboard.map((user, index) => (
                    <div key={user.id} className="leaderboard-item">
                      <div className="rank">{index + 1}</div>
                      <div className="user-info">
                        <span className="username">{user.username}</span>
                        <span className="user-stats">{user.capsules} cápsulas</span>
                      </div>
                      <div className="unlocked-count">{user.unlocked} desbloqueadas</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Modal de Confirmação de Exclusão */}
      <AnimatePresence>
        {showDeleteConfirm && capsuleToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="chronicle-card modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="modal-close"
              >
                ×
              </button>
              
              <div className="modal-content">
                <div className="warning-icon">!</div>
                <h2>Excluir Cápsula</h2>
                <p>
                  Tem certeza que deseja excluir a cápsula <strong>"{capsuleToDelete.title}"</strong>? 
                  Esta ação não pode ser desfeita.
                </p>
                
                <div className="modal-actions">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleDelete(capsuleToDelete.id)}
                    className="btn-danger"
                  >
                    Excluir Cápsula
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Modal de Detalhes da Cápsula */}
      <AnimatePresence>
        {selectedCapsule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setSelectedCapsule(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="chronicle-card modal-card large"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedCapsule(null)}
                className="modal-close"
              >
                ×
              </button>
              
              <div className="capsule-detail">
                <div className="detail-header">
                  <div className="detail-avatar">
                    {selectedCapsule.metadata?.authorAvatar}
                  </div>
                  <div>
                    <h2>{selectedCapsule.title}</h2>
                    <p className="detail-meta">
                      Por {selectedCapsule.metadata?.author} • 
                      Criada {formatTimeAgo(selectedCapsule.createdAt)}
                    </p>
                  </div>
                </div>
                
                <div className="detail-content">
                  {selectedCapsule.content}
                  {selectedCapsule.codeSnippet && (
                    <CodeBlock 
                      code={selectedCapsule.codeSnippet} 
                      language={selectedCapsule.language} 
                    />
                  )}
                </div>
                
                <div className="detail-tags">
                  {selectedCapsule.techStack?.map((tech, index) => (
                    <span key={index} className="tag">
                      {tech}
                    </span>
                  ))}
                </div>
                
                <div className="detail-stats">
                  <div className="stat">
                    <span>Desbloqueia:</span>
                    <strong>{new Date(selectedCapsule.unlockDate).toLocaleDateString()}</strong>
                  </div>
                  <div className="stat">
                    <span>Visualizações:</span>
                    <strong>{selectedCapsule.viewCount}</strong>
                  </div>
                  <div className="stat">
                    <span>Status:</span>
                    <strong className={selectedCapsule.isUnlocked ? 'unlocked' : 'locked'}>
                      {selectedCapsule.isUnlocked ? 'Desbloqueada' : 'Bloqueada'}
                    </strong>
                  </div>
                </div>
                
                <div className="detail-actions">
                  <button
                    onClick={() => toggleLike(selectedCapsule.id)}
                    className="btn-secondary"
                  >
                    Curtir ({selectedCapsule.likes || 0})
                  </button>
                  <button
                    onClick={() => confirmDelete(selectedCapsule.id, selectedCapsule.title)}
                    className="btn-danger"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Orbitron:wght@400;500;600&display=swap');
        
        .time-chronicle-dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a14 0%, #151528 50%, #1a1a2e 100%);
          padding: 20px;
          position: relative;
          overflow-x: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #f1f5f9;
        }
        
        .dashboard-particles {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
        }
        
        .dashboard-clock {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60vmin;
          height: 60vmin;
          max-width: 600px;
          max-height: 600px;
          z-index: 2;
          pointer-events: none;
          opacity: 0.3;
        }
        
        .clock-ring {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 1px solid rgba(226, 183, 20, 0.1);
          animation: ringPulse 6s ease-in-out infinite;
        }
        
        .ring-2 {
          animation-delay: 2s;
          transform: scale(1.05);
          border-color: rgba(31, 122, 140, 0.08);
        }
        
        .clock-face {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
        }
        
        .hour-marker {
          position: absolute;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .hour-number {
          font-family: 'Orbitron', sans-serif;
          font-size: 1.5vmin;
          font-weight: 600;
          color: rgba(226, 183, 20, 0.8);
          text-shadow: 0 0 10px rgba(226, 183, 20, 0.3);
        }
        
        .clock-hand {
          position: absolute;
          top: 50%;
          left: 50%;
          transform-origin: center left;
        }
        
        .hour-hand {
          width: 20%;
          height: 4px;
          background: #e2b714;
          border-radius: 2px;
          box-shadow: 0 0 10px rgba(226, 183, 20, 0.5);
        }
        
        .minute-hand {
          width: 30%;
          height: 3px;
          background: #1f7a8c;
          border-radius: 2px;
          box-shadow: 0 0 10px rgba(31, 122, 140, 0.5);
        }
        
        .second-hand {
          width: 35%;
          height: 2px;
          background: #ff6b6b;
          border-radius: 1px;
          box-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
        }
        
        .clock-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 12px;
          height: 12px;
          background: #e2b714;
          border-radius: 50%;
          box-shadow: 0 0 20px rgba(226, 183, 20, 0.8);
        }
        
        /* Header */
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 0;
          margin-bottom: 30px;
          position: relative;
          z-index: 10;
        }
        
        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .time-glyph {
          width: 60px;
          height: 60px;
          position: relative;
        }
        
        .glyph-circle {
          width: 100%;
          height: 100%;
          border: 2px solid rgba(226, 183, 20, 0.3);
          border-radius: 50%;
          position: relative;
          animation: glyphRotate 20s linear infinite;
        }
        
        .glyph-hand {
          position: absolute;
          background: #e2b714;
          transform-origin: bottom center;
          border-radius: 2px;
          left: calc(50% - 1px);
        }
        
        .glyph-hand.hour {
          width: 2px;
          height: 20px;
          top: 10px;
          animation: rotateHour 40s linear infinite;
        }
        
        .glyph-hand.minute {
          width: 1px;
          height: 28px;
          top: 2px;
          animation: rotateMinute 20s linear infinite;
        }
        
        .header-text {
          margin-top: 8px;
        }
        
        .chronicle-title {
          font-size: 32px;
          font-weight: 700;
          background: linear-gradient(135deg, #e2b714 0%, #1f7a8c 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0 0 4px 0;
          letter-spacing: -0.5px;
          font-family: 'Orbitron', sans-serif;
        }
        
        .chronicle-subtitle {
          color: #94a3b8;
          font-size: 14px;
          margin: 0;
          font-weight: 400;
        }
        
        .header-right {
          display: flex;
          align-items: center;
          gap: 30px;
        }
        
        .time-display {
          text-align: right;
        }
        
        .digital-time {
          font-family: 'Orbitron', sans-serif;
          font-size: 24px;
          color: #e2b714;
          font-weight: 600;
          text-shadow: 0 0 15px rgba(226, 183, 20, 0.5);
        }
        
        .digital-date {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 2px;
        }
        
        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(15, 15, 25, 0.6);
          padding: 8px 16px;
          border-radius: 12px;
          border: 1px solid rgba(226, 183, 20, 0.1);
        }
        
        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e2b714, #1f7a8c);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: transform 0.3s ease;
        }
        
        .user-avatar:hover {
          transform: scale(1.05);
        }
        
        .user-details {
          display: flex;
          flex-direction: column;
        }
        
        .user-name {
          font-weight: 600;
          font-size: 14px;
        }
        
        .user-role {
          font-size: 11px;
          color: #94a3b8;
        }
        
        .logout-button {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        
        .logout-button:hover {
          color: #e2b714;
          background: rgba(226, 183, 20, 0.1);
        }
        
        .logout-button svg {
          width: 20px;
          height: 20px;
          fill: currentColor;
        }
        
        /* Layout Principal */
        .dashboard-content {
          display: flex;
          gap: 24px;
          position: relative;
          z-index: 10;
        }
        
        .dashboard-sidebar {
          width: 240px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        .dashboard-main {
          flex: 1;
          min-width: 0;
        }
        
        /* Sidebar */
        .sidebar-nav {
          background: rgba(15, 15, 25, 0.6);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          border: 1px solid rgba(226, 183, 20, 0.1);
          overflow: hidden;
        }
        
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 16px 20px;
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 14px;
          text-align: left;
          cursor: pointer;
          transition: all 0.3s ease;
          border-bottom: 1px solid rgba(226, 183, 20, 0.05);
        }
        
        .nav-item:last-child {
          border-bottom: none;
        }
        
        .nav-item:hover {
          background: rgba(226, 183, 20, 0.05);
          color: #e2b714;
        }
        
        .nav-item.active {
          background: rgba(226, 183, 20, 0.1);
          color: #e2b714;
          border-left: 3px solid #e2b714;
        }
        
        .nav-icon {
          width: 20px;
          height: 20px;
          fill: currentColor;
        }
        
        .sidebar-stats {
          background: rgba(15, 15, 25, 0.6);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          border: 1px solid rgba(226, 183, 20, 0.1);
          padding: 20px;
        }
        
        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid rgba(226, 183, 20, 0.05);
        }
        
        .stat-item:last-child {
          border-bottom: none;
        }
        
        .stat-label {
          font-size: 13px;
          color: #94a3b8;
        }
        
        .stat-value {
          font-family: 'Orbitron', sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: #e2b714;
        }
        
        /* Cards Principais */
        .main-card {
          background: rgba(15, 15, 25, 0.6);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          border: 1px solid rgba(226, 183, 20, 0.15);
          padding: 30px;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        
        .main-card h2 {
          font-size: 24px;
          font-weight: 700;
          color: #e2b714;
          margin: 0 0 24px 0;
          font-family: 'Orbitron', sans-serif;
        }
        
        .section-description {
          color: #94a3b8;
          font-size: 14px;
          margin-bottom: 24px;
          line-height: 1.6;
        }
        
        /* Botões e Inputs */
        .chronicle-button {
          background: linear-gradient(135deg, #e2b714 0%, #1f7a8c 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          padding: 12px 24px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .chronicle-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(226, 183, 20, 0.3);
        }
        
        .chronicle-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .btn-secondary {
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid #334155;
          border-radius: 12px;
          color: #cbd5e1;
          font-size: 14px;
          padding: 12px 24px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .btn-secondary:hover {
          border-color: #475569;
          background: rgba(30, 41, 59, 0.8);
        }
        
        .btn-danger {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          color: #f87171;
          font-size: 14px;
          padding: 12px 24px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .btn-danger:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.3);
        }
        
        .btn-success {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 12px;
          color: #34d399;
          font-size: 14px;
          padding: 12px 24px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .btn-success:hover {
          background: rgba(16, 185, 129, 0.2);
          border-color: rgba(16, 185, 129, 0.3);
        }
        
        .chronicle-input {
          width: 100%;
          padding: 12px 16px;
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid #334155;
          border-radius: 12px;
          color: #f1f5f9;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          transition: all 0.3s ease;
        }
        
        .chronicle-input:focus {
          outline: none;
          border-color: #e2b714;
          background: rgba(30, 41, 59, 0.8);
        }
        
        /* Cápsulas */
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 16px;
        }
        
        .card-actions {
          display: flex;
          gap: 16px;
          align-items: center;
        }
        
        .search-container {
          position: relative;
          min-width: 300px;
        }
        
        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          fill: #64748b;
          z-index: 2;
        }
        
        .search-container .chronicle-input {
          padding-left: 48px;
        }
        
        .capsules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 30px;
        }
        
        .capsule-card {
          background: rgba(30, 41, 59, 0.3);
          border-radius: 16px;
          padding: 20px;
          border: 1px solid rgba(226, 183, 20, 0.1);
          border-left: 4px solid #e2b714;
          cursor: pointer;
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
        
        .capsule-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e2b714, #1f7a8c);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }
        
        .capsule-info {
          flex: 1;
        }
        
        .capsule-info h3 {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
          color: #f1f5f9;
        }
        
        .capsule-author {
          font-size: 12px;
          color: #94a3b8;
        }
        
        .favorite-btn {
          background: none;
          border: none;
          font-size: 20px;
          color: #475569;
          cursor: pointer;
          padding: 4px;
          transition: all 0.2s ease;
        }
        
        .favorite-btn.active {
          color: #f59e0b;
        }
        
        .capsule-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        
        .tag {
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 6px;
          background: rgba(226, 183, 20, 0.1);
          color: #e2b714;
          font-weight: 500;
        }
        
        .tag.secondary {
          background: rgba(31, 122, 140, 0.1);
          color: #1f7a8c;
        }
        
        .tag.unlocked {
          background: rgba(16, 185, 129, 0.1);
          color: #34d399;
        }
        
        .tag.locked {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }
        
        .capsule-details {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .detail {
          font-size: 12px;
          color: #94a3b8;
        }
        
        .detail strong {
          display: block;
          color: #f1f5f9;
          font-size: 14px;
          margin-top: 2px;
        }
        
        .capsule-preview {
          font-size: 13px;
          color: #cbd5e1;
          line-height: 1.6;
          margin-bottom: 16px;
          padding: 12px;
          background: rgba(30, 41, 59, 0.5);
          border-radius: 8px;
        }
        
        .capsule-actions {
          display: flex;
          gap: 8px;
        }
        
        .capsule-actions button {
          flex: 1;
          padding: 8px 16px;
          font-size: 13px;
        }
        
        /* Formulário */
        .capsule-form {
          background: rgba(30, 41, 59, 0.3);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 30px;
          border: 1px solid rgba(226, 183, 20, 0.1);
        }
        
        .capsule-form h3 {
          font-size: 18px;
          font-weight: 600;
          color: #e2b714;
          margin: 0 0 20px 0;
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .form-group.full-width {
          grid-column: 1 / -1;
        }
        
        .form-group label {
          font-size: 13px;
          font-weight: 500;
          color: #cbd5e1;
        }
        
        .color-input {
          width: 50px;
          height: 40px;
          padding: 2px;
          cursor: pointer;
          border: 1px solid #334155;
          border-radius: 8px;
          background: none;
        }
        
        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
        
        /* Estatísticas */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }
        
        .stat-card {
          background: rgba(30, 41, 59, 0.3);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid rgba(226, 183, 20, 0.1);
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s ease;
        }
        
        .stat-card:hover {
          border-color: rgba(226, 183, 20, 0.3);
          transform: translateY(-2px);
        }
        
        .stat-icon {
          font-size: 32px;
          color: #e2b714;
        }
        
        .stat-content h3 {
          font-size: 28px;
          font-weight: 700;
          color: #f1f5f9;
          margin: 0 0 4px 0;
          font-family: 'Orbitron', sans-serif;
        }
        
        .stat-content p {
          font-size: 14px;
          color: #94a3b8;
          margin: 0;
        }
        
        .charts-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
        }
        
        .chart-card {
          background: rgba(30, 41, 59, 0.3);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid rgba(226, 183, 20, 0.1);
        }
        
        .chart-card h3 {
          font-size: 16px;
          font-weight: 600;
          color: #e2b714;
          margin: 0 0 20px 0;
        }
        
        /* Time Travel */
        .time-travel-controls {
          display: flex;
          gap: 12px;
          margin-bottom: 30px;
        }
        
        .time-travel-controls .chronicle-input {
          max-width: 200px;
        }
        
        .time-travel-results {
          margin-top: 30px;
        }
        
        .time-travel-results h3 {
          font-size: 18px;
          font-weight: 600;
          color: #e2b714;
          margin: 0 0 20px 0;
        }
        
        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 16px;
        }
        
        .result-card {
          background: rgba(30, 41, 59, 0.3);
          border-radius: 12px;
          padding: 16px;
          border: 1px solid rgba(226, 183, 20, 0.1);
        }
        
        .result-card h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          color: #f1f5f9;
        }
        
        .result-card p {
          font-size: 12px;
          color: #94a3b8;
          margin: 0 0 12px 0;
        }
        
        .result-actions {
          display: flex;
          gap: 8px;
        }
        
        /* Trending */
        .trending-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }
        
        .trend-card {
          background: rgba(30, 41, 59, 0.3);
          border-radius: 16px;
          padding: 20px;
          border: 1px solid rgba(226, 183, 20, 0.1);
        }
        
        .trend-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .trend-card h3 {
          font-size: 16px;
          font-weight: 600;
          color: #f1f5f9;
          margin: 0;
        }
        
        .trend-growth {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 4px;
        }
        
        .trend-growth.positive {
          background: rgba(16, 185, 129, 0.1);
          color: #34d399;
        }
        
        .trend-card p {
          font-size: 13px;
          color: #94a3b8;
          margin: 0 0 12px 0;
        }
        
        .trend-bar {
          height: 6px;
          background: rgba(30, 41, 59, 0.5);
          border-radius: 3px;
          overflow: hidden;
        }
        
        .trend-fill {
          height: 100%;
          background: linear-gradient(90deg, #e2b714, #1f7a8c);
          border-radius: 3px;
        }
        
        .leaderboard-section h3 {
          font-size: 18px;
          font-weight: 600;
          color: #e2b714;
          margin: 0 0 20px 0;
        }
        
        .leaderboard {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .leaderboard-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: rgba(30, 41, 59, 0.3);
          border-radius: 12px;
          border: 1px solid rgba(226, 183, 20, 0.1);
        }
        
        .rank {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e2b714, #1f7a8c);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: white;
        }
        
        .user-info {
          flex: 1;
        }
        
        .username {
          display: block;
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 2px;
        }
        
        .user-stats {
          font-size: 12px;
          color: #94a3b8;
        }
        
        .unlocked-count {
          font-family: 'Orbitron', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: #e2b714;
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
        
        .modal-card {
          max-width: 500px;
          width: 100%;
          animation: modalAppear 0.3s ease;
        }
        
        .modal-card.large {
          max-width: 700px;
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
        }
        
        .modal-close:hover {
          color: #e2b714;
          border-color: #e2b714;
        }
        
        .modal-content {
          text-align: center;
          padding: 40px 30px 30px;
        }
        
        .warning-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 32px;
          color: #ef4444;
          font-weight: 700;
        }
        
        .modal-content h2 {
          font-size: 24px;
          font-weight: 700;
          color: #f1f5f9;
          margin: 0 0 16px 0;
        }
        
        .modal-content p {
          color: #94a3b8;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 30px;
        }
        
        .modal-content strong {
          color: #e2b714;
        }
        
        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }
        
        /* Detalhes da Cápsula */
        .capsule-detail {
          padding: 20px;
        }
        
        .detail-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .detail-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e2b714, #1f7a8c);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 18px;
        }
        
        .detail-header h2 {
          font-size: 24px;
          font-weight: 700;
          color: #f1f5f9;
          margin: 0 0 4px 0;
        }
        
        .detail-meta {
          font-size: 13px;
          color: #94a3b8;
          margin: 0;
        }
        
        .detail-content {
          font-size: 15px;
          line-height: 1.6;
          color: #cbd5e1;
          margin-bottom: 24px;
          padding: 20px;
          background: rgba(30, 41, 59, 0.3);
          border-radius: 12px;
        }
        
        .detail-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }
        
        .detail-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 24px;
          padding: 20px;
          background: rgba(30, 41, 59, 0.3);
          border-radius: 12px;
        }
        
        .stat {
          text-align: center;
        }
        
        .stat span {
          display: block;
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 4px;
        }
        
        .stat strong {
          display: block;
          font-size: 16px;
          font-weight: 600;
          color: #f1f5f9;
        }
        
        .stat strong.unlocked {
          color: #34d399;
        }
        
        .stat strong.locked {
          color: #f59e0b;
        }
        
        .detail-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
        
        /* Animações */
        @keyframes floatParticle {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0.1;
          }
          25% {
            transform: translate(10px, -20px) rotate(90deg);
            opacity: 0.3;
          }
          50% {
            transform: translate(-15px, 10px) rotate(180deg);
            opacity: 0.2;
          }
          75% {
            transform: translate(20px, 15px) rotate(270deg);
            opacity: 0.4;
          }
        }
        
        @keyframes ringPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        
        @keyframes glyphRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes rotateHour {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes rotateMinute {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes modalAppear {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        /* Responsividade */
        @media (max-width: 1024px) {
          .dashboard-content {
            flex-direction: column;
          }
          
          .dashboard-sidebar {
            width: 100%;
            flex-direction: row;
            justify-content: space-between;
          }
          
          .sidebar-nav {
            flex: 1;
          }
          
          .sidebar-stats {
            flex: 1;
            max-width: 300px;
          }
        }
        
        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }
          
          .header-left, .header-right {
            width: 100%;
            justify-content: center;
          }
          
          .user-info {
            justify-content: center;
          }
          
          .card-header {
            flex-direction: column;
            align-items: stretch;
          }
          
          .card-actions {
            flex-direction: column;
          }
        
          .search-container {
            min-width: 100%;
          }
          
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .modal-card.large {
            max-width: 100%;
          }
          
          .detail-stats {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 480px) {
          .main-card, .capsule-card, .stat-card, .chart-card {
            padding: 16px;
          }
          
          .dashboard-clock {
            display: none;
          }
          
          .chronicle-title {
            font-size: 24px;
          }
          
          .capsules-grid {
            grid-template-columns: 1fr;
          }
          
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .charts-container {
            grid-template-columns: 1fr;
          }
          
          .trending-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;