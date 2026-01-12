import { useState } from 'react';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import '../styles/timeline.css';

function TimelineView({ capsules = [], onCapsuleClick }) {
  const [hoveredId, setHoveredId] = useState(null);
  const [timelineMode, setTimelineMode] = useState('vertical');

  // Ordenar cápsulas por data de desbloqueio
  const sortedCapsules = [...capsules].sort((a, b) => 
    new Date(a.unlockDate) - new Date(b.unlockDate)
  );

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

  // Filtrar estatísticas corretamente
  const lockedCount = sortedCapsules.filter(c => !c.isUnlocked).length;
  const unlockedCount = sortedCapsules.filter(c => c.isUnlocked).length;
  const daysUntilNext = sortedCapsules
    .filter(c => !c.isUnlocked)
    .map(c => getDaysUntilUnlock(c.unlockDate))
    .filter(d => d > 0);
  const minDays = daysUntilNext.length > 0 ? Math.min(...daysUntilNext) : 0;

  return (
    <div className="timeline-container">
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