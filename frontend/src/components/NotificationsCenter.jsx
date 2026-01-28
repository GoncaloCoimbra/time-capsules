import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchNotifications, markAsRead, startPollingNotifications } from '../services/notificationService';

/**
 * Mapear tipos de notificação para ícones e cores
 */
const getNotificationIcon = (type) => {
  const icons = {
    follow: '👤',
    follow_request: '👋',
    like: '👍',
    comment: '💬',
    capsule_view: '👁️',
    follow_approved: '✅',
    reminder: '🔔'
  };
  return icons[type] || '📬';
};

const getNotificationColor = (type) => {
  const colors = {
    follow: '#3b82f6',
    follow_request: '#f59e0b',
    like: '#ef4444',
    comment: '#8b5cf6',
    capsule_view: '#10b981',
    follow_approved: '#10b981',
    reminder: '#06b6d4'
  };
  return colors[type] || '#6b7280';
};

const getNotificationLabel = (type) => {
  const labels = {
    follow: 'Novo Seguidor',
    follow_request: 'Pedido de Seguimento',
    like: 'Reação',
    comment: 'Novo Comentário',
    capsule_view: 'Visualização',
    follow_approved: 'Seguimento Aprovado',
    reminder: 'Lembrete'
  };
  return labels[type] || type;
};

