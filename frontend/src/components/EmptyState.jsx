import { motion } from 'framer-motion';
import '../styles/emptyState.css';

function EmptyState({ 
  icon = '📭', 
  title = 'Nenhum resultado', 
  description = 'Comece criando algo novo', 
  action = null,
  actionLabel = 'Criar',
  actionIcon = '✨'
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="empty-state"
    >
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {action && (
        <button 
          onClick={action}
          className="empty-state-button"
        >
          <span>{actionIcon}</span>
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}

export default EmptyState;
