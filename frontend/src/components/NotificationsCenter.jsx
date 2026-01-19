import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { fetchNotifications, markAsRead, startPollingNotifications } from '../services/notificationService';

export default function NotificationsCenter({ initialNotifications = [], onUpdate }){
  const [notifications, setNotifications] = useState(initialNotifications || []);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

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
      toast.success('Todas as notificações marcadas como lidas');
    } catch (err) {
      console.error('markAll error', err);
      toast.error('Erro ao marcar todas como lidas');
    }
  };

  const start = (page-1)*pageSize;
  const visible = notifications.slice(start, start+pageSize);

  return (
    <div className="chronicle-card main-card">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2>Notificações</h2>
        <div>
          <button className="btn-secondary" onClick={handleMarkAll}>Marcar tudo como lido</button>
        </div>
      </div>

      {loading && <p>Carregando...</p>}

      <ul className="notifications-list">
        {visible.map(n => (
          <li key={n.id} className={`notification-item ${n.read ? 'read' : 'unread'}`}>
            <div className="notif-body">
              <strong>{n.type}</strong>
              <span className="notif-meta">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</span>
              <p>{n.meta?.text || n.text || ''}</p>
            </div>
            <div className="notif-actions">
              {!n.read && <button onClick={() => handleMarkRead(n.id)}>{'Marcar como lida'}</button>}
            </div>
          </li>
        ))}
      </ul>

      <div style={{ display:'flex', justifyContent:'space-between', marginTop:12 }}>
        <div style={{ color:'#94a3b8' }}>{notifications.length} totais</div>
        <div>
          <button className="btn-secondary" onClick={() => setPage(p => Math.max(1, p-1))}>Anterior</button>
          <span style={{ margin: '0 8px' }}>{page}</span>
          <button className="btn-secondary" onClick={() => setPage(p => p+1)}>Próximo</button>
        </div>
      </div>
    </div>
  );
}
