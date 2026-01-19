import React from 'react';
import './features.css';

export default function FeatureCard({ title, desc, icon }){
  return (
    <div className="jl-feature-card">
      <div className="jl-feature-icon">{icon || '★'}</div>
      <h4 className="jl-feature-title">{title}</h4>
      <p className="jl-feature-desc">{desc}</p>
    </div>
  );
}
