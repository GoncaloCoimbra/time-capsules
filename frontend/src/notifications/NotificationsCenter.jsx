import React, { useState, useEffect } from 'react';
import './notifications.css';
import { fetchNotifications, markAsRead } from '../services/notificationService';

export default function NotificationsCenter(){
  const [items, setItems] = useState([]);

  useEffect(()=>{
    let mounted = true;
    fetchNotifications().then(rs=>{ if(mounted) setItems(rs || []); });
    return ()=> mounted=false;
  },[]);

  const handleMark = async (id) => {
    await markAsRead(id);
    setItems(prev => prev.map(i => i.id===id? {...i, read:true}: i));
  };

  return (
    <div className="notif-center">
      <h4>Notificações</h4>
      <ul>
        {items.map(it => (
          <li key={it.id} className={it.read? 'read':''}>
            <div className="notif-body">{it.text}</div>
            <div className="notif-actions"><button onClick={()=>handleMark(it.id)}>Marcar como lida</button></div>
          </li>
        ))}
      </ul>
    </div>
  );
}
