import React from 'react';
import './gamification.css';

export default function Badges({ badges = ['Early','Streak'] }){
  return (
    <div className="badges">
      {badges.map(b => <span key={b} className="badge">{b}</span>)}
    </div>
  );
}
