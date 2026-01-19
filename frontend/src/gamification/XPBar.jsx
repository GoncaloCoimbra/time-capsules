import React from 'react';
import './gamification.css';

export default function XPBar({ xp=120, next=200 }){
  const pct = Math.min(100, Math.round((xp/next)*100));
  return (
    <div className="xp-bar">
      <div className="xp-label">XP {xp}/{next}</div>
      <div className="xp-track"><div className="xp-fill" style={{ width: pct+'%' }} /></div>
    </div>
  );
}
