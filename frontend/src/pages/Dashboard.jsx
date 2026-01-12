import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area, BarChart, Bar
} from 'recharts';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { capsuleAPI, categoryAPI, tagAPI, communityAPI, commentAPI, likeAPI, favoriteAPI, notificationAPI } from '../services/capsuleService';
import TimelineView from '../components/TimelineView';
import Achievements from '../components/Achievements';
import DiscoverCommunity from '../components/DiscoverCommunity';
import './Dashboard.css'; 

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
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [reminderTextLocal, setReminderTextLocal] = useState('');
  const [reminderDateLocal, setReminderDateLocal] = useState('');
  const [notifyCommunity, setNotifyCommunity] = useState(false);
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
  const [capsuleScope, setCapsuleScope] = useState('mine'); // 'mine' ou 'public'
  const [newCapsuleId, setNewCapsuleId] = useState(null);
  
  // Delete confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [capsuleToDelete, setCapsuleToDelete] = useState(null);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const secondHandRef = useRef(null);

  // Atualizar tempo em tempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Detect query param newId to trigger timeline animation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('newId');
    if (id) {
      setNewCapsuleId(id);
      // remove query param after a short delay so it doesn't retrigger
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 2000);
    }
  }, [location.search]);

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
    loadAllData();
    loadLocalReminders();
  }, [capsuleScope]);

  // Load local reminders from localStorage and set timers
  const loadLocalReminders = () => {
    try {
      const raw = localStorage.getItem('localReminders');
      if (!raw) return;
      const items = JSON.parse(raw) || [];
      // add to notifications list
      setNotifications(prev => {
        const merged = [...items.map(i => ({ ...i, local: true })), ...prev];
        return merged;
      });

      // schedule timers for pending reminders
      items.forEach(it => {
        if (!it.fired) scheduleLocalTrigger(it);
      });
    } catch (err) {
      console.error('Error loading local reminders', err);
    }
  };

  const scheduleLocalTrigger = (reminder) => {
    const when = new Date(reminder.date).getTime();
    const ms = when - Date.now();
    if (ms <= 0) return triggerLocalReminder(reminder);
    setTimeout(() => triggerLocalReminder(reminder), ms);
  };

  const triggerLocalReminder = (reminder) => {
    // show toast and push to notifications
    try {
      setNotifications(prev => [{ id: reminder.id, type: 'reminder', createdAt: new Date().toISOString(), meta: { text: reminder.text }, local: true }, ...prev]);
      toast(`Lembrete: ${reminder.text}`, { icon: '⏰' });
    } catch (err) {}
    try {
      // mark fired in localStorage
      const raw = localStorage.getItem('localReminders');
      if (!raw) return;
      const items = JSON.parse(raw) || [];
      const updated = items.map(i => i.id === reminder.id ? { ...i, fired: true } : i);
      localStorage.setItem('localReminders', JSON.stringify(updated));
    } catch (err) {}
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Load capsules based on scope
      const capsulesRes = await capsuleAPI.getAll(capsuleScope === 'public' ? { scope: 'public' } : {});
      setCapsules(capsulesRes.data.capsules || []);
      
      // Load categories - SEMPRE carregar as categorias do usuário
      const categoriesRes = await categoryAPI.getAll();
      setCategories(categoriesRes.data.categories || []);
      
      // Load tags
      const tagsRes = await tagAPI.getAll();
      setTags(tagsRes.data.tags || []);
      
      // Load statistics (apenas para minhas cápsulas)
      if (capsuleScope === 'mine') {
        const statsRes = await capsuleAPI.getStatistics();
        setStatistics(statsRes.data.statistics);
      }
      
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
      await loadAllData();
      
      resetForm();
    } catch (error) {
      console.error('Error saving capsule:', error);
      alert('Erro ao salvar cápsula: ' + (error.response?.data?.message || error.message));
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
      setCategoryColor('#e2b714');
      setShowCategoryForm(false);
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Erro ao criar categoria: ' + (error.response?.data?.message || error.message));
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

  const handleDelete = async (capsuleId) => {
    setLoading(true);
    try {
      await capsuleAPI.delete(capsuleId);
      await loadAllData();
      setShowDeleteConfirm(false);
      setCapsuleToDelete(null);
      if (selectedCapsule?.id === capsuleId) setSelectedCapsule(null);
    } catch (error) {
      console.error('Error deleting capsule:', error);
      const message = (error?.response?.data?.message) || error?.message || 'Erro ao excluir a cápsula. Tente novamente.';
      alert(message);
      if (error?.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (id) => {
    try {
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

  const goToUserProfile = () => {
    if (user?.id) {
      navigate(`/profile/${user.id}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleScheduleSave = async () => {
    if (!reminderTextLocal || !reminderDateLocal) return alert('Preencha texto e data.');
    const id = 'local-' + Date.now();
    const obj = { id, text: reminderTextLocal, date: reminderDateLocal, fired: false };
    try {
      const raw = localStorage.getItem('localReminders');
      const items = raw ? JSON.parse(raw) : [];
      items.push(obj);
      localStorage.setItem('localReminders', JSON.stringify(items));
      scheduleLocalTrigger(obj);

      // If user chose to notify community, call backend schedule placeholder
      if (notifyCommunity) {
        try {
          await notificationAPI.schedule({ userId: user?.id, remindAt: obj.date, meta: { text: obj.text } });
        } catch (err) {
          console.warn('Backend scheduling not available or failed', err);
        }
      }

      setShowScheduleModal(false);
      setReminderTextLocal('');
      setReminderDateLocal('');
      setNotifyCommunity(false);
      // Inform user
      setNotifications(prev => [{ id, type: 'reminder-scheduled', createdAt: new Date().toISOString(), meta: { text: obj.text, date: obj.date }, local: true }, ...prev]);
    } catch (err) {
      console.error('Erro ao salvar lembrete local', err);
    }
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
    if (seconds < 60) return 'agora mesmo';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `há ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `há ${hours}h`;
    const days = Math.floor(hours / 24);
    return `há ${days}d`;
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
              <button className="btn-secondary" style={{ marginLeft: 8 }} onClick={() => setShowScheduleModal(true)}>
                ⏰ Agendar lembrete
              </button>
            </div>
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
        {/* Sidebar - AGORA APENAS COM NAVEGAÇÃO */}
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
        </div>
        
        {/* Área Principal */}
        <div className="dashboard-main">
          {/* Schedule Reminder Modal */}
          {showScheduleModal && (
            <div className="modal-overlay">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="modal-card">
                <h3>⏰ Agendar Lembrete</h3>
                <div style={{ display: 'grid', gap: 8 }}>
                  <input placeholder="Texto do lembrete" value={reminderTextLocal} onChange={(e) => setReminderTextLocal(e.target.value)} className="chronicle-input" />
                  <input type="datetime-local" value={reminderDateLocal} onChange={(e) => setReminderDateLocal(e.target.value)} className="chronicle-input" />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={notifyCommunity} onChange={(e) => setNotifyCommunity(e.target.checked)} />
                    <span style={{ color: '#94a3b8', fontSize: 13 }}>Notificar comunidade (se suportado pelo backend)</span>
                  </label>
                </div>
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button className="chronicle-button" onClick={handleScheduleSave}>Salvar</button>
                  <button className="btn-secondary" onClick={() => setShowScheduleModal(false)}>Cancelar</button>
                </div>
              </motion.div>
            </div>
          )}
          {/* Cápsulas */}
          {activeTab === 'capsules' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="chronicle-card main-card"
            >
              <div className="card-header">
                <h2>
                  {capsuleScope === 'mine' ? 'Suas Cápsulas Temporais' : 'Cápsulas Públicas da Comunidade'}
                </h2>
                <div className="card-actions">
                  {/* Toggle entre Minhas Cápsulas e Cápsulas Públicas */}
                  <div className="scope-toggle" style={{ marginRight: '12px' }}>
                    <button 
                      className={`scope-btn ${capsuleScope === 'mine' ? 'active' : ''}`}
                      onClick={() => setCapsuleScope('mine')}
                    >
                      Minhas
                    </button>
                    <button 
                      className={`scope-btn ${capsuleScope === 'public' ? 'active' : ''}`}
                      onClick={() => setCapsuleScope('public')}
                    >
                      Públicas
                    </button>
                  </div>
                  
                  <button
                    onClick={() => navigate('/create')}
                    className="chronicle-button"
                  >
                    Nova Cápsula
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
              {showForm && capsuleScope === 'mine' && (
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
                        {categories.length === 0 ? (
                          <div className="no-categories">
                            <small style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>
                              Nenhuma categoria encontrada. 
                              <button 
                                type="button" 
                                className="link-btn" 
                                onClick={() => setShowCategoryForm(true)}
                                style={{ marginLeft: '4px', color: '#e2b714', textDecoration: 'underline', cursor: 'pointer' }}
                              >
                                Criar categoria
                              </button>
                            </small>
                            <select disabled className="chronicle-input">
                              <option>— Nenhuma disponível —</option>
                            </select>
                          </div>
                        ) : (
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
                        )}
                        {categories.length > 0 && (
                          <button 
                            type="button" 
                            className="link-btn" 
                            onClick={() => setShowCategoryForm(true)}
                            style={{ marginTop: '8px', fontSize: '12px', color: '#e2b714' }}
                          >
                            + Adicionar nova categoria
                          </button>
                        )}
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
                      
                      {/* NOVO: Toggle Público/Privado */}
                      <div className="form-group full-width">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={!isPrivate}
                            onChange={(e) => setIsPrivate(!e.target.checked)}
                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                          />
                          <span>Tornar esta cápsula pública após desbloqueio</span>
                        </label>
                        <small style={{ display: 'block', marginTop: '4px', color: '#94a3b8' }}>
                          {isPrivate 
                            ? '🔒 Esta cápsula será privada - apenas você poderá vê-la' 
                            : '🌍 Esta cápsula será pública após desbloqueio - outros usuários poderão vê-la'
                          }
                        </small>
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
              
              {/* Modal para criar categoria */}
              {showCategoryForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="capsule-form"
                  style={{ marginTop: '16px', padding: '16px', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '8px' }}
                >
                  <h4>Nova Categoria</h4>
                  <form onSubmit={handleCategorySubmit}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Nome da Categoria</label>
                        <input
                          type="text"
                          value={categoryName}
                          onChange={(e) => setCategoryName(e.target.value)}
                          required
                          className="chronicle-input"
                          placeholder="Ex: Projetos, Pessoal..."
                        />
                      </div>
                      <div className="form-group">
                        <label>Cor</label>
                        <input
                          type="color"
                          value={categoryColor}
                          onChange={(e) => setCategoryColor(e.target.value)}
                          className="color-input"
                        />
                      </div>
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="chronicle-button">Criar Categoria</button>
                      <button type="button" onClick={() => setShowCategoryForm(false)} className="btn-secondary">
                        Cancelar
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
              
              {/* Lista de Cápsulas */}
              <div className="capsules-grid">
                {filteredCapsules.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    <p>
                      {capsuleScope === 'mine' 
                        ? 'Você ainda não tem cápsulas. Crie sua primeira!' 
                        : 'Nenhuma cápsula pública disponível no momento.'
                      }
                    </p>
                  </div>
                )}
                {filteredCapsules.map((capsule) => {
                  const isMyOwnCapsule = capsule.creatorId === user?.id;
                  
                  return (
                    <div 
                      key={capsule.id} 
                      className="capsule-card"
                      style={{ borderLeftColor: capsule.color }}
                      onClick={() => setSelectedCapsule(capsule)}
                    >
                      <div className="capsule-header">
                        <div className="capsule-icon">
                          <img
                            src={capsule.metadata?.authorAvatar}
                            alt={`Avatar de ${capsule.metadata?.author}`}
                            className="avatar avatar-sm"
                            onError={(e) => { 
                              e.target.onerror = null; 
                              e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${capsule.creatorId || capsule.creator?.id || 'user'}`; 
                            }}
                          />
                        </div>
                        <div className="capsule-info">
                          <h3>{capsule.title}</h3>
                          <span className="capsule-author">
                            Por {capsule.metadata?.author}
                            {isMyOwnCapsule && ' (Você)'}
                          </span>
                        </div>
                        {isMyOwnCapsule && (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(capsule.id); }}
                            className={`favorite-btn ${(capsule.isFavorited || capsule.isFavorite) ? 'active' : ''}`}
                          >
                            {(capsule.isFavorited || capsule.isFavorite) ? '★' : '☆'}
                          </button>
                        )}
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
                          {capsule.isUnlocked ? '🔓 Desbloqueada' : '🔒 Bloqueada'}
                        </span>
                        {!capsule.isPrivate && (
                          <span className="tag" style={{ background: '#1f7a8c' }}>
                            🌍 Pública
                          </span>
                        )}
                      </div>
                      
                      <div className="capsule-details">
                        <div className="detail">
                          <span>Desbloqueia:</span>
                          <strong>{new Date(capsule.unlockDate).toLocaleDateString('pt-PT')}</strong>
                        </div>
                        <div className="detail">
                          <span>Visualizações:</span>
                          <strong>{capsule.viewCount || 0}</strong>
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
                      
                      {isMyOwnCapsule && (
                        <div className="capsule-actions">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/reveal/${capsule.id}`); }}
                            className="chronicle-button"
                          >
                            Abrir
                          </button>
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
                      )}
                    </div>
                  );
                })}
              </div>
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
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <h3>{capsules.length}</h3>
                    <p>Cápsulas Totais</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🔒</div>
                  <div className="stat-content">
                    <h3>{capsules.filter(c => !c.isUnlocked).length}</h3>
                    <p>Bloqueadas</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🔓</div>
                  <div className="stat-content">
                    <h3>{capsules.filter(c => c.isUnlocked).length}</h3>
                    <p>Desbloqueadas</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">👁️</div>
                  <div className="stat-content">
                    <h3>{capsules.reduce((sum, c) => sum + (c.viewCount || 0), 0)}</h3>
                    <p>Visualizações</p>
                  </div>
                </div>
              </div>
              
              {/* Gráficos adicionais de estatísticas */}
              {statistics && (
                <div className="advanced-stats">
                  <h3>Estatísticas Avançadas</h3>
                  <div className="charts-grid">
                    <div className="chart-container">
                      <h4>Desbloqueios por Mês</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={statistics.unlocksByMonth || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="month" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
                            labelStyle={{ color: '#e2b714' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="count" 
                            stroke="#e2b714" 
                            fill="#e2b714" 
                            fillOpacity={0.3} 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="chart-container">
                      <h4>Distribuição por Categoria</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={statistics.categories || []}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => entry.name}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {(statistics.categories || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || '#e2b714'} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
          
          {/* Viagem Temporal - ESTILO ATUALIZADO */}
          {activeTab === 'time-travel' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="chronicle-card main-card"
            >
              <div className="time-travel-header">
                <h2>🌌 Viagem Temporal</h2>
                <p className="card-subtitle">Explore o futuro e descubra cápsulas que serão desbloqueadas</p>
              </div>
              
              <div className="time-travel-machine">
                <div className="time-selector">
                  <div className="time-input-wrapper">
                    <input
                      type="datetime-local"
                      value={timeTravelDate}
                      onChange={(e) => setTimeTravelDate(e.target.value)}
                      className="chronicle-input"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                  
                  <div className="time-machine-display">
                    <div className="time-display-value">
                      {timeTravelDate 
                        ? new Date(timeTravelDate).toLocaleDateString('pt-PT', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '--/--/---- --:--'}
                    </div>
                  </div>
                  
                  <div className="time-machine-controls">
                    <button 
                      onClick={performTimeTravel}
                      className="chronicle-button"
                      disabled={!timeTravelDate}
                    >
                      🚀 Iniciar Viagem
                    </button>
                  </div>
                </div>
              </div>
              
              {showTimeTravel && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="time-travel-results"
                >
                  <h3 className="section-title">⚡ Cápsulas Encontradas</h3>
                  <p style={{ color: '#94a3b8', marginBottom: '30px' }}>
                    {timeTravelResults.length > 0 
                      ? `Encontradas ${timeTravelResults.length} cápsulas que seriam desbloqueadas nesta data:`
                      : 'Nenhuma cápsula seria desbloqueada nesta data.'
                    }
                  </p>
                  
                  {timeTravelResults.length > 0 && (
                    <div className="time-capsules-preview">
                      {timeTravelResults.map((capsule) => (
                        <div key={capsule.id} className="time-capsule-card">
                          <div className="capsule-time-info">
                            <div className="time-badge">
                              <i>⏳</i>
                              <span>Desbloqueia: {new Date(capsule.unlockDate).toLocaleDateString('pt-PT')}</span>
                            </div>
                            <div className="time-badge">
                              <i>🎯</i>
                              <span>Viagem: {new Date(timeTravelDate).toLocaleDateString('pt-PT')}</span>
                            </div>
                          </div>
                          
                          <h3 style={{ color: '#e2b714', marginBottom: '10px' }}>{capsule.title}</h3>
                          
                          <div className="capsule-tags">
                            {capsule.category && (
                              <span className="tag" style={{ background: capsule.category.color }}>
                                {capsule.category.name}
                              </span>
                            )}
                            <span className="tag" style={{ background: '#1f7a8c' }}>
                              🚀 Viagem Temporal
                            </span>
                          </div>
                          
                          <div className="capsule-content-preview">
                            <p>{capsule.content.substring(0, 180)}...</p>
                          </div>
                          
                          <div className="time-travel-actions">
                            <button 
                              onClick={() => setSelectedCapsule(capsule)}
                              className="btn-secondary"
                              style={{ flex: 1 }}
                            >
                              👁️ Visualizar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
              
              <div style={{ marginTop: '40px', padding: '25px', background: 'rgba(226, 183, 20, 0.05)', borderRadius: '16px' }}>
                <h3 style={{ color: '#e2b714', marginBottom: '15px' }}>📖 Como funciona a Viagem Temporal?</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  <div>
                    <h4 style={{ color: '#f1f5f9', marginBottom: '8px' }}>1. Selecione uma Data</h4>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>Escolha qualquer data futura para simular uma viagem no tempo.</p>
                  </div>
                  <div>
                    <h4 style={{ color: '#f1f5f9', marginBottom: '8px' }}>2. Inicie a Viagem</h4>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>Clique em "Iniciar Viagem" para ver o que encontraria.</p>
                  </div>
                  <div>
                    <h4 style={{ color: '#f1f5f9', marginBottom: '8px' }}>3. Explore as Cápsulas</h4>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>Veja quais cápsulas estariam desbloqueadas naquela data.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Trending - ESTILO ATUALIZADO */}
          {activeTab === 'trending' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="chronicle-card main-card"
            >
              <div className="trending-header">
                <h2>📈 Trending & Tendências</h2>
                <p className="card-subtitle">Descubra o que está em alta na comunidade Time Chronicle</p>
              </div>
              
              <div className="trending-grid-modern">
                <div className="trend-card-modern">
                  <div className="trend-card-header">
                    <div className="trend-title-section">
                      <h3>🔥 Tecnologias em Alta</h3>
                      <span className="trend-category">Desenvolvimento</span>
                    </div>
                    <div className="trend-stats">
                      <div className={`trend-growth ${trendingTech.length > 0 ? 'positive' : ''}`}>
                        {trendingTech.length > 0 ? '📈 +24%' : '--'}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '20px' }}>
                    {trendingTech.length === 0 ? (
                      <p style={{ color: '#94a3b8', textAlign: 'center' }}>Carregando tendências...</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {trendingTech.slice(0, 3).map((tech, index) => (
                          <div key={tech.id || index} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px',
                            padding: '12px',
                            background: 'rgba(30, 41, 59, 0.5)',
                            borderRadius: '12px'
                          }}>
                            <div style={{ 
                              width: '32px', 
                              height: '32px', 
                              background: 'linear-gradient(135deg, #e2b714, #1f7a8c)', 
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#0f172a',
                              fontWeight: 'bold',
                              fontSize: '14px'
                            }}>
                              #{index + 1}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                marginBottom: '4px'
                              }}>
                                <span style={{ fontWeight: '600', color: '#f1f5f9' }}>
                                  {tech.name || tech.technology}
                                </span>
                                <span style={{ 
                                  fontSize: '12px', 
                                  color: '#10b981',
                                  background: 'rgba(16, 185, 129, 0.1)',
                                  padding: '2px 8px',
                                  borderRadius: '10px'
                                }}>
                                  {tech.count || '0'} cápsulas
                                </span>
                              </div>
                              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                {tech.description || 'Tecnologia popular na comunidade'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="trend-metrics">
                    <div className="metric">
                      <span className="metric-value">{trendingTech.length}</span>
                      <span className="metric-label">Tecnologias</span>
                    </div>
                    <div className="metric">
                      <span className="metric-value">{communityStats?.totalPublicCapsules || 0}</span>
                      <span className="metric-label">Cápsulas</span>
                    </div>
                    <div className="metric">
                      <span className="metric-value">{communityStats?.totalUsers || 0}</span>
                      <span className="metric-label">Usuários</span>
                    </div>
                  </div>
                </div>
                
                <div className="trend-card-modern">
                  <div className="trend-card-header">
                    <div className="trend-title-section">
                      <h3>🏆 Top da Semana</h3>
                      <span className="trend-category">Comunidade</span>
                    </div>
                    <div className="trend-stats">
                      <div className="trend-growth positive">
                        🔥 Ativo
                      </div>
                    </div>
                  </div>
                  
                  <div className="leaderboard-modern" style={{ marginTop: '20px' }}>
                    <div className="leaderboard-header-modern">
                      <span>Posição</span>
                      <span>Usuário</span>
                      <span>Cápsulas</span>
                      <span>Pontos</span>
                    </div>
                    <div className="leaderboard-list-modern">
                      {leaderboard.length === 0 ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                          Carregando leaderboard...
                        </div>
                      ) : (
                        leaderboard.slice(0, 5).map((user, index) => (
                          <div key={user.id} className="leaderboard-item-modern">
                            <div className="leaderboard-rank">
                              <span className={`${index < 3 ? 'top-rank' : ''}`}>
                                #{index + 1}
                              </span>
                            </div>
                            <div className="leaderboard-user-modern">
                              <div className="user-avatar-modern">
                                {user.username?.substring(0, 2).toUpperCase() || 'US'}
                              </div>
                              <div className="user-info-modern">
                                <strong>{user.username}</strong>
                                <span>{user.bio || 'Explorador Temporal'}</span>
                              </div>
                            </div>
                            <div className="leaderboard-capsules">
                              {user.capsuleCount || 0}
                            </div>
                            <div className="leaderboard-score">
                              {user.score || 0}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="leaderboard-section">
                <h3 className="section-title">🏅 Leaderboard Completo</h3>
                <div className="leaderboard-modern">
                  <div className="leaderboard-header-modern">
                    <span>Posição</span>
                    <span>Usuário</span>
                    <span>Cápsulas</span>
                    <span>Pontuação</span>
                  </div>
                  <div className="leaderboard-list-modern">
                    {leaderboard.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                        Nenhum dado disponível no momento
                      </div>
                    ) : (
                      leaderboard.map((user, index) => (
                        <div key={user.id} className="leaderboard-item-modern">
                          <div className="leaderboard-rank">
                            <span className={`${index < 3 ? 'top-rank' : ''}`}>
                              #{index + 1}
                            </span>
                          </div>
                          <div className="leaderboard-user-modern">
                            <div className="user-avatar-modern">
                              {user.username?.substring(0, 2).toUpperCase() || 'US'}
                            </div>
                            <div className="user-info-modern">
                              <strong>{user.username}</strong>
                              <span>{user.bio || 'Membro da comunidade'}</span>
                            </div>
                          </div>
                          <div className="leaderboard-capsules">
                            {user.capsuleCount || 0}
                          </div>
                          <div className="leaderboard-score">
                            {user.score || 0}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Notificações */}
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
          
          {/* Timeline */}
          {activeTab === 'timeline' && (
            <TimelineView 
              capsules={capsules} 
              onCapsuleClick={(capsule) => {
                setSelectedCapsule(capsule);
                setActiveTab('detail');
              }}
              newCapsuleId={newCapsuleId}
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
                <div className="warning-icon">⚠️</div>
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
                    disabled={loading}
                  >
                    {loading ? 'Excluindo...' : 'Excluir Cápsula'}
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
                    <img
                      src={selectedCapsule.metadata?.authorAvatar}
                      alt={`Avatar de ${selectedCapsule.metadata?.author}`}
                      className="avatar avatar-lg"
                      onError={(e) => { e.target.onerror = null; e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedCapsule.creatorId || selectedCapsule.creator?.id || 'user'}`; }}
                    />
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
                      {selectedCapsule.isUnlocked ? '🔓 Desbloqueada' : '🔒 Bloqueada'}
                    </strong>
                  </div>
                </div>
                
                <div className="detail-actions">
                  <button
                    onClick={() => toggleLike(selectedCapsule.id)}
                    className="btn-secondary"
                  >
                    ❤️ Curtir ({selectedCapsule.likes || 0})
                  </button>
                  {capsuleScope === 'mine' && (
                    <button
                      onClick={() => confirmDelete(selectedCapsule.id, selectedCapsule.title)}
                      className="btn-danger"
                    >
                      Excluir
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Dashboard;