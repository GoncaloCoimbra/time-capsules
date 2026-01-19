import React from 'react';
import './onboarding.css';

export default function WelcomeModal({ open = false, onClose = () => {} }){
  if (!open) return null;
  return (
    <div className="onb-overlay" onClick={onClose}>
      <div className="onb-modal" onClick={e => e.stopPropagation()}>
        <h2>Bem-vindo ao Time Chronicle</h2>
        <p>Vamos começar com um pequeno tour para configurar a tua primeira cápsula.</p>
        <ul>
          <li>Criar cápsula</li>
          <li>Definir data de desbloqueio</li>
          <li>Partilhar ou manter privada</li>
        </ul>
        <div className="onb-actions">
          <button className="jl-cta jl-cta-secondary" onClick={onClose}>Pular</button>
          <button className="jl-cta jl-cta-primary" onClick={onClose}>Começar Tour</button>
        </div>
      </div>
    </div>
  );
}
