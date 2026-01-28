/**
 * Componente de Busca e Filtro Avançado
 * 
 * Permite aos utilizadores pesquisar e filtrar cápsulas por:
 * - Texto de busca (título e conteúdo)
 * - Categoria
 * - Estado (bloqueadas/desbloqueadas)
 * - Intervalo de datas
 * - Tags múltiplas
 * 
 * O componente aplica filtros em tempo real e notifica o componente pai
 * através da função onFilter() com a lista filtrada.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import '../styles/searchFilter.css';

function SearchFilter({ 
  capsules = [], 
  categories = [], 
  tags = [], 
  onFilter 
}) {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all'); // all, locked, unlocked
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  /**
   * Efeito para aplicar filtros
   * Executa sempre que qualquer filtro muda
   * Filtra a lista de cápsulas e comunica ao componente pai
   */
  useEffect(() => {
    const filtered = capsules.filter(capsule => {
      // Filtro de pesquisa: procura no título e conteúdo (case-insensitive)
      if (searchText && !capsule.title.toLowerCase().includes(searchText.toLowerCase()) &&
          !capsule.content.toLowerCase().includes(searchText.toLowerCase())) {
        return false;
      }

      // Filtro de categoria: verifica se a cápsula pertence à categoria selecionada
      if (selectedCategory && capsule.categoryId !== selectedCategory) {
        return false;
      }

      // Filtro de tags: a cápsula deve ter TODAS as tags selecionadas
      if (selectedTags.length > 0) {
        const capsuleTags = capsule.tags?.map(t => t.id) || [];
        const hasAllTags = selectedTags.every(tag => capsuleTags.includes(tag));
        if (!hasAllTags) return false;
      }

      // Filtro de estado: verifica se a cápsula está bloqueada ou desbloqueada
      if (statusFilter !== 'all') {
        const isUnlocked = capsule.isUnlocked || new Date(capsule.unlockDate) <= new Date();
        if (statusFilter === 'locked' && isUnlocked) return false;
        if (statusFilter === 'unlocked' && !isUnlocked) return false;
      }

      // Filtro de intervalo de datas: verifica se a data de desbloqueio está dentro do intervalo
      if (dateFrom || dateTo) {
        const unlockDate = new Date(capsule.unlockDate);
        if (dateFrom && unlockDate < new Date(dateFrom)) return false;
        if (dateTo && unlockDate > new Date(dateTo)) return false;
      }

      return true;
    });

    // Notifica o componente pai com a lista filtrada
    onFilter(filtered);
  }, [searchText, selectedCategory, selectedTags, statusFilter, dateFrom, dateTo, capsules]);

  const toggleTag = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const resetFilters = () => {
    setSearchText('');
    setSelectedCategory('');
    setSelectedTags([]);
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const activeFiltersCount = 
    (searchText ? 1 : 0) +
    (selectedCategory ? 1 : 0) +
    (selectedTags.length > 0 ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (dateFrom || dateTo ? 1 : 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="search-filter-container"
    >
      {/* Search Bar */}
      <div className="search-bar">
        <svg className="search-icon" viewBox="0 0 24 24">
          <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <input 
          type="text"
          placeholder={t('dashboard.search') || 'Procurar cápsulas...'}
          className="search-input"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        {searchText && (
          <button 
            className="clear-search"
            onClick={() => setSearchText('')}
            title="Limpar busca"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter Toggle Button */}
      <button 
        className="filter-toggle-btn"
        onClick={() => setShowFilters(!showFilters)}
      >
        <svg viewBox="0 0 24 24">
          <path fill="currentColor" d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39A.998.998 0 0019.5 4H4.5c-.45 0-.67.54-.25 1.61z"/>
        </svg>
        {t('dashboard.filters') || 'Filtros'}
        {activeFiltersCount > 0 && (
          <span className="filter-badge">{activeFiltersCount}</span>
        )}
      </button>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="filters-panel"
        >
          {/* Category Filter */}
          <div className="filter-group">
            <label>{t('dashboard.category') || 'Categoria'}</label>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              <option value="">{t('dashboard.allCategories') || 'Todas as categorias'}</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="filter-group">
            <label>{t('dashboard.status') || 'Status'}</label>
            <div className="filter-options">
              <label>
                <input 
                  type="radio" 
                  value="all" 
                  checked={statusFilter === 'all'}
                  onChange={(e) => setStatusFilter(e.target.value)}
                />
                {t('dashboard.all') || 'Todos'}
              </label>
              <label>
                <input 
                  type="radio" 
                  value="locked" 
                  checked={statusFilter === 'locked'}
                  onChange={(e) => setStatusFilter(e.target.value)}
                />
                🔒 {t('dashboard.locked') || 'Bloqueadas'}
              </label>
              <label>
                <input 
                  type="radio" 
                  value="unlocked" 
                  checked={statusFilter === 'unlocked'}
                  onChange={(e) => setStatusFilter(e.target.value)}
                />
                🔓 {t('dashboard.unlocked') || 'Desbloqueadas'}
              </label>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="filter-group">
            <label>{t('dashboard.dateRange') || 'Intervalo de datas'}</label>
            <div className="date-range">
              <input 
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="filter-input"
                placeholder="De"
              />
              <span>-</span>
              <input 
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="filter-input"
                placeholder="Até"
              />
            </div>
          </div>

          {/* Tags Filter */}
          {tags.length > 0 && (
            <div className="filter-group">
              <label>{t('dashboard.tags') || 'Tags'}</label>
              <div className="tags-filter">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    className={`tag-filter-btn ${selectedTags.includes(tag.id) ? 'selected' : ''}`}
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reset Button */}
          {activeFiltersCount > 0 && (
            <button 
              className="reset-filters-btn"
              onClick={resetFilters}
            >
              {t('dashboard.clearFilters') || 'Limpar filtros'}
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

export default SearchFilter;