export default function NotificationsCenter({ initialNotifications = [], onUpdate }){
  const [notifications, setNotifications] = useState(initialNotifications || []);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    setNotifications(initialNotifications || []);
  }, [initialNotifications]);

  useEffect(() => {
    let stop = startPollingNotifications((list) => {
      setNotifications(list || []);
      if (onUpdate) onUpdate(list || []);
    }, 30000);
    return () => stop && stop();
  }, []);

  const loadOnce = async () => {
    setLoading(true);
    try {
      const list = await fetchNotifications();
      setNotifications(list || []);
      if (onUpdate) onUpdate(list || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOnce(); }, []);

  const handleMarkRead = async (id)=>{
    const ok = await markAsRead(id);
    if (ok) {
      const next = notifications.map(n => n.id === id ? { ...n, read: true } : n);
      setNotifications(next);
      if (onUpdate) onUpdate(next);
    } else {
      toast.error('Erro ao marcar como lida');
    }
  };

  const handleMarkAll = async ()=>{
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return toast('Sem notificações por marcar');
    try {
      await Promise.all(unread.map(n => markAsRead(n.id)));
      const next = notifications.map(n => ({ ...n, read: true }));
      setNotifications(next);
      if (onUpdate) onUpdate(next);
      toast.success('✅ Todas as notificações marcadas como lidas');
    } catch (err) {
      console.error('markAll error', err);
      toast.error('Erro ao marcar todas como lidas');
    }
  };

  const start = (page-1)*pageSize;
  const visible = notifications.slice(start, start+pageSize);
  const unreadCount = notifications.filter(n => !n.read).length;
  const totalPages = Math.ceil(notifications.length / pageSize);

  const formatTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    
    return notifDate.toLocaleDateString('pt-PT', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="notifications-container">
      <style jsx>{`
        .notifications-container {
          min-height: 500px;
          padding: 0;
        }

        .notif-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
          margin-bottom: 0;
          border-radius: 12px 12px 0 0;
        }

        .notif-header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #e2e8f0;
        }

        .notif-badge {
          display: inline-block;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .notif-header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .btn-mark-all {
          padding: 10px 16px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .btn-mark-all:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }

        .btn-mark-all:active {
          transform: translateY(0);
        }

        .notif-content {
          padding: 24px;
          min-height: 300px;
        }

        .notif-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .notif-card {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 16px;
          align-items: center;
          padding: 16px;
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.5) 100%);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 12px;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .notif-card:hover {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.7) 100%);
          border-color: rgba(148, 163, 184, 0.2);
          transform: translateX(4px);
        }

        .notif-card.unread {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%);
          border-left: 4px solid #3b82f6;
          border-color: #3b82f6;
        }

        .notif-icon {
          font-size: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(148, 163, 184, 0.1);
          flex-shrink: 0;
          animation: pulse 2s ease-in-out infinite;
        }

        .notif-card.read .notif-icon {
          animation: none;
          opacity: 0.6;
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
          }
        }

        .notif-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .notif-title {
          font-weight: 600;
          color: #e2e8f0;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .notif-label {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .notif-message {
          font-size: 13px;
          color: #cbd5e1;
          line-height: 1.4;
          margin: 0;
        }

        .notif-time {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 4px;
        }

        .notif-action {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .btn-mark-read {
          padding: 8px 12px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.3s ease;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
        }

        .btn-mark-read:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .notif-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 60px 20px;
          color: #94a3b8;
        }

        .empty-icon {
          font-size: 64px;
          opacity: 0.5;
        }

        .empty-text {
          text-align: center;
          max-width: 300px;
        }

        .empty-text h3 {
          margin: 0 0 8px 0;
          color: #cbd5e1;
          font-size: 16px;
        }

        .empty-text p {
          margin: 0;
          font-size: 13px;
          color: #94a3b8;
        }

        .notif-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 40px;
          gap: 12px;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(59, 130, 246, 0.2);
          border-top: 2px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .notif-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: rgba(15, 23, 42, 0.5);
          border-top: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 0 0 12px 12px;
          font-size: 13px;
          color: #94a3b8;
        }

        .pagination-controls {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .btn-pagination {
          padding: 8px 12px;
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 12px;
          transition: all 0.3s ease;
        }

        .btn-pagination:hover {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.5);
        }

        .btn-pagination:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-info {
          padding: 4px 12px;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 6px;
          min-width: 60px;
          text-align: center;
        }

        @media (max-width: 768px) {
          .notif-header {
            padding: 16px;
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }

          .notif-header-actions {
            width: 100%;
          }

          .btn-mark-all {
            width: 100%;
          }

          .notif-card {
            grid-template-columns: auto 1fr;
            gap: 12px;
          }

          .notif-action {
            grid-column: 2;
            justify-content: flex-start;
            margin-top: -8px;
          }

          .notif-footer {
            flex-direction: column;
            gap: 12px;
            padding: 12px 16px;
          }

          .pagination-controls {
            width: 100%;
            justify-content: space-around;
          }
        }
      `}</style>

      <div className="notif-header">
        <h2>
          🔔 Notificações
          {unreadCount > 0 && <span className="notif-badge">{unreadCount} nova{unreadCount !== 1 ? 's' : ''}</span>}
        </h2>
        <div className="notif-header-actions">
          <button className="btn-mark-all" onClick={handleMarkAll} disabled={unreadCount === 0}>
            {unreadCount > 0 ? `Marcar ${unreadCount} como lida${unreadCount !== 1 ? 's' : ''}` : 'Todas lidas'}
          </button>
        </div>
      </div>

      <div className="notif-content">
        {loading ? (
          <div className="notif-loading">
            <div className="loading-spinner"></div>
            <span>Carregando notificações...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notif-empty">
            <div className="empty-icon">📭</div>
            <div className="empty-text">
              <h3>Sem notificações</h3>
              <p>Quando tiveres novas interações, aparecerão aqui</p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <ul className="notif-list">
              {visible.map((n) => (
                <motion.li
                  key={n.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className={`notif-card ${n.read ? 'read' : 'unread'}`}
                >
                  <div className="notif-icon" style={{ background: `${getNotificationColor(n.type)}20` }}>
                    {getNotificationIcon(n.type)}
                  </div>

                  <div className="notif-body">
                    <div className="notif-title">
                      <span className="notif-label" style={{ backgroundColor: `${getNotificationColor(n.type)}30`, color: getNotificationColor(n.type) }}>
                        {getNotificationLabel(n.type)}
                      </span>
                    </div>
                    <p className="notif-message">{n.meta?.text || n.text || 'Nova notificação'}</p>
                    <span className="notif-time">{formatTime(n.createdAt)}</span>
                  </div>

                  <div className="notif-action">
                    {!n.read && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-mark-read"
                        onClick={() => handleMarkRead(n.id)}
                      >
                        Marcar como lida
                      </motion.button>
                    )}
                  </div>
                </motion.li>
              ))}
            </ul>
          </AnimatePresence>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="notif-footer">
          <span>{notifications.length} notificação{notifications.length !== 1 ? 's' : ''} no total</span>
          <div className="pagination-controls">
            <button
              className="btn-pagination"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ← Anterior
            </button>
            <span className="page-info">{page} / {totalPages}</span>
            <button
              className="btn-pagination"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Próximo →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
