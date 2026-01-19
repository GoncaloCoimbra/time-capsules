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
import NotificationsCenter from '../components/NotificationsCenter';
import TimelineView from '../components/TimelineView';
import Achievements from '../components/Achievements';
import DiscoverCommunity from '../components/DiscoverCommunity';
import './Dashboard.css';

//  Adiciona estes imports
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';

// Componente de Animação de Abertura de Cápsula
const UnlockAnimation = ({ capsule, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="capsule-unlock-animation">
      <div className="unlock-particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div 
            key={i}
            className="unlock-particle"
            style={{
              '--tx': `${Math.cos(i * 18) * 100}px`,
              '--ty': `${Math.sin(i * 18) * 100}px`,
              animationDelay: `${i * 0.05}s`
            }}
          />
        ))}
      </div>
      <div className="unlock-content">
        <h3>{capsule?.title || "Cápsula Desbloqueada!"}</h3>
        <div className="unlock-sparkle">✨</div>
      </div>
    </div>
  );
};

// Componente de Modal de Pré-visualização
const PreviewModal = ({ 
  show, 
  onClose, 
  data, 
  onConfirm 
}) => {
  if (!show || !data) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="chronicle-card modal-card preview-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="modal-close">×</button>
        
        <div className="preview-header">
          <h2>🔍 Pré-visualização da Cápsula</h2>
          <p className="preview-subtitle">Revê os detalhes antes de selar</p>
        </div>
        
        <div className="preview-content">
          <div className="preview-section">
            <h3 style={{ color: '#e2b714', marginBottom: '8px' }}>{data.title}</h3>
            <p style={{ color: '#94a3b8', marginBottom: '16px' }}>{data.content}</p>
          </div>
          
          <div className="preview-details">
            <div className="preview-detail">
              <span>📅 Data de Desbloqueio:</span>
              <strong>{new Date(data.unlockDate).toLocaleDateString('pt-PT', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</strong>
            </div>
            
            {data.category && (
              <div className="preview-detail">
                <span>🏷️ Categoria:</span>
                <span className="tag" style={{ background: data.category.color }}>
                  {data.category.name}
                </span>
              </div>
            )}
            
            {data.tags && data.tags.length > 0 && (
              <div className="preview-detail">
                <span>🏷️ Etiquetas:</span>
                <div className="tags-container">
                  {data.tags.map(tag => (
                    <span key={tag.id} className="tag secondary">
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="preview-notice">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚠️</span>
              <span>Após selar, a cápsula só poderá ser aberta na data especificada.</span>
            </div>
          </div>
        </div>
        
        <div className="preview-actions">
          <button onClick={onConfirm} className="chronicle-button">
             Confirmar e Selar
          </button>
          <button onClick={onClose} className="btn-secondary">
            ✏️ Editar Detalhes
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

function Dashboard() {
  //  Adicione o hook de tradução
  const { t } = useTranslation();
  
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
  const [trendingTechs, setTrendingTechs] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  // Trending capsules (tab)
  const [trendingCapsules, setTrendingCapsules] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
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

  // Animação local de desbloqueio (simples): lista de IDs que acabaram de desbloquear
  const [recentlyUnlocked, setRecentlyUnlocked] = useState([]);
  const seenUnlockedRef = useRef(new Set());
  const firstLoadRef = useRef(true);
  const [timeTravelResults, setTimeTravelResults] = useState([]);
  const [showTimeTravel, setShowTimeTravel] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [capsuleScope, setCapsuleScope] = useState('mine'); // 'mine' ou 'public'
  const [newCapsuleId, setNewCapsuleId] = useState(null);
  
  // Delete confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [capsuleToDelete, setCapsuleToDelete] = useState(null);
  
 
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);
  const [animationCapsule, setAnimationCapsule] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'dark';
  });
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const secondHandRef = useRef(null);

  // Atualizar tema no body
  useEffect(() => {
    document.body.classList.toggle('light-mode', theme === 'light');
  }, [theme]);

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

  // Detectar cápsulas que acabaram de desbloquear e animar localmente
  useEffect(() => {
    // Na primeira carga, marcar já vistos como 'visto' sem animar
    if (firstLoadRef.current) {
      capsules.forEach(c => {
        const id = c.id;
        const unlocked = c.isUnlocked || new Date(c.unlockDate) <= currentTime;
        if (unlocked) seenUnlockedRef.current.add(id);
      });
      firstLoadRef.current = false;
      return;
    }

    // Detectar novos desbloqueios enquanto o usuário permanece na página
    capsules.forEach(c => {
      const id = c.id;
      const unlocked = c.isUnlocked || new Date(c.unlockDate) <= currentTime;
      if (unlocked && !seenUnlockedRef.current.has(id)) {
        // novo desbloqueio - animar
        seenUnlockedRef.current.add(id);
        setRecentlyUnlocked(prev => [...prev, id]);
        
        // Mostrar animação de abertura
        setAnimationCapsule(c);
        setShowUnlockAnimation(true);
        
        // Remover animação após 3s
        setTimeout(() => {
          setShowUnlockAnimation(false);
          setRecentlyUnlocked(prev => prev.filter(x => x !== id));
        }, 3000);
      }
    });
  }, [capsules, currentTime]);

  // Toggle Dark/Light Mode
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', newTheme);
  };

  // Export capsules
  const exportCapsules = () => {
    const data = JSON.stringify(capsules, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `capsules-backup-${Date.now()}.json`;
    a.click();
    toast.success(t('dashboard.exportSuccess'));
  };

  // Import capsules
  const importCapsules = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        
        // Verificar se é um array
        if (!Array.isArray(imported)) {
          toast.error(t('dashboard.invalidFileFormat'));
          return;
        }
        
        // Processar e importar cápsulas
        const importPromises = imported.map(async (capsule) => {
          try {
            // Remover IDs existentes para evitar conflitos
            const { id, createdAt, updatedAt, ...capsuleData } = capsule;
            
            // Se a cápsula já existe (mesmo título e data), pular
            const exists = capsules.find(c => 
              c.title === capsule.title && 
              c.unlockDate === capsule.unlockDate
            );
            
            if (!exists) {
              await capsuleAPI.create(capsuleData);
            }
          } catch (error) {
            console.error('Erro ao importar cápsula:', error);
          }
        });
        
        await Promise.all(importPromises);
        
        // Recarregar dados
        await loadAllData();
        
        toast.success(t('dashboard.importSuccess', { count: imported.length }));
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        toast.error(t('dashboard.importError'));
      }
    };
    reader.readAsText(file);
    
    // Resetar input
    event.target.value = '';
  };

  // Preview before sealing
  const handlePreviewBeforeSealing = () => {
    if (!title || !content || !unlockDate) {
      toast.error(t('dashboard.fillRequiredFields'));
      return;
    }
    
    setPreviewData({
      title,
      content,
      unlockDate,
      category: categories.find(c => c.id === categoryId),
      tags: tags.filter(t => selectedTags.includes(t.id)),
      isPrivate,
      color
    });
    setShowPreview(true);
  };

  // Confirmar criação após preview
  const handleConfirmSave = async () => {
    setShowPreview(false);
    setLoading(true);
    
    try {
      const capsuleData = {
        title: previewData.title,
        content: previewData.content,
        unlockDate: previewData.unlockDate,
        categoryId: previewData.category ? previewData.category.id : null,
        isPrivate: previewData.isPrivate,
        color: previewData.color,
        reminder,
        tags: previewData.tags.map(t => t.id)
      };

      if (editingId) {
        await capsuleAPI.update(editingId, capsuleData);
        toast.success(t('dashboard.updateSuccess'));
      } else {
        await capsuleAPI.create(capsuleData);
        toast.success(t('dashboard.createSuccess'));
      }
      
      // Reload capsules
      await loadAllData();
      
      resetForm();
    } catch (error) {
      console.error('Error saving capsule:', error);
      toast.error(t('dashboard.saveError', { error: error.response?.data?.message || error.message }));
    } finally {
      setLoading(false);
    }
  };

  // Load data from API
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
    loadAllData();
    loadLocalReminders();
  }, [capsuleScope]);

  // Helpers to compute trends and leaderboard locally from capsule list
  const computeTrendingTagsFromCapsules = (capsules) => {
    const counts = {};
    capsules.forEach(c => {
      (c.tags || []).forEach(t => {
        const key = t.name || t.id || t;
        counts[key] = (counts[key] || 0) + 1;
      });
    });
    const arr = Object.keys(counts).map(k => ({ name: k, mentions: counts[k] }));
    arr.sort((a,b) => b.mentions - a.mentions);
    return arr.slice(0, 10);
  };

  const computeLeaderboardFromCapsules = (capsules) => {
    const map = {};
    capsules.forEach(c => {
      const id = c.creatorId || c.creator?.id || c.User?.id;
      if (!id) return;
      if (!map[id]) map[id] = { creatorId: id, user: c.creator || c.User || null, totalCapsules: 0 };
      map[id].totalCapsules += 1;
    });
    const arr = Object.values(map).sort((a,b) => b.totalCapsules - a.totalCapsules).slice(0, 10);
    return arr;
  };

  // Load trending when the Trending tab is active
  const loadTrending = async () => {
    try {
      setTrendingLoading(true);
      setLeaderboardLoading(true);

      // Primary source: server trending public capsules
      const res = await communityAPI.explorePublic({ sort: 'trending', limit: 50 });
      let capsules = res.data?.capsules || [];
      setTrendingCapsules(capsules);

      if (!capsules || capsules.length === 0) {
        // fallback to recent public capsules
        const fallback = await communityAPI.explorePublic({ sort: 'recent', limit: 50 });
        capsules = fallback.data?.capsules || [];
        setTrendingCapsules(capsules);
      }

      // Try server-side trending techs; if empty compute locally from capsules
      try {
        const techRes = await communityAPI.getTrendingTechs();
        const techs = techRes.data?.trending || [];
        if (!techs || techs.length === 0) {
          const computed = computeTrendingTagsFromCapsules(capsules);
          console.log('Fallback: computed trending techs from fetched capsules', computed);
          setTrendingTechs(computed);
        } else {
          setTrendingTechs(techs);
        }
      } catch (err) {
        console.error('Erro ao carregar tecnologias em alta:', err);
        setTrendingTechs(computeTrendingTagsFromCapsules(capsules));
      }

      // Try server-side leaderboard; if empty compute locally from capsules
      try {
        const lbRes = await communityAPI.getLeaderboard({ type: 'capsules' });
        const lb = lbRes.data?.leaderboard || [];
        if (!lb || lb.length === 0) {
          const computedLb = computeLeaderboardFromCapsules(capsules);
          console.log('Fallback: computed leaderboard from fetched capsules', computedLb);
          setLeaderboardData(computedLb);
        } else {
          setLeaderboardData(lb);
        }
      } catch (err) {
        console.error('Erro ao carregar leaderboard:', err);
        setLeaderboardData(computeLeaderboardFromCapsules(capsules));
      }

    } catch (err) {
      console.error('Erro ao carregar trending (Dashboard):', err);
    } finally {
      setTrendingLoading(false);
      setLeaderboardLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'trending') loadTrending();
  }, [activeTab]);

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

  useEffect(() => {
    filterAndSortCapsules();
  }, [capsules, filter, searchTerm, sortBy, showFavoritesOnly, currentTime]);

  const filterAndSortCapsules = () => {
    let filtered = [...capsules];
    const isLocallyUnlocked = (c) => c.isUnlocked || new Date(c.unlockDate) <= currentTime;
    if (showFavoritesOnly) filtered = filtered.filter(c => c.isFavorite);
    if (filter === 'locked') filtered = filtered.filter(c => !isLocallyUnlocked(c));
    else if (filter === 'unlocked') filtered = filtered.filter(c => isLocallyUnlocked(c));
    
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
    handlePreviewBeforeSealing();
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
      toast.success(t('dashboard.categoryCreateSuccess'));
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error(t('dashboard.categoryCreateError', { error: error.response?.data?.message || error.message }));
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
      toast.success(t('dashboard.tagCreateSuccess'));
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error(t('dashboard.tagCreateError', { error: error.response?.data?.message || error.message }));
    }
  };

  const handleEdit = (capsule) => {
    setEditingId(capsule.id);
    setTitle(capsule.title);
    setContent(capsule.content);
    setUnlockDate(toLocalDatetimeInput(capsule.unlockDate));
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
      toast.success(t('dashboard.deleteSuccess'));
    } catch (error) {
      console.error('Error deleting capsule:', error);
      const message = (error?.response?.data?.message) || error?.message || t('dashboard.deleteError');
      toast.error(message);
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
      
      toast.success(fav ? t('dashboard.addedToFavorites') : t('dashboard.removedFromFavorites'));
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
      toast.success(t('dashboard.commentAdded'));
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error(t('dashboard.commentError'));
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
      toast.success(t('dashboard.likeUpdated'));
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error(t('dashboard.likeError'));
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
    if (!reminderTextLocal || !reminderDateLocal) {
      toast.error(t('dashboard.fillReminderFields'));
      return;
    }
    
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
      toast.success(t('dashboard.reminderScheduled'));
    } catch (err) {
      console.error('Erro ao Guardar lembrete local', err);
      toast.error(t('dashboard.reminderError'));
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

  // Formata uma Date/valor para o formato aceito por <input type="datetime-local"> no fuso local
  const toLocalDatetimeInput = (value) => {
    const d = new Date(value);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return t('time.justNow');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return t('time.minutesAgo', { minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('time.hoursAgo', { hours });
    const days = Math.floor(hours / 24);
    return t('time.daysAgo', { days });
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
      
      {/* Animação de desbloqueio */}
      {showUnlockAnimation && animationCapsule && (
        <UnlockAnimation
          capsule={animationCapsule}
          onComplete={() => setShowUnlockAnimation(false)}
        />
      )}
      
      {/* Modal de Preview */}
      <PreviewModal
        show={showPreview}
        onClose={() => setShowPreview(false)}
        data={previewData}
        onConfirm={handleConfirmSave}
      />
      
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
      
      {/* Header - CORRIGIDO PARA LANGUAGE SELECTOR VISÍVEL */}
      <div className="dashboard-header" style={{ position: 'relative', zIndex: 1000, overflow: 'visible' }}>
        <div className="header-left">
          <div className="time-glyph"> 
            <div className="glyph-circle">
              <div className="glyph-hand hour"></div>
              <div className="glyph-hand minute"></div>
            </div>
          </div>
          <div className="header-text">
            <h1 className="chronicle-title">Time Chronicle</h1>
            <p className="chronicle-subtitle">{t('dashboard.title')}</p>
          </div>
        </div>
        
        <div className="header-right" style={{ position: 'relative', zIndex: 1000 }}>
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
          
          {/*  LanguageSelector CORRETAMENTE POSICIONADO */}
          <div style={{ position: 'relative', zIndex: 10000 }}>
            <LanguageSelector />
          </div>

          <button onClick={() => navigate('/landing')} className="landing-button" title="Landing">
            Landing
          </button>
          
          {/* Toggle de Tema com Ícones SVG */}
          <button onClick={toggleTheme} className="theme-toggle" title={t('dashboard.toggleTheme')}>
            <span className="theme-icon sun">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41.39.39 1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41.39.39 1.03.39 1.41 0l1.06-1.06z"/>
              </svg>
            </span>
            <span className="theme-icon moon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
              </svg>
            </span>
          </button>
          
          <div className="user-info">
            <div className="notifications">
              <button className="notif-btn" onClick={() => setActiveTab('notifications')}>
                🔔 {notifications.filter(n => !n.read).length}
              </button>
              <button className="btn-schedule" onClick={() => setShowScheduleModal(true)}>
                <span className="btn-schedule-icon">⏰</span>
                {t('dashboard.scheduleReminder')}
              </button>
            </div>
            <div className="user-avatar" onClick={goToUserProfile} style={{ cursor: 'pointer' }} title={t('dashboard.viewProfile')}>
              {user?.username?.substring(0, 2).toUpperCase() || 'US'}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.username || 'User'}</span>
              <span className="user-role">{t('dashboard.timeTraveler')}</span>
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
              <span>{t('sidebar.capsules')}</span>
            </button>
            
            <button 
              className={`nav-item ${activeTab === 'statistics' ? 'active' : ''}`}
              onClick={() => setActiveTab('statistics')}
            >
              <svg className="nav-icon" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
              </svg>
              <span>{t('sidebar.statistics')}</span>
            </button>
            
            <button 
              className={`nav-item ${activeTab === 'time-travel' ? 'active' : ''}`}
              onClick={() => setActiveTab('time-travel')}
            >
              <svg className="nav-icon" viewBox="0 0 24 24">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
              </svg>
              <span>{t('sidebar.timeTravel')}</span>
            </button>

            <button 
              className={`nav-item ${activeTab === 'timeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              <svg className="nav-icon" viewBox="0 0 24 24">
                <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
              </svg>
              <span>{t('sidebar.timeline')}</span>
            </button>
            
            <button 
              className={`nav-item ${activeTab === 'trending' ? 'active' : ''}`}
              onClick={() => setActiveTab('trending')}
            >
              <svg className="nav-icon" viewBox="0 0 24 24">
                <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
              </svg>
              <span>{t('sidebar.trending')}</span>
            </button>

            <button 
              className={`nav-item ${activeTab === 'achievements' ? 'active' : ''}`}
              onClick={() => setActiveTab('achievements')}
            >
              <svg className="nav-icon" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span>{t('sidebar.achievements')}</span>
            </button>

            <button 
              className={`nav-item ${activeTab === 'community' ? 'active' : ''}`}
              onClick={() => setActiveTab('community')}
            >
              <svg className="nav-icon" viewBox="0 0 24 24">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
              <span>{t('sidebar.community')}</span>
            </button>
            
            {/* Botões de Export/Import */}
            <div className="sidebar-divider"></div>
            
            <button 
              className="nav-item"
              onClick={exportCapsules}
              title={t('dashboard.exportTooltip')}
            >
              <svg className="nav-icon" viewBox="0 0 24 24">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
              <span>{t('dashboard.export')}</span>
            </button>

            <button 
              className="nav-item"
              onClick={() => document.getElementById('import-input').click()}
              title={t('dashboard.importTooltip')}
            >
              <input
                id="import-input"
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={importCapsules}
              />
              <svg className="nav-icon" viewBox="0 0 24 24">
                <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
              </svg>
              <span>{t('dashboard.import')}</span>
            </button>
          </nav>
        </div>
        
        {/* Área Principal */}
        <div className="dashboard-main">
          {/* Schedule Reminder Modal */}
          {showScheduleModal && (
            <div className="modal-overlay">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="modal-card">
                <h3>⏰ {t('dashboard.scheduleReminder')}</h3>
                <div style={{ display: 'grid', gap: 8 }}>
                  <input 
                    placeholder={t('dashboard.reminderTextPlaceholder')} 
                    value={reminderTextLocal} 
                    onChange={(e) => setReminderTextLocal(e.target.value)} 
                    className="chronicle-input" 
                  />
                  <input 
                    type="datetime-local" 
                    value={reminderDateLocal} 
                    onChange={(e) => setReminderDateLocal(e.target.value)} 
                    className="chronicle-input" 
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={notifyCommunity} onChange={(e) => setNotifyCommunity(e.target.checked)} />
                    <span style={{ color: '#94a3b8', fontSize: 13 }}>{t('dashboard.notifyCommunity')}</span>
                  </label>
                </div>
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button className="chronicle-button" onClick={handleScheduleSave}>{t('common.save')}</button>
                  <button className="btn-secondary" onClick={() => setShowScheduleModal(false)}>{t('common.cancel')}</button>
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
                  {capsuleScope === 'mine' ? t('dashboard.myCapsules') : t('dashboard.publicCapsules')}
                </h2>
                <div className="card-actions">
                  {/* Toggle entre Minhas Cápsulas e Cápsulas Públicas */}
                  <div className="scope-toggle" style={{ marginRight: '12px' }}>
                    <button 
                      className={`scope-btn ${capsuleScope === 'mine' ? 'active' : ''}`}
                      onClick={() => setCapsuleScope('mine')}
                    >
                      {t('dashboard.mine')}
                    </button>
                    <button 
                      className={`scope-btn ${capsuleScope === 'public' ? 'active' : ''}`}
                      onClick={() => setCapsuleScope('public')}
                    >
                      {t('dashboard.public')}
                    </button>
                  </div>
                  
                  <button
                    onClick={() => navigate('/create')}
                    className="chronicle-button"
                  >
                    {t('dashboard.newCapsule')}
                  </button>
                  <div className="search-container">
                    <svg className="search-icon" viewBox="0 0 24 24">
                      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                    <input
                      type="text"
                      placeholder={t('dashboard.searchPlaceholder')}
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
                  <h3>{editingId ? t('dashboard.editCapsule') : t('dashboard.createCapsule')}</h3>
                  <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>{t('dashboard.title')}</label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                          className="chronicle-input"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>{t('dashboard.unlockDate')}</label>
                        <input
                          type="datetime-local"
                          value={unlockDate}
                          onChange={(e) => setUnlockDate(e.target.value)}
                          required
                          className="chronicle-input"
                        />
                      </div>
                      
                      <div className="form-group full-width">
                        <label>{t('dashboard.content')}</label>
                        <textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          required
                          rows="4"
                          className="chronicle-input"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>{t('dashboard.category')}</label>
                        {categories.length === 0 ? (
                          <div className="no-categories">
                            <small style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>
                              {t('dashboard.noCategories')}
                              <button 
                                type="button" 
                                className="link-btn" 
                                onClick={() => setShowCategoryForm(true)}
                                style={{ marginLeft: '4px', color: '#e2b714', textDecoration: 'underline', cursor: 'pointer' }}
                              >
                                {t('dashboard.createCategory')}
                              </button>
                            </small>
                            <select disabled className="chronicle-input">
                              <option>— {t('dashboard.noneAvailable')} —</option>
                            </select>
                          </div>
                        ) : (
                          <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="chronicle-input"
                          >
                            <option value="">{t('common.select')}...</option>
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
                            + {t('dashboard.addNewCategory')}
                          </button>
                        )}
                      </div>
                      
                      <div className="form-group">
                        <label>{t('dashboard.color')}</label>
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
                          <span>{t('dashboard.makePublic')}</span>
                        </label>
                        <small style={{ display: 'block', marginTop: '4px', color: '#94a3b8' }}>
                          {isPrivate 
                            ? t('dashboard.privateDescription')
                            : t('dashboard.publicDescription')
                          }
                        </small>
                      </div>
                    </div>
                    
                    <div className="form-actions">
                      <button type="submit" className="chronicle-button" disabled={loading}>
                        {loading ? t('common.saving') : (editingId ? t('dashboard.previewUpdate') : t('dashboard.previewCapsule'))}
                      </button>
                      <button type="button" onClick={resetForm} className="btn-secondary">
                        {t('common.cancel')}
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
                  <h4>{t('dashboard.newCategory')}</h4>
                  <form onSubmit={handleCategorySubmit}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>{t('dashboard.categoryName')}</label>
                        <input
                          type="text"
                          value={categoryName}
                          onChange={(e) => setCategoryName(e.target.value)}
                          required
                          className="chronicle-input"
                          placeholder={t('dashboard.categoryPlaceholder')}
                        />
                      </div>
                      <div className="form-group">
                        <label>{t('dashboard.color')}</label>
                        <input
                          type="color"
                          value={categoryColor}
                          onChange={(e) => setCategoryColor(e.target.value)}
                          className="color-input"
                        />
                      </div>
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="chronicle-button">{t('dashboard.createCategory')}</button>
                      <button type="button" onClick={() => setShowCategoryForm(false)} className="btn-secondary">
                        {t('common.cancel')}
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
                        ? t('dashboard.noCapsules')
                        : t('dashboard.noPublicCapsules')
                      }
                    </p>
                  </div>
                )}
                {filteredCapsules.map((capsule) => {
                  const isMyOwnCapsule = capsule.creatorId === user?.id;
                  const localUnlocked = capsule.isUnlocked || new Date(capsule.unlockDate) <= currentTime;
                  
                  return (
                    <div 
                      key={capsule.id} 
                      className={`capsule-card ${recentlyUnlocked.includes(capsule.id) ? 'unlocked-anim' : ''}`}
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
                            {t('dashboard.by')} {capsule.metadata?.author}
                            {isMyOwnCapsule && ` (${t('common.you')})`}
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
                        <span className={`tag ${localUnlocked ? 'unlocked' : 'locked'}`}>
                          {localUnlocked ? t('dashboard.unlocked') : t('dashboard.locked')}
                        </span>
                        {!capsule.isPrivate && (
                          <span className="tag" style={{ background: '#1f7a8c' }}>
                            🌍 {t('dashboard.public')}
                          </span>
                        )}
                      </div>
                      
                      <div className="capsule-details">
                        <div className="detail">
                          <span>{t('dashboard.unlocks')}:</span>
                          <strong>{new Date(capsule.unlockDate).toLocaleDateString('pt-PT')}</strong>
                        </div>
                        <div className="detail">
                          <span>{t('dashboard.views')}:</span>
                          <strong>{capsule.viewCount || 0}</strong>
                        </div>
                        <div className="detail">
                          <span>{t('dashboard.likes')}:</span>
                          <strong>{capsule.likes || 0}</strong>
                        </div>
                      </div>
                      
                      {localUnlocked && (
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
                            {t('common.open')}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(capsule); }}
                            className="btn-secondary"
                          >
                            {t('common.edit')}
                          </button>
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              confirmDelete(capsule.id, capsule.title);
                            }}
                            className="btn-danger"
                          >
                            {t('common.delete')}
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
              <h2>{t('dashboard.statistics')}</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <h3>{capsules.length}</h3>
                    <p>{t('dashboard.totalCapsules')}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🔒</div>
                  <div className="stat-content">
                    <h3>{capsules.filter(c => !(c.isUnlocked || new Date(c.unlockDate) <= currentTime)).length}</h3>
                    <p>{t('dashboard.locked')}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🔓</div>
                  <div className="stat-content">
                    <h3>{capsules.filter(c => (c.isUnlocked || new Date(c.unlockDate) <= currentTime)).length}</h3>
                    <p>{t('dashboard.unlocked')}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">👁️</div>
                  <div className="stat-content">
                    <h3>{capsules.reduce((sum, c) => sum + (c.viewCount || 0), 0)}</h3>
                    <p>{t('dashboard.views')}</p>
                  </div>
                </div>
              </div>
              
              {/* Gráficos adicionais de estatísticas */}
              {statistics && (
                <div className="advanced-stats">
                  <h3>{t('dashboard.advancedStatistics')}</h3>
                  <div className="charts-grid">
                    <div className="chart-container">
                      <h4>{t('dashboard.unlocksByMonth')}</h4>
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
                      <h4>{t('dashboard.categoryDistribution')}</h4>
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
                <h2>🌌 {t('dashboard.timeTravel')}</h2>
                <p className="card-subtitle">{t('dashboard.timeTravelDescription')}</p>
              </div>
              
              <div className="time-travel-machine">
                <div className="time-selector">
                  <div className="time-input-wrapper">
                    <input
                      type="datetime-local"
                      value={timeTravelDate}
                      onChange={(e) => setTimeTravelDate(e.target.value)}
                      className="chronicle-input"
                      min={toLocalDatetimeInput(new Date())}
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
                      🚀 {t('dashboard.startTravel')}
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
                  <h3 className="section-title">⚡ {t('dashboard.capsulesFound')}</h3>
                  <p style={{ color: '#94a3b8', marginBottom: '30px' }}>
                    {timeTravelResults.length > 0 
                      ? t('dashboard.capsulesFoundCount', { count: timeTravelResults.length })
                      : t('dashboard.noCapsulesFound')
                    }
                  </p>
                  
                  {timeTravelResults.length > 0 && (
                    <div className="time-capsules-preview">
                      {timeTravelResults.map((capsule) => (
                        <div key={capsule.id} className="time-capsule-card">
                          <div className="capsule-time-info">
                            <div className="time-badge">
                              <i>⏳</i>
                              <span>{t('dashboard.unlocks')}: {new Date(capsule.unlockDate).toLocaleDateString('pt-PT')}</span>
                            </div>
                            <div className="time-badge">
                              <i>🎯</i>
                              <span>{t('dashboard.travel')}: {new Date(timeTravelDate).toLocaleDateString('pt-PT')}</span>
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
                              🚀 {t('dashboard.timeTravel')}
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
                              👁️ {t('common.view')}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
              
              <div style={{ marginTop: '40px', padding: '25px', background: 'rgba(226, 183, 20, 0.05)', borderRadius: '16px' }}>
                <h3 style={{ color: '#e2b714', marginBottom: '15px' }}>📖 {t('dashboard.howItWorks')}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  <div>
                    <h4 style={{ color: '#f1f5f9', marginBottom: '8px' }}>1. {t('dashboard.selectDate')}</h4>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>{t('dashboard.selectDateDescription')}</p>
                  </div>
                  <div>
                    <h4 style={{ color: '#f1f5f9', marginBottom: '8px' }}>2. {t('dashboard.startTravel')}</h4>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>{t('dashboard.startTravelDescription')}</p>
                  </div>
                  <div>
                    <h4 style={{ color: '#f1f5f9', marginBottom: '8px' }}>3. {t('dashboard.exploreCapsules')}</h4>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>{t('dashboard.exploreCapsulesDescription')}</p>
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
                <h2>📈 {t('dashboard.trending')}</h2>
                <p className="card-subtitle">{t('dashboard.trendingDescription')}</p>
              </div>
              
              <div className="trending-grid-modern">
                <div className="trend-card-modern">
                  <div className="trend-card-header">
                    <div className="trend-title-section">
                      <h3>🔥 {t('dashboard.trendingTech')}</h3>
                      <span className="trend-category">{t('dashboard.development')}</span>
                    </div>
                    <div className="trend-stats">
                      <div className={`trend-growth ${trendingTech.length > 0 ? 'positive' : ''}`}>
                        {trendingTech.length > 0 ? '📈 +24%' : '--'}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '20px' }}>
                    {trendingTech.length === 0 ? (
                      <p style={{ color: '#94a3b8', textAlign: 'center' }}>{t('dashboard.loadingTrends')}</p>
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
                                  {tech.count || '0'} {t('dashboard.capsules')}
                                </span>
                              </div>
                              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                {tech.description || t('dashboard.popularTech')}
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
                      <span className="metric-label">{t('dashboard.technologies')}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-value">{communityStats?.totalPublicCapsules || 0}</span>
                      <span className="metric-label">{t('dashboard.capsules')}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-value">{communityStats?.totalUsers || 0}</span>
                      <span className="metric-label">{t('dashboard.users')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="trend-card-modern">
                  <div className="trend-card-header">
                    <div className="trend-title-section">
                      <h3>🏆 {t('dashboard.topOfWeek')}</h3>
                      <span className="trend-category">{t('dashboard.community')}</span>
                    </div>
                    <div className="trend-stats">
                      <div className="trend-growth positive">
                        🔥 {t('dashboard.active')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="leaderboard-modern" style={{ marginTop: '20px' }}>
                    <div className="leaderboard-header-modern">
                      <span>{t('dashboard.position')}</span>
                      <span>{t('dashboard.user')}</span>
                      <span>{t('dashboard.capsules')}</span>
                      <span>{t('dashboard.points')}</span>
                    </div>
                    <div className="leaderboard-list-modern">
                      {leaderboard.length === 0 ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                          {t('dashboard.loadingLeaderboard')}
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
                                <span>{user.bio || t('dashboard.timeExplorer')}</span>
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
                <h3 className="section-title">🏅 {t('dashboard.fullLeaderboard')}</h3>
                <div className="leaderboard-modern">
                  <div className="leaderboard-header-modern">
                    <span>{t('dashboard.position')}</span>
                    <span>{t('dashboard.user')}</span>
                    <span>{t('dashboard.capsules')}</span>
                    <span>{t('dashboard.score')}</span>
                  </div>
                  <div className="leaderboard-list-modern">
                    {leaderboard.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                        {t('dashboard.noDataAvailable')}
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
                              <span>{user.bio || t('dashboard.communityMember')}</span>
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
            <NotificationsCenter initialNotifications={notifications} onUpdate={(list) => setNotifications(list)} />
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
                <h2>{t('dashboard.deleteCapsule')}</h2>
                <p>
                  {t('dashboard.deleteConfirmation')} <strong>"{capsuleToDelete.title}"</strong>? 
                  {t('dashboard.actionCannotUndone')}
                </p>
                
                <div className="modal-actions">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="btn-secondary"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={() => handleDelete(capsuleToDelete.id)}
                    className="btn-danger"
                    disabled={loading}
                  >
                    {loading ? t('common.deleting') : t('common.delete')}
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
                      {t('dashboard.by')} {selectedCapsule.metadata?.author} • 
                      {t('dashboard.created')} {formatTimeAgo(selectedCapsule.createdAt)}
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
                    <span>{t('dashboard.unlocks')}:</span>
                    <strong>{new Date(selectedCapsule.unlockDate).toLocaleDateString()}</strong>
                  </div>
                  <div className="stat">
                    <span>{t('dashboard.views')}:</span>
                    <strong>{selectedCapsule.viewCount}</strong>
                  </div>
                  <div className="stat">
                    <span>{t('common.status')}:</span>
                    <strong className={(selectedCapsule.isUnlocked || new Date(selectedCapsule.unlockDate) <= currentTime) ? 'unlocked' : 'locked'}>
                      {(selectedCapsule.isUnlocked || new Date(selectedCapsule.unlockDate) <= currentTime) ? t('dashboard.unlocked') : t('dashboard.locked')}
                    </strong>
                  </div>
                </div>
                
                <div className="detail-actions">
                  <button
                    onClick={() => toggleLike(selectedCapsule.id)}
                    className="btn-secondary"
                  >
                    ❤️ {t('common.like')} ({selectedCapsule.likes || 0})
                  </button>
                  {capsuleScope === 'mine' && (
                    <button
                      onClick={() => confirmDelete(selectedCapsule.id, selectedCapsule.title)}
                      className="btn-danger"
                    >
                      {t('common.delete')}
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