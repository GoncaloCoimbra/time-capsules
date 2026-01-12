import { useState, useEffect, useRef } from 'react';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import '../styles/timeline.css';

function TimelineView({ capsules = [], onCapsuleClick, newCapsuleId = null }) {
  const [hoveredId, setHoveredId] = useState(null);
  const [timelineMode, setTimelineMode] = useState('vertical');
  const [showDrop, setShowDrop] = useState(false);
  const [dropTargetTop, setDropTargetTop] = useState(0);
  const [dropContent, setDropContent] = useState(null);
  const containerRef = useRef(null);

  // Ordenar cápsulas por data de desbloqueio
  const sortedCapsules = [...capsules].sort((a, b) => 
    new Date(a.unlockDate) - new Date(b.unlockDate)
  );

  // Parallax / scroll interactivity
  useEffect(() => {
    const container = document.querySelector('.timeline-vertical') || document.querySelector('.timeline-horizontal') || document.querySelector('.timeline-container');
    if (!container) return;

    const handleScroll = () => {
      const nodes = container.querySelectorAll('.timeline-item, .timeline-node');
      const rect = container.getBoundingClientRect();
      nodes.forEach((node, i) => {
        const nodeRect = node.getBoundingClientRect();
        const distance = (nodeRect.top + nodeRect.height / 2) - (rect.top + rect.height / 2);
        const depth = Math.max(-50, Math.min(50, -distance * 0.05));
        node.style.transform = `translateY(${depth}px)`;
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [capsules]);

  const getUnlockStatus = (capsule) => {
    // Usar o campo isUnlocked do servidor como fonte de verdade
    return capsule.isUnlocked ? 'unlocked' : 'locked';
  };

  const getDaysUntilUnlock = (unlockDate) => {
    const now = new Date();
    const unlock = new Date(unlockDate);
    const days = Math.ceil((unlock - now) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  // trigger drop animation when a new capsule id is provided
  useEffect(() => {
    if (!newCapsuleId) return;

    // small timeout to let DOM render
    setTimeout(() => {
      const container = containerRef.current || document.querySelector('.timeline-container');
      if (!container) return;
      const targetEl = container.querySelector(`[data-capsule-id='${newCapsuleId}']`);
      if (!targetEl) return;

      const containerRect = container.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      const top = targetRect.top - containerRect.top + targetRect.height / 2 - 20;

      const capsuleData = capsules.find(c => String(c.id) === String(newCapsuleId));

      setDropContent(capsuleData || { title: 'Nova Cápsula' });
      setDropTargetTop(top);
      setShowDrop(true);

      // hide drop after animation
      setTimeout(() => setShowDrop(false), 2200);
    }, 300);
  }, [newCapsuleId]);

  // Filtrar estatísticas corretamente
  const lockedCount = sortedCapsules.filter(c => !c.isUnlocked).length;
  const unlockedCount = sortedCapsules.filter(c => c.isUnlocked).length;
  const daysUntilNext = sortedCapsules
    .filter(c => !c.isUnlocked)
    .map(c => getDaysUntilUnlock(c.unlockDate))
    .filter(d => d > 0);
  const minDays = daysUntilNext.length > 0 ? Math.min(...daysUntilNext) : 0;

  return (
    <div className="timeline-container" ref={containerRef}>
      <div className="timeline-header">
        <h2>⏳ Timeline Temporal</h2>
        <div className="timeline-controls">
          <button 
            className={`timeline-btn ${timelineMode === 'vertical' ? 'active' : ''}`}
            onClick={() => setTimelineMode('vertical')}
          >
            📊 Vertical
          </button>
          <button 
            className={`timeline-btn ${timelineMode === 'horizontal' ? 'active' : ''}`}
            onClick={() => setTimelineMode('horizontal')}
          >
            ➡️ Horizontal
          </button>
        </div>
      </div>

      {timelineMode === 'vertical' ? (
        // Timeline Vertical
        <div className="timeline-vertical">
          {sortedCapsules.map((capsule, index) => {
            const status = getUnlockStatus(capsule);
            const daysLeft = getDaysUntilUnlock(capsule.unlockDate);
            
            return (
              <motion.div
                key={capsule.id}
                data-capsule-id={capsule.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`timeline-item ${index % 2 === 0 ? 'left' : 'right'}`}
                onMouseEnter={() => setHoveredId(capsule.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className={`timeline-content ${status}`}>
                  <div className={`timeline-dot ${status}`} />
                  
                  <motion.div 
                    className="timeline-card"
                    whileHover={{ scale: 1.05, y: -5 }}
                    onClick={() => onCapsuleClick?.(capsule)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-header">
                      <div 
                        className="card-color-indicator" 
                        style={{ backgroundColor: capsule.color || '#6366f1' }}
                      />
                      <h3>{capsule.title}</h3>
                      <span className={`status-badge ${status}`}>
                        {status === 'unlocked' ? '🔓 Desbloqueado' : `🔒 ${daysLeft}d`}
                      </span>
                    </div>

                    <p className="card-preview">
                      {status === 'unlocked' 
                        ? capsule.content.substring(0, 100) + '...'
                        : '🔒 Conteúdo bloqueado até ' + format(new Date(capsule.unlockDate), 'dd/MM/yyyy', { locale: ptBR })
                      }
                    </p>

                    <div className="card-meta">
                      <span>📅 {format(new Date(capsule.unlockDate), 'dd MMM yyyy', { locale: ptBR })}</span>
                      {capsule.category && <span>📁 {capsule.category.name}</span>}
                      {capsule.viewCount > 0 && <span>👁️ {capsule.viewCount} views</span>}
                    </div>

                    {hoveredId === capsule.id && (
                      <motion.div 
                        className="card-hover-action"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        {status === 'unlocked' ? 'Ver Detalhes →' : 'Ver Informações →'}
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        // Timeline Horizontal
        <div className="timeline-horizontal">
          <div className="timeline-track">
            {sortedCapsules.map((capsule, index) => {
              const status = getUnlockStatus(capsule);
              const daysLeft = getDaysUntilUnlock(capsule.unlockDate);

              return (
                <motion.div
                  key={capsule.id}
                  data-capsule-id={capsule.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`timeline-node ${status}`}
                  onMouseEnter={() => setHoveredId(capsule.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => onCapsuleClick?.(capsule)}
                  style={{ cursor: 'pointer' }}
                >
                  <motion.div 
                    className="node-dot"
                    whileHover={{ scale: 1.3, boxShadow: '0 0 20px rgba(226, 183, 20, 0.8)' }}
                  >
                    <div 
                      className="node-inner"
                      style={{ backgroundColor: capsule.color || '#6366f1' }}
                    />
                  </motion.div>

                  {hoveredId === capsule.id && (
                    <motion.div 
                      className="node-tooltip"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <h4>{capsule.title}</h4>
                      <p>{format(new Date(capsule.unlockDate), 'dd MMM yyyy', { locale: ptBR })}</p>
                      <span className={`badge ${status}`}>
                        {status === 'unlocked' ? '🔓 Desbloqueado' : `🔒 ${daysLeft}d`}
                      </span>
                    </motion.div>
                  )}

    
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Drop overlay (global) */}
      {showDrop && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: dropTargetTop, zIndex: 90 }}
          className="drop-animation"
        >
          <div style={{ background: '#0f172a', color: '#e2b714', padding: 12, borderRadius: 8, boxShadow: '0 10px 30px rgba(2,6,23,0.6)' }}>
            <div style={{ fontSize: 12, opacity: 0.9 }}>Novo</div>
            <div style={{ fontWeight: 700 }}>{dropContent?.title || 'Nova Cápsula'}</div>
          </div>
        </motion.div>
      )}

      <div className="timeline-stats">
        <div className="stat">
          <span className="stat-icon">📦</span>
          <div>
            <span className="stat-number">{sortedCapsules.length}</span>
            <span className="stat-label">Total de Cápsulas</span>
          </div>
        </div>
        <div className="stat">
          <span className="stat-icon">🔒</span>
          <div>
            <span className="stat-number">{lockedCount}</span>
            <span className="stat-label">Bloqueadas</span>
          </div>
        </div>
        <div className="stat">
          <span className="stat-icon">🔓</span>
          <div>
            <span className="stat-number">{unlockedCount}</span>
            <span className="stat-label">Desbloqueadas</span>
          </div>
        </div>
        <div className="stat">
          <span className="stat-icon">⏰</span>
          <div>
            <span className="stat-number">{minDays}</span>
            <span className="stat-label">Dias até próximo</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimelineView;