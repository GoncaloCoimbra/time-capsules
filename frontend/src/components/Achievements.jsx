import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import '../styles/achievements.css';

function Achievements({ capsules = [], statistics = null }) {
  const [achievements, setAchievements] = useState([]);
  const [unlockedCount, setUnlockedCount] = useState(0);

  // Definição de todos os achievements
  const allAchievements = [
    {
      id: 1,
      name: 'Primeiro Passo',
      description: 'Crie sua primeira cápsula temporal',
      icon: '🚀',
      condition: () => capsules.length >= 1,
      difficulty: 'easy',
      reward: '10 XP'
    },
    {
      id: 2,
      name: 'Colecionador',
      description: 'Crie 5 cápsulas temporais',
      icon: '🎁',
      condition: () => capsules.length >= 5,
      difficulty: 'medium',
      reward: '50 XP'
    },
    {
      id: 3,
      name: 'Mestre Temporal',
      description: 'Crie 20 cápsulas temporais',
      icon: '👑',
      condition: () => capsules.length >= 20,
      difficulty: 'hard',
      reward: '200 XP'
    },
    {
      id: 4,
      name: 'Explorador',
      description: 'Crie cápsulas em 3 categorias diferentes',
      icon: '🗺️',
      condition: () => {
        const categories = new Set(capsules.map(c => c.categoryId));
        return categories.size >= 3;
      },
      difficulty: 'medium',
      reward: '75 XP'
    },
    {
      id: 5,
      name: 'Desbloqueador',
      description: 'Tenha 5 cápsulas desbloqueadas',
      icon: '',
      condition: () => {
        const unlocked = capsules.filter(c => c.isUnlocked);
        return unlocked.length >= 5;
      },
      difficulty: 'medium',
      reward: '60 XP'
    },
    {
      id: 6,
      name: 'Paciência é Virtude',
      description: 'Tenha uma cápsula aguardando desbloqueio há mais de 30 dias',
      icon: '⏳',
      condition: () => {
        const now = new Date();
        return capsules.some(c => {
          const days = Math.floor((now - new Date(c.createdAt)) / (1000 * 60 * 60 * 24));
          return days > 30 && !c.isUnlocked;
        });
      },
      difficulty: 'hard',
      reward: '100 XP'
    },
    {
      id: 7,
      name: 'Taggeiro',
      description: 'Use 5 tags diferentes em suas cápsulas',
      icon: '',
      condition: () => {
        const tags = new Set();
        capsules.forEach(c => {
          if (c.tags) {
            c.tags.forEach(tag => tags.add(tag.id));
          }
        });
        return tags.size >= 5;
      },
      difficulty: 'medium',
      reward: '50 XP'
    },
    {
      id: 8,
      name: 'Celebridade',
      description: 'Tenha uma cápsula com 50 visualizações',
      icon: '⭐',
      condition: () => capsules.some(c => c.viewCount >= 50),
      difficulty: 'hard',
      reward: '150 XP'
    },
    {
      id: 9,
      name: 'Socialite',
      description: 'Compartilhe uma cápsula com alguém',
      icon: '🤝',
      condition: () => capsules.some(c => !c.isPrivate),
      difficulty: 'easy',
      reward: '25 XP'
    },
    {
      id: 10,
      name: 'Favorito das Massas',
      description: 'Tenha 3 cápsulas marcadas como favorito',
      icon: '',
      condition: () => capsules.filter(c => c.isFavorite).length >= 3,
      difficulty: 'medium',
      reward: '60 XP'
    }
  ];

  useEffect(() => {
    // Calcular achievements desbloqueados
    const unlocked = allAchievements.filter(ach => ach.condition());
    setAchievements(allAchievements);
    setUnlockedCount(unlocked.length);
  }, [capsules]);

  const isUnlocked = (achievement) => achievement.condition();

  const getTotalXP = () => {
    return achievements
      .filter(ach => isUnlocked(ach))
      .reduce((total, ach) => {
        const xp = parseInt(ach.reward.split(' ')[0]);
        return total + xp;
      }, 0);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return '#10b981';
      case 'medium':
        return '#f59e0b';
      case 'hard':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'Fácil';
      case 'medium':
        return 'Médio';
      case 'hard':
        return 'Difícil';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <div className="achievements-container">
      <div className="achievements-header">
        <h2>🏆 Achievements & Badges</h2>
        <div className="achievements-summary">
          <div className="summary-stat">
            <span className="summary-icon">🎯</span>
            <div>
              <span className="summary-value">{unlockedCount}/{achievements.length}</span>
              <span className="summary-label">Desbloqueados</span>
            </div>
          </div>
          <div className="summary-stat">
            <span className="summary-icon">⭐</span>
            <div>
              <span className="summary-value">{getTotalXP()}</span>
              <span className="summary-label">XP Total</span>
            </div>
          </div>
          <div className="summary-stat">
            <span className="summary-icon">📈</span>
            <div>
              <span className="summary-value">{Math.round((unlockedCount / achievements.length) * 100)}%</span>
              <span className="summary-label">Progresso</span>
            </div>
          </div>
        </div>
      </div>

      <div className="achievements-progress">
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <span className="progress-text">
          {unlockedCount} de {achievements.length} achievements desbloqueados
        </span>
      </div>

      <div className="achievements-grid">
        {achievements.map((achievement, index) => {
          const unlocked = isUnlocked(achievement);
          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`achievement-card ${unlocked ? 'unlocked' : 'locked'}`}
            >
              <div className="achievement-badge-container">
                <div className="achievement-icon">{achievement.icon}</div>
                {unlocked && (
                  <motion.div 
                    className="unlock-indicator"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    ✓
                  </motion.div>
                )}
              </div>

              <div className="achievement-content">
                <h3>{achievement.name}</h3>
                <p>{achievement.description}</p>

                <div className="achievement-meta">
                  <span 
                    className="difficulty"
                    style={{ borderColor: getDifficultyColor(achievement.difficulty) }}
                  >
                    {getDifficultyLabel(achievement.difficulty)}
                  </span>
                  <span className="reward">
                    +{achievement.reward}
                  </span>
                </div>
              </div>

              {!unlocked && (
                <div className="locked-overlay">
                  <span> Bloqueado</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="achievements-tips">
        <h3>💡 Dicas para Desbloquear Mais Achievements</h3>
        <ul>
          <li>Crie mais cápsulas em diferentes categorias</li>
          <li> Use diferentes tags para organizar suas cápsulas</li>
          <li> Compartilhe suas cápsulas com a comunidade</li>
          <li> Marque cápsulas favoritas que você ama</li>
          <li> Aguarde o desbloqueio de cápsulas antigas</li>
          <li> Crie cápsulas públicas para ganhar visualizações</li>
        </ul>
      </div>
    </div>
  );
}

export default Achievements;
