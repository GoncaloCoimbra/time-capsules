import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

function Dashboard() {
  const [capsules, setCapsules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [filteredCapsules, setFilteredCapsules] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showTagForm, setShowTagForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isPrivate, setIsPrivate] = useState(true);
  const [color, setColor] = useState('#6366f1');
  const [reminder, setReminder] = useState(0);
  
  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState('#6366f1');
  const [tagName, setTagName] = useState('');
  
  // UI states
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('date');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('capsules');
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAll();
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  useEffect(() => {
    filterAndSortCapsules();
  }, [capsules, filter, searchTerm, sortBy, showFavoritesOnly]);

  const fetchAll = async () => {
    await Promise.all([
      fetchCapsules(),
      fetchCategories(),
      fetchTags(),
      fetchStatistics()
    ]);
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/capsules/statistics');
      setStatistics(response.data.statistics);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await api.get('/tags');
      setTags(response.data.tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchCapsules = async () => {
    try {
      const response = await api.get('/capsules');
      setCapsules(response.data.capsules);
    } catch (error) {
      console.error('Error fetching capsules:', error);
    }
  };

  const filterAndSortCapsules = () => {
    let filtered = [...capsules];

    if (showFavoritesOnly) {
      filtered = filtered.filter(c => c.isFavorite);
    }

    if (filter === 'locked') {
      filtered = filtered.filter(c => !c.isUnlocked);
    } else if (filter === 'unlocked') {
      filtered = filtered.filter(c => c.isUnlocked);
    }

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === 'unlock') {
        return new Date(a.unlockDate) - new Date(b.unlockDate);
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'views') {
        return b.viewCount - a.viewCount;
      }
      return 0;
    });

    setFilteredCapsules(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const data = { 
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
        await api.put('/capsules/' + editingId, data);
      } else {
        await api.post('/capsules', data);
      }
      
      resetForm();
      fetchAll();
    } catch (error) {
      console.error('Error saving capsule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post('/categories', { name: categoryName, color: categoryColor });
      setCategoryName('');
      setCategoryColor('#6366f1');
      setShowCategoryForm(false);
      fetchCategories();
    } catch (error) {
      console.error('Error creating category:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTagSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post('/tags', { name: tagName });
      setTagName('');
      setShowTagForm(false);
      fetchTags();
    } catch (error) {
      console.error('Error creating tag:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (capsule) => {
    setEditingId(capsule.id);
    setTitle(capsule.title);
    setContent(capsule.content);
    setUnlockDate(new Date(capsule.unlockDate).toISOString().slice(0, 16));
    setCategoryId(capsule.categoryId || '');
    setSelectedTags(capsule.tags ? capsule.tags.map(t => t.id) : []);
    setIsPrivate(capsule.isPrivate);
    setColor(capsule.color || '#6366f1');
    setReminder(capsule.reminder || 0);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this capsule?')) return;
    
    try {
      await api.delete('/capsules/' + id);
      fetchAll();
    } catch (error) {
      console.error('Error deleting capsule:', error);
    }
  };

  const toggleFavorite = async (id) => {
    try {
      await api.patch('/capsules/' + id + '/favorite');
      fetchCapsules();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/capsules/export');
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'capsules-backup-' + new Date().toISOString().split('T')[0] + '.json';
      link.click();
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setUnlockDate('');
    setCategoryId('');
    setSelectedTags([]);
    setIsPrivate(true);
    setColor('#6366f1');
    setReminder(0);
    setShowForm(false);
    setEditingId(null);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
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

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '1px solid var(--border)',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: 'var(--text-light)',
            marginBottom: '4px'
          }}>
            Time Capsules
          </h1>
          <p style={{ color: 'var(--text-gray)', fontSize: '13px' }}>
            Welcome back, {user?.username}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleExport} className="btn-info">
            Export Data
          </button>
          <button onClick={handleLogout} className="btn-secondary">
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '30px',
        borderBottom: '2px solid var(--border)',
        paddingBottom: '0'
      }}>
        <button
          onClick={() => setActiveTab('capsules')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'capsules' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'capsules' ? 'white' : 'var(--text-gray)',
            border: 'none',
            borderBottom: activeTab === 'capsules' ? '2px solid var(--primary)' : 'none',
            fontWeight: '500',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          Capsules
        </button>
        <button
          onClick={() => setActiveTab('statistics')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'statistics' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'statistics' ? 'white' : 'var(--text-gray)',
            border: 'none',
            borderBottom: activeTab === 'statistics' ? '2px solid var(--primary)' : 'none',
            fontWeight: '500',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          Statistics
        </button>
      </div>

      {/* Statistics Tab */}
      {activeTab === 'statistics' && statistics && (
        <div className="fade-in">
          {/* Stats Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px', 
            marginBottom: '30px' 
          }}>
            <div className="stat-card" style={{ borderLeft: '3px solid var(--primary)' }}>
              <div className="stat-number">{statistics.totalCapsules}</div>
              <div className="stat-label">Total Capsules</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '3px solid var(--warning)' }}>
              <div className="stat-number">{statistics.lockedCapsules}</div>
              <div className="stat-label">Locked</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '3px solid var(--success)' }}>
              <div className="stat-number">{statistics.unlockedCapsules}</div>
              <div className="stat-label">Unlocked</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '3px solid var(--info)' }}>
              <div className="stat-number">{statistics.totalViews}</div>
              <div className="stat-label">Total Views</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '3px solid var(--secondary)' }}>
              <div className="stat-number">{statistics.favoritesCount}</div>
              <div className="stat-label">Favorites</div>
            </div>
          </div>

          {/* Chart */}
          {statistics.capsulesByMonth && statistics.capsulesByMonth.length > 0 && (
            <div className="card" style={{ marginBottom: '30px' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
                Capsules Created Over Time
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statistics.capsulesByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--text-gray)" />
                  <YAxis stroke="var(--text-gray)" />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'var(--bg-card)', 
                      border: '1px solid var(--border)',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="count" fill="var(--primary)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Next Unlock */}
          {statistics.nextUnlock && (
            <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', color: 'white' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                Next Unlock
              </h3>
              <p style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
                {statistics.nextUnlock.title}
              </p>
              <p style={{ fontSize: '14px', opacity: 0.9 }}>
                {new Date(statistics.nextUnlock.unlockDate).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Capsules Tab */}
      {activeTab === 'capsules' && (
        <div className="fade-in">
          {/* Controls */}
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="btn-primary">
              {showForm ? 'Cancel' : 'New Capsule'}
            </button>
            <button onClick={() => setShowCategoryForm(!showCategoryForm)} className="btn-secondary">
              {showCategoryForm ? 'Cancel' : 'Categories'}
            </button>
            <button onClick={() => setShowTagForm(!showTagForm)} className="btn-secondary">
              {showTagForm ? 'Cancel' : 'Tags'}
            </button>
            
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '8px 14px',
                fontSize: '13px'
              }}
            />
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                background: 'var(--bg-card)',
                color: 'var(--text-light)',
                border: '2px solid var(--border)',
                borderRadius: '8px'
              }}
            >
              <option value="all">All</option>
              <option value="locked">Locked</option>
              <option value="unlocked">Unlocked</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                background: 'var(--bg-card)',
                color: 'var(--text-light)',
                border: '2px solid var(--border)',
                borderRadius: '8px'
              }}
            >
              <option value="date">Date Created</option>
              <option value="unlock">Unlock Date</option>
              <option value="title">Title</option>
              <option value="views">Views</option>
            </select>

            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={showFavoritesOnly ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 14px', fontSize: '13px' }}
            >
              {showFavoritesOnly ? '★ Favorites' : '☆ Favorites'}
            </button>

            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="btn-secondary btn-icon"
            >
              {viewMode === 'grid' ? '☰' : '▦'}
            </button>
          </div>

          {/* Category Form */}
          {showCategoryForm && (
            <div className="card fade-in" style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>Manage Categories</h3>
              <form onSubmit={handleCategorySubmit}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                  <input
                    type="text"
                    placeholder="Category name"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    required
                    style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
                  />
                  <input
                    type="color"
                    value={categoryColor}
                    onChange={(e) => setCategoryColor(e.target.value)}
                    style={{ width: '50px', height: '38px', padding: '2px', cursor: 'pointer', border: '2px solid var(--border)', borderRadius: '8px' }}
                  />
                  <button type="submit" className="btn-success" disabled={loading} style={{ padding: '8px 16px', fontSize: '13px' }}>
                    {loading ? <span className="loading"></span> : 'Add'}
                  </button>
                </div>
              </form>
              {categories.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {categories.map(cat => (
                    <span
                      key={cat.id}
                      className="badge"
                      style={{ backgroundColor: cat.color }}
                    >
                      {cat.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tag Form */}
          {showTagForm && (
            <div className="card fade-in" style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>Manage Tags</h3>
              <form onSubmit={handleTagSubmit}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                  <input
                    type="text"
                    placeholder="Tag name"
                    value={tagName}
                    onChange={(e) => setTagName(e.target.value)}
                    required
                    style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
                  />
                  <button type="submit" className="btn-success" disabled={loading} style={{ padding: '8px 16px', fontSize: '13px' }}>
                    {loading ? <span className="loading"></span> : 'Add'}
                  </button>
                </div>
              </form>
              {tags.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {tags.map(tag => (
                    <span key={tag.id} className="badge badge-info">
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Capsule Form */}
          {showForm && (
            <div className="card fade-in" style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
                {editingId ? 'Edit Capsule' : 'Create New Capsule'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gap: '14px' }}>
                  <input
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 12px', fontSize: '13px' }}
                  />
                  
                  <textarea
                    placeholder="Content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    rows="4"
                    style={{ width: '100%', padding: '10px 12px', fontSize: '13px', lineHeight: '1.5' }}
                  />
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <input
                      type="datetime-local"
                      value={unlockDate}
                      onChange={(e) => setUnlockDate(e.target.value)}
                      required
                      style={{ padding: '10px 12px', fontSize: '13px' }}
                    />
                    
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      style={{ padding: '10px 12px', fontSize: '13px' }}
                    >
                      <option value="">No category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px', alignItems: 'center' }}>
                    <label style={{ fontSize: '13px', fontWeight: '500' }}>Color:</label>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      style={{ width: '60px', height: '38px', padding: '2px', cursor: 'pointer', border: '2px solid var(--border)', borderRadius: '8px' }}
                    />
                    
                    <label style={{ fontSize: '13px', fontWeight: '500' }}>Reminder:</label>
                    <select
                      value={reminder}
                      onChange={(e) => setReminder(Number(e.target.value))}
                      style={{ padding: '8px 12px', fontSize: '13px' }}
                    >
                      <option value="0">No reminder</option>
                      <option value="1">1 day before</option>
                      <option value="3">3 days before</option>
                      <option value="7">7 days before</option>
                      <option value="30">30 days before</option>
                    </select>
                  </div>

                  {tags.length > 0 && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500' }}>
                        Tags:
                      </label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {tags.map(tag => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleTag(tag.id)}
                            className={selectedTags.includes(tag.id) ? 'badge badge-info' : 'badge'}
                            style={{
                              cursor: 'pointer',
                              opacity: selectedTags.includes(tag.id) ? 1 : 0.5,
                              background: selectedTags.includes(tag.id) ? 'var(--info)' : 'var(--border)'
                            }}
                          >
                            {tag.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                    <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span style={{ fontWeight: '500' }}>Private capsule</span>
                  </label>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="btn-success" disabled={loading} style={{ fontSize: '13px' }}>
                      {loading ? <span className="loading"></span> : (editingId ? 'Update' : 'Create')}
                    </button>
                    <button type="button" onClick={resetForm} className="btn-secondary" style={{ fontSize: '13px' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Capsules List */}
          <div>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600' }}>
                Capsules ({filteredCapsules.length})
              </h2>
            </div>
            
            {filteredCapsules.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '50px 20px' }}>
                <p style={{ color: 'var(--text-gray)', fontSize: '14px' }}>
                  {searchTerm || filter !== 'all' || showFavoritesOnly
                    ? 'No capsules match your filters'
                    : 'No capsules yet. Create your first capsule.'}
                </p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid-view' : 'list-view'}>
                {filteredCapsules.map((capsule) => (
                  <div 
                    key={capsule.id} 
                    className="card fade-in" 
                    style={{
                      borderLeft: '4px solid ' + (capsule.color || '#6366f1'),
                      position: 'relative'
                    }}
                  >
                    <button
                      onClick={() => toggleFavorite(capsule.id)}
                      style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'none',
                        border: 'none',
                        fontSize: '20px',
                        cursor: 'pointer',
                        color: capsule.isFavorite ? '#f59e0b' : 'var(--text-gray)',
                        padding: '4px'
                      }}
                    >
                      {capsule.isFavorite ? '★' : '☆'}
                    </button>

                    <div style={{ marginBottom: '12px', paddingRight: '30px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                        {capsule.title}
                      </h3>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '8px' }}>
                        {capsule.category && (
                          <span 
                            className="badge"
                            style={{ backgroundColor: capsule.category.color }}
                          >
                            {capsule.category.name}
                          </span>
                        )}
                        {capsule.tags && capsule.tags.map(tag => (
                          <span key={tag.id} className="badge badge-info">
                            {tag.name}
                          </span>
                        ))}
                        <span className={`badge ${capsule.isUnlocked ? 'badge-success' : 'badge-warning'}`}>
                          {capsule.isUnlocked ? 'Unlocked' : 'Locked'}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-gray)' }}>
                        Unlock: {new Date(capsule.unlockDate).toLocaleDateString()} • {capsule.viewCount} views • {capsule.isPrivate ? 'Private' : 'Public'}
                      </p>
                    </div>
                    
                    {capsule.isUnlocked && (
                      <p style={{
                        padding: '12px',
                        background: 'rgba(16, 185, 129, 0.05)',
                        borderRadius: '8px',
                        marginBottom: '12px',
                        fontSize: '13px',
                        lineHeight: '1.5',
                        borderLeft: '3px solid var(--success)'
                      }}>
                        {capsule.content}
                      </p>
                    )}
                    
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleEdit(capsule)}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(capsule.id)}
                        className="btn-danger"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="theme-toggle"
        title="Toggle theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </div>
  );
}

export default Dashboard;